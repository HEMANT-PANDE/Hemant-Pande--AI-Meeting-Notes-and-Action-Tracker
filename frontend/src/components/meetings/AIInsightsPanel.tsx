"use client";

import { AlertTriangle, CircleHelp, ListChecks, MessageSquareText, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Meeting } from "@/types";

function Section({
  icon: Icon,
  title,
  items,
  emptyText,
}: {
  icon: typeof ListChecks;
  title: string;
  items: string[] | null;
  emptyText: string;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {items && items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      )}
    </div>
  );
}

export function AIInsightsPanel({ meeting, onRegenerate }: { meeting: Meeting; onRegenerate: () => Promise<void> }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Generated Insights
        </h2>
        {(meeting.aiStatus === "COMPLETED" || meeting.aiStatus === "FAILED") && (
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {(meeting.aiStatus === "PENDING" || meeting.aiStatus === "PROCESSING") && (
          <Spinner label="AI is analyzing this transcript… this usually takes a few seconds." />
        )}

        {meeting.aiStatus === "FAILED" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-6 w-6 text-danger" />
            <div>
              <p className="font-medium text-foreground">AI processing failed</p>
              <p className="mt-1 text-sm text-muted">
                {meeting.aiError ?? "Something went wrong while generating insights."}
              </p>
            </div>
            <Button size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        )}

        {meeting.aiStatus === "COMPLETED" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MessageSquareText className="h-4 w-4 text-primary" />
                Summary
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{meeting.summary}</p>
            </div>

            <Section
              icon={ListChecks}
              title="Key Discussion Points"
              items={meeting.keyDiscussionPoints}
              emptyText="No specific discussion points were extracted."
            />
            <Section
              icon={ListChecks}
              title="Key Decisions"
              items={meeting.keyDecisions}
              emptyText="No clear decisions were identified in this transcript."
            />
            <Section
              icon={AlertTriangle}
              title="Risks & Concerns"
              items={meeting.risks}
              emptyText="No risks or concerns were flagged."
            />
            <Section
              icon={CircleHelp}
              title="Unanswered Questions"
              items={meeting.unansweredQuestions}
              emptyText="No open questions were identified."
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
