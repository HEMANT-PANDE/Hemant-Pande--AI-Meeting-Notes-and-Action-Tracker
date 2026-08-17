"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MeetingForm, type MeetingFormSubmitValues } from "@/components/meetings/MeetingForm";
import { api, ApiError } from "@/lib/api";
import type { Meeting } from "@/types";

export default function NewMeetingPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: MeetingFormSubmitValues) => {
    setServerError(null);
    try {
      const res = await api.post<{ meeting: Meeting }>("/meetings", values);
      router.push(`/meetings/${res.meeting.id}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not create the meeting. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold text-foreground">New Meeting</h1>
          <p className="mt-1 text-sm text-muted">
            Enter the meeting details and transcript. AI-generated insights will be ready shortly after saving.
          </p>
        </CardHeader>
        <CardBody>
          {serverError && (
            <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>
          )}
          <MeetingForm submitLabel="Create Meeting" onSubmit={handleSubmit} />
        </CardBody>
      </Card>
    </div>
  );
}
