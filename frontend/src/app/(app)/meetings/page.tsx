"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { useDebounce } from "@/hooks/useDebounce";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { MEETING_TYPE_LABELS, type MeetingType } from "@/types";

const MEETING_TYPES = Object.keys(MEETING_TYPE_LABELS) as MeetingType[];

export default function MeetingsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MeetingType | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, loading, error } = useMeetings({ search: debouncedSearch, type, page, limit: 9 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Meetings</h1>
          <p className="text-sm text-muted">Create, search, and review your meeting records.</p>
        </div>
        <Link href="/meetings/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Meeting
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search meetings by title or participant…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="sm:w-56"
          value={type}
          onChange={(e) => {
            setType(e.target.value as MeetingType | "");
            setPage(1);
          }}
        >
          <option value="">All meeting types</option>
          {MEETING_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEETING_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      {loading && <Spinner label="Loading meetings…" />}
      {!loading && error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!loading && !error && data && data.meetings.length === 0 && (
        <EmptyState
          title={debouncedSearch || type ? "No matching meetings" : "No meetings yet"}
          description={
            debouncedSearch || type
              ? "Try a different search term or filter."
              : "Create your first meeting record to get started."
          }
          action={
            !debouncedSearch && !type ? (
              <Link href="/meetings/new" className="text-sm font-medium text-primary">
                Create a meeting →
              </Link>
            ) : undefined
          }
        />
      )}

      {!loading && !error && data && data.meetings.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
