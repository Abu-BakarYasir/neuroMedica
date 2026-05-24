"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Pill,
  Phone,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  deletePatient,
  listUnifiedPatients,
} from "@/lib/patients/service";
import type { PatientRow, UnifiedPatient } from "@/lib/patients/types";
import { PatientFormDialog } from "./patient-form-dialog";

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export function PatientsList() {
  const [items, setItems] = useState<UnifiedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PatientRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const list = await listUnifiedPatients();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const name = p.source === "manual" ? p.row.name : p.name;
      const phone = p.source === "manual" ? p.row.phone ?? "" : "";
      return (
        name.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const manualCount = items.filter((p) => p.source === "manual").length;
  const rxOnlyCount = items.filter((p) => p.source === "prescription").length;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete patient "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deletePatient(id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete patient.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground mb-1"
            style={{ letterSpacing: "1%" }}
          >
            Patients
          </h1>
          <p className="text-sm text-muted-foreground">
            All your patients in one place — manually added and digitised from
            prescriptions.
          </p>
        </div>
        <PatientFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSaved={() => {
            void reload();
          }}
          trigger={
            <Button className="bg-neuro-primary hover:bg-neuro-primary-dark text-white gap-1.5 h-9 self-start sm:self-auto">
              <UserPlus className="w-4 h-4" />
              Add patient
            </Button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total patients" value={items.length} />
        <StatCard label="Manually added" value={manualCount} />
        <StatCard label="From prescriptions only" value={rxOnlyCount} />
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-6 text-sm text-red-600 dark:text-red-400">
          {error}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query
              ? "No patients match that search."
              : "No patients yet. Add one to get started."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((p, idx) => (
            <PatientCard
              key={p.source === "manual" ? p.row.id : p.id}
              patient={p}
              delayIndex={idx}
              onEdit={() =>
                p.source === "manual" ? setEditing(p.row) : undefined
              }
              onDelete={() =>
                p.source === "manual"
                  ? handleDelete(p.row.id, p.row.name)
                  : undefined
              }
              isDeleting={
                p.source === "manual" && deletingId === p.row.id
              }
            />
          ))}
        </div>
      )}

      {/* Edit dialog (controlled separately so we can pass the target row) */}
      {editing && (
        <PatientFormDialog
          patient={editing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 bg-card border-border">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-3xl font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </Card>
  );
}

function PatientCard({
  patient,
  delayIndex,
  onEdit,
  onDelete,
  isDeleting,
}: {
  patient: UnifiedPatient;
  delayIndex: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const isManual = patient.source === "manual";
  const name = isManual ? patient.row.name : patient.name;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const phone = isManual ? patient.row.phone : null;
  const address = isManual ? patient.row.address : null;
  const dob = isManual ? formatDate(patient.row.date_of_birth) : null;
  const notes = isManual ? patient.row.notes : null;
  const sex = isManual ? patient.row.sex : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(delayIndex * 0.03, 0.3) }}
    >
      <Card className="p-4 bg-card border-border flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-neuro-primary/10 text-neuro-primary flex items-center justify-center font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">
                {name}
              </p>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded",
                  isManual
                    ? "bg-neuro-primary/10 text-neuro-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isManual ? "Manual" : "From prescription"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {patient.prescriptionCount > 0
                ? `${patient.prescriptionCount} prescription${
                    patient.prescriptionCount === 1 ? "" : "s"
                  }`
                : "No prescriptions yet"}
              {patient.lastPrescriptionAt && (
                <>
                  {" · last "}
                  {formatDate(patient.lastPrescriptionAt)}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-foreground/80 flex-1">
          {phone && (
            <Detail icon={Phone} text={phone} />
          )}
          {address && <Detail icon={MapPin} text={address} />}
          {(dob || sex) && (
            <Detail
              icon={CalendarDays}
              text={[dob, sex && sex !== "unknown" ? sex : null]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
          {patient.prescriptionCount > 0 && (
            <Detail
              icon={Pill}
              text={`${patient.prescriptionCount} scanned`}
            />
          )}
          {notes && (
            <p className="text-[11px] text-muted-foreground line-clamp-3 pt-1">
              {notes}
            </p>
          )}
          {!isManual && (
            <p className="text-[11px] text-muted-foreground italic">
              Add manual details to enrich this record.
            </p>
          )}
        </div>

        {isManual && (onEdit || onDelete) && (
          <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-7 px-2 text-xs gap-1 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function Detail({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{text}</span>
    </div>
  );
}
