import { z } from "zod";

/**
 * Wire shapes for the two chat endpoints.
 *
 * The limits are deliberately tight. /api/chat is an unauthenticated endpoint
 * that spends money per token on a public marketing site, so the request body
 * is the first place to bound what a stranger can make it do: a capped message
 * length and a capped history keep the cost of one call bounded, whatever the
 * caller sends.
 */

/** One turn of the conversation as the browser has it. */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  /**
   * Set once the server has created a conversation, then echoed back on every
   * later message so the transcript stays in one row. Absent on the first
   * message of a session.
   */
  conversationId: z.string().cuid().optional(),
  /**
   * The history as the browser has it, oldest first, *not* including the new
   * message. Capped: the server does not replay from the database, so this is
   * what the model sees, and 24 turns is far more than a booking question needs.
   */
  messages: z.array(chatMessageSchema).max(24).default([]),
  message: z.string().trim().min(1, "Type a message").max(2000),
  /** Marketing page the box was opened on. Recorded with the conversation. */
  path: z.string().max(200).optional(),
});

/**
 * Asking for a person: the visitor leaves a name and an email and joins the
 * queue. The email is required even though the chat is live, because the most
 * likely outcome of a queue is that the visitor gets bored and closes the tab,
 * and without it there is no way to finish the conversation they started.
 */
export const liveRequestSchema = z.object({
  conversationId: z.string().cuid().optional(),
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z
    .string()
    .trim()
    .min(1, "Tell us what you need help with")
    .max(2000),
  path: z.string().max(200).optional(),
});

/** A visitor's turn once a person has joined. */
export const liveMessageSchema = z.object({
  conversationId: z.string().cuid(),
  message: z.string().trim().min(1).max(2000),
});

export const liveEndSchema = z.object({
  conversationId: z.string().cuid(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type LiveRequest = z.infer<typeof liveRequestSchema>;
