import { prisma } from "@/lib/prisma";
import { BUSINESS_TZ, formatInstant } from "@/lib/time-zone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnquiryRowActions } from "./enquiry-row-actions";

/**
 * Leads from the public site — people who asked to be called.
 *
 * Ordered new-first, because the only question this page answers at a glance is
 * "is anyone waiting on us". Everything else is history and can be scrolled to.
 *
 * ⚠️ Nothing notifies anyone that a lead arrived. There is no email provider in
 * this stack, so a lead sits here until a manager opens the page. That is the
 * largest operational gap in the feature — the cheapest fix is one
 * `sendEnquiryEmail()` call in the route handler once a provider exists.
 */

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-amber-500/10 text-amber-500",
  CONTACTED: "bg-green-500/10 text-green-500",
  CLOSED: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "new",
  CONTACTED: "called",
  CLOSED: "closed",
};

export default async function EnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({
    // NEW sorts before CONTACTED before CLOSED alphabetically by luck, so the
    // ordering is explicit rather than relying on it.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { handledBy: { select: { name: true } } },
  });

  const waiting = enquiries.filter((e) => e.status === "NEW").length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enquiries</CardTitle>
          <CardDescription>
            {waiting === 0
              ? "People who asked us to call them. Nothing waiting."
              : `${waiting} waiting for a call.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No enquiries yet.
            </p>
          ) : (
            <ul className="grid gap-3">
              {enquiries.map((e) => (
                <li key={e.id} data-reveal className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.name}</span>
                        <Badge variant="outline" className={STATUS_STYLE[e.status]}>
                          {STATUS_LABEL[e.status]}
                        </Badge>
                        {e.subject && (
                          <span className="text-xs text-muted-foreground">
                            {e.subject}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <a
                          href={`mailto:${e.email}`}
                          className="underline underline-offset-2"
                        >
                          {e.email}
                        </a>
                        {e.phone ? (
                          <>
                            {" · "}
                            <a
                              href={`tel:${e.phone}`}
                              className="underline underline-offset-2"
                            >
                              {e.phone}
                            </a>
                          </>
                        ) : null}
                      </p>
                      {e.preferredTimes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Best time: {e.preferredTimes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatInstant(e.createdAt, BUSINESS_TZ)}
                        {e.path ? ` · ${e.path}` : ""}
                      </span>
                      <EnquiryRowActions
                        id={e.id}
                        status={e.status}
                        staffNotes={e.staffNotes ?? ""}
                      />
                    </div>
                  </div>

                  {e.message && (
                    <p className="mt-3 text-sm whitespace-pre-wrap">{e.message}</p>
                  )}

                  {e.staffNotes && (
                    <p className="mt-3 border-l pl-3 text-sm whitespace-pre-wrap text-muted-foreground">
                      {e.staffNotes}
                      {e.handledBy?.name ? ` — ${e.handledBy.name}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
