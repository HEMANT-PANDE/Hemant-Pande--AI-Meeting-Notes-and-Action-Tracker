"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ActionItem, ActionStatus, PaginationMeta, Priority } from "@/types";

export interface ActionItemFilters {
  search?: string;
  status?: ActionStatus | "";
  priority?: Priority | "";
  owner?: string;
  overdueOnly?: boolean;
  meetingId?: string;
  page?: number;
  limit?: number;
}

export function useActionItems(filters: ActionItemFilters) {
  const [data, setData] = useState<(PaginationMeta & { items: ActionItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginationMeta & { items: ActionItem[] }>("/action-items", {
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        owner: filters.owner || undefined,
        overdueOnly: filters.overdueOnly || undefined,
        meetingId: filters.meetingId || undefined,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load action items.");
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.status,
    filters.priority,
    filters.owner,
    filters.overdueOnly,
    filters.meetingId,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
