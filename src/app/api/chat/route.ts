import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT } from "@/lib/chat/knowledge";
import { chatRequestSchema } from "@/lib/chat/schema";
import { clientKey, rateLimit } from "@/lib/chat/rate-limit";

/**
 * The chat box's AI half.
 *
 * Streams a reply from Claude, grounded in lib/chat/knowledge.ts and nothing
 * else, and records both sides of the exchange so that a visitor who then asks
 * for a person arrives with their transcript attached.
 *
 * Two things about this endpoint are worth holding on to:
 *
 *   It is public and it costs money per call. Hence the rate limit and the
 *   bounded request body — see rate-limit.ts for what that limiter does and
 *   does not protect against.
 *
 *   It can be unconfigured. Without ANTHROPIC_API_KEY the site still works and
 *   the chat box still opens; the AI half answers 503 with a message, and the
 *   widget falls through to the human option. A marketing site should not have
 *   a dead button on it because an environment variable is missing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A streamed reply can outrun the default serverless ceiling. */
export const maxDuration = 30;

/** Per caller, per minute. Generous for a person, tight for a script. */
const LIMIT = { limit: 12, windowMs: 60_000 };

/**
 * Claude Opus 5 with adaptive thinking at low effort. A grounded FAQ answer is
 * not a reasoning problem and this is a chat box, where latency is the thing
 * the visitor actually feels — but thinking stays on rather than disabled,
 * which on this model is the setting that behaves predictably.
 */
const MODEL = "claude-opus-5";

function json(body: unknown, status: number, headers?: HeadersInit) {
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "unconfigured",
        message:
          "The assistant is not available right now. Use “Speak to a person” below and someone will get back to you.",
      },
      503
    );
  }

  const limited = rateLimit(clientKey(request), LIMIT);
  if (!limited.ok) {
    return json(
      {
        error: "rate_limited",
        message: "That's a lot of questions at once — give it a moment.",
      },
      429,
      { "Retry-After": String(limited.retryAfter) }
    );
  }

  let parsed;
  try {
    parsed = chatRequestSchema.safeParse(await request.json());
  } catch {
    return json({ error: "bad_request", message: "Malformed request." }, 400);
  }
  if (!parsed.success) {
    return json(
      {
        error: "bad_request",
        message: parsed.error.issues[0]?.message ?? "Invalid request.",
      },
      400
    );
  }
  const { conversationId, messages, message, path } = parsed.data;

  // Reuse the conversation the browser was given, but only if it is real — an
  // id from an older database or a hand-typed one must not 500 the endpoint.
  let convo =
    conversationId != null
      ? await prisma.chatConversation.findUnique({
          where: { id: conversationId },
          select: { id: true, mode: true },
        })
      : null;

  // Once a person is involved, the assistant stops. Two voices answering the
  // same question — one of them a machine paraphrasing a brief — is the thing
  // that makes a live chat feel fake, and a stale tab must not be able to put
  // words in the conversation while a real member of staff is typing.
  if (convo && convo.mode !== "BOT") {
    return json(
      {
        error: "live",
        message: "You're talking to a person now.",
        mode: convo.mode,
      },
      409
    );
  }

  if (!convo) {
    convo = await prisma.chatConversation.create({
      data: { path },
      select: { id: true, mode: true },
    });
  }

  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: "USER", content: message },
  });

  const anthropic = new Anthropic({ apiKey });

  const stream = anthropic.messages.stream(
    {
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      messages: [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    },
    // Abandon the upstream call if the visitor closes the box mid-answer.
    { signal: request.signal }
  );

  const encoder = new TextEncoder();
  const conversationIdForClient = convo.id;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // A refusal arrives as a successful response with empty content, so it
        // has to be checked rather than caught. Route it to a person: a family
        // asking something the model declines should get a human, not silence.
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && full.length === 0) {
          full =
            "I can't help with that one. Use “Speak to a person” below and someone here will pick it up.";
          controller.enqueue(encoder.encode(full));
        }
      } catch (error) {
        // The visitor navigated away or closed the panel; nothing to report.
        if (!request.signal.aborted) {
          console.error("[chat] stream failed", error);
          if (full.length === 0) {
            const fallback =
              "Something went wrong reaching the assistant. Use “Speak to a person” below and someone will get back to you.";
            full = fallback;
            controller.enqueue(encoder.encode(fallback));
          }
        }
      } finally {
        controller.close();
        if (full.length > 0) {
          // Best effort: a transcript that fails to save must not turn an
          // answer the visitor already read into an error.
          await prisma.chatMessage
            .create({
              data: {
                conversationId: conversationIdForClient,
                role: "ASSISTANT",
                content: full,
              },
            })
            .catch((error) =>
              console.error("[chat] could not save reply", error)
            );
        }
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // How the browser learns which conversation it is in. The body is plain
      // text so the id cannot ride along inside it.
      "X-Conversation-Id": conversationIdForClient,
    },
  });
}
