"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMeeting } from "@/hooks/useMeeting";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { MeetingForm, type MeetingFormSubmitValues } from "@/components/meetings/MeetingForm";
import { api, ApiError } from "@/lib/api";
import type { Meeting } from "@/types";
import { toDateInputValue } from "@/lib/utils";

export default function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { meeting, loading, error } = useMeeting(id);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: MeetingFormSubmitValues) => {
    setServerError(null);
    try {
      const res = await api.put<{ meeting: Meeting }>(`/meetings/${id}`, values);
      router.push(`/meetings/${res.meeting.id}`);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not update the meeting. Please try again.");
    }
  };

  if (loading) return <Spinner label="Loading meeting…" />;
  if (error) return <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>;
  if (!meeting) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold text-foreground">Edit Meeting</h1>
          <p className="mt-1 text-sm text-muted">
            Changing the transcript will re-run AI processing and replace previously extracted insights.
          </p>
        </CardHeader>
        <CardBody>
          {serverError && (
            <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>
          )}
          <MeetingForm
            submitLabel="Save Changes"
            defaultValues={{
              title: meeting.title,
              date: toDateInputValue(meeting.date),
              type: meeting.type,
              participants: meeting.participants.join(", "),
              transcript: meeting.transcript,
              notes: meeting.notes ?? "",
            }}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>
    </div>
  );
}
