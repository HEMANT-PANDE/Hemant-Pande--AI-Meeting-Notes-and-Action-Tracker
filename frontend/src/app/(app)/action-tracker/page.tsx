"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useActionItems } from "@/hooks/useActionItems";
import { useMeetings } from "@/hooks/useMeetings";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionItemTable } from "@/components/action-items/ActionItemTable";
import { ActionItemModal, type ActionItemSubmitValues } from "@/components/action-items/ActionItemModal";
import { PRIORITY_LABELS, STATUS_LABELS, type ActionItem, type ActionStatus, type Priority } from "@/types";
import { api, ApiError } from "@/lib/api";

export default function ActionTrackerPage() {
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<ActionStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search);
  const debouncedOwner = useDebounce(owner);

  const { data, loading, error, refetch } = useActionItems({
    search: debouncedSearch,
    owner: debouncedOwner,
    status,
    priority,
    overdueOnly,
    page,
    limit: 20,
  });

  // A generous limit is fine here — this only feeds the "add item" meeting
  // picker, not a paginated list of its own.
  const { data: meetingsData } = useMeetings({ limit: 100 });

  const [modalItem, setModalItem] = useState<ActionItem | "new" | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasFilters = !!(debouncedSearch || debouncedOwner || status || priority || overdueOnly);

  const handleQuickUpdate = async (id: string, patch: { status?: ActionStatus; priority?: Priority }) => {
    try {
      await api.put(`/action-items/${id}`, patch);
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this action item.");
    }
  };

  const handleSaveItem = async (values: ActionItemSubmitValues) => {
    setSavingItem(true);
    try {
      if (modalItem && modalItem !== "new") {
        await api.put(`/action-items/${modalItem.id}`, values);
      } else {
        await api.post("/action-items", values);
      }
      setModalItem(null);
      refetch();
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    setDeletingItem(true);
    try {
      await api.delete(`/action-items/${deleteItem.id}`);
      setDeleteItem(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete this action item.");
    } finally {
      setDeletingItem(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Action Tracker</h1>
          <p className="text-sm text-muted">All action items across every meeting, in one place.</p>
        </div>
        <Button
          onClick={() => setModalItem("new")}
          disabled={!meetingsData || meetingsData.meetings.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Action Item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search task description…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Input
          placeholder="Filter by owner"
          value={owner}
          onChange={(e) => {
            setOwner(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ActionStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value as Priority | "");
            setPage(1);
          }}
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(e) => {
            setOverdueOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-border"
        />
        Show overdue items only
      </label>

      {actionError && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</p>}

      {loading && <Spinner label="Loading action items…" />}
      {!loading && error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title={hasFilters ? "No matching action items" : "No action items yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Action items appear here once meetings are processed, or you can add one manually."
          }
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <ActionItemTable
            items={data.items}
            showMeetingColumn
            onQuickUpdate={handleQuickUpdate}
            onEdit={(item) => setModalItem(item)}
            onDelete={(item) => setDeleteItem(item)}
          />

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

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete this action item?"
        description="This action item will be permanently removed."
        loading={deletingItem}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteItem(null)}
      />

      <ActionItemModal
        open={!!modalItem}
        item={modalItem && modalItem !== "new" ? modalItem : null}
        submitting={savingItem}
        meetings={meetingsData?.meetings.map((m) => ({ id: m.id, title: m.title }))}
        onClose={() => setModalItem(null)}
        onSubmit={handleSaveItem}
      />
    </div>
  );
}
