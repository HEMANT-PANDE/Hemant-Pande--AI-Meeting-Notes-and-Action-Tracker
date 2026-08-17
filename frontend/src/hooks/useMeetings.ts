"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Meeting, MeetingType, PaginationMeta } from "@/types";

type MeetingListItem = Pick<
  Meeting,
  "id" | "title" | "date" | "type" | "participants" | "aiStatus" | "createdAt" | "updatedAt" | "_count"
>;

interface Params {
  search?: string;
  type?: MeetingType | "";
  page?: number;
  limit?: number;
}

export function useMeetings(params: Params) {
  const [data, setData] = useState<(PaginationMeta & { meetings: MeetingListItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginationMeta & { meetings: MeetingListItem[] }>("/meetings", {
        search: params.search || undefined,
        type: params.type || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  }, [params.search, params.type, params.page, params.limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
