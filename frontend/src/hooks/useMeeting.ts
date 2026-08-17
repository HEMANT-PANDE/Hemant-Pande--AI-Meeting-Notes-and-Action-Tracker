"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meeting } from "@/types";

const POLL_INTERVAL_MS = 3000;

// Loads a single meeting and, while the AI job is PENDING/PROCESSING,
// polls until it settles into COMPLETED or FAILED — this is what drives the
// "AI processing" loading state on the meeting detail page.
export function useMeeting(id: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Holds the latest `load` so the poll's setTimeout callback can call it
  // without referencing `load` inside its own initializer.
  const loadRef = useRef<(silent?: boolean) => void>(() => {});

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ meeting: Meeting }>(`/meetings/${id}`);
        setMeeting(res.meeting);
        if (res.meeting.aiStatus === "PENDING" || res.meeting.aiStatus === "PROCESSING") {
          timerRef.current = setTimeout(() => loadRef.current(true), POLL_INTERVAL_MS);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load meeting.");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [load]);

  const regenerate = useCallback(async () => {
    const res = await api.post<{ meeting: Meeting }>(`/meetings/${id}/regenerate-insights`);
    setMeeting(res.meeting);
    load(true);
  }, [id, load]);

  return { meeting, loading, error, refetch: () => load(), regenerate };
}
