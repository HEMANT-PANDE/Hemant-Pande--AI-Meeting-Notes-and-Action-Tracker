"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MEETING_TYPE_LABELS, type MeetingType } from "@/types";

const MEETING_TYPES = Object.keys(MEETING_TYPE_LABELS) as MeetingType[];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — generous for a plain-text transcript

const meetingFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  date: z.string().min(1, "Meeting date is required"),
  type: z.enum(MEETING_TYPES as [MeetingType, ...MeetingType[]]),
  participants: z.string().optional(),
  transcript: z.string().trim().min(1, "Transcript cannot be empty"),
  notes: z.string().optional(),
});

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;

export interface MeetingFormSubmitValues {
  title: string;
  date: string;
  type: MeetingType;
  participants: string[];
  transcript: string;
  transcriptSource: "pasted" | "uploaded";
  notes: string | null;
}

interface MeetingFormProps {
  defaultValues?: Partial<MeetingFormValues>;
  submitLabel?: string;
  onSubmit: (values: MeetingFormSubmitValues) => Promise<void>;
}

export function MeetingForm({ defaultValues, submitLabel = "Save Meeting", onSubmit }: MeetingFormProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [transcriptSource, setTranscriptSource] = useState<"pasted" | "uploaded">("pasted");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      date: "",
      type: "OTHER",
      participants: "",
      transcript: "",
      notes: "",
      ...defaultValues,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setFileError(null);
    const isPlainText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isPlainText) {
      setFileError("Only plain text (.txt) transcript files are supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File is too large. Maximum size is 2MB.");
      return;
    }

    try {
      const text = await file.text();
      setValue("transcript", text, { shouldValidate: true, shouldDirty: true });
      setTranscriptSource("uploaded");
      setUploadedFileName(file.name);
    } catch {
      setFileError("Could not read that file. Try pasting the transcript instead.");
    }
  };

  const submit = handleSubmit(async (values) => {
    const participants = (values.participants ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    await onSubmit({
      title: values.title,
      date: values.date,
      type: values.type,
      participants,
      transcript: values.transcript,
      transcriptSource,
      notes: values.notes && values.notes.trim().length > 0 ? values.notes : null,
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Meeting Title" htmlFor="title" error={errors.title?.message}>
          <Input id="title" placeholder="e.g. Q3 Roadmap Sync" {...register("title")} />
        </FormField>

        <FormField label="Meeting Date" htmlFor="date" error={errors.date?.message}>
          <Input id="date" type="date" {...register("date")} />
        </FormField>

        <FormField label="Meeting Type" htmlFor="type" error={errors.type?.message}>
          <Select id="type" {...register("type")}>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEETING_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Participants"
          htmlFor="participants"
          hint="Comma-separated names, e.g. Asha, Rahul, Priya"
        >
          <Input id="participants" placeholder="Asha, Rahul, Priya" {...register("participants")} />
        </FormField>
      </div>

      <FormField
        label="Meeting Transcript"
        htmlFor="transcript"
        error={errors.transcript?.message ?? fileError ?? undefined}
        hint={uploadedFileName ? `Loaded from ${uploadedFileName}` : "Paste the transcript, or upload a .txt file"}
      >
        <div className="flex flex-col gap-2">
          <Textarea
            id="transcript"
            rows={10}
            placeholder="Paste the full meeting transcript here…"
            {...register("transcript", {
              onChange: () => {
                setTranscriptSource("pasted");
                setUploadedFileName(null);
              },
            })}
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload .txt file
            </Button>
            {uploadedFileName && (
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName(null);
                  setTranscriptSource("pasted");
                }}
                className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear file reference
              </button>
            )}
          </div>
        </div>
      </FormField>

      <FormField label="Meeting Notes (optional)" hint="Use this for your own manual notes or annotations">
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Add manual notes…" />
          )}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
