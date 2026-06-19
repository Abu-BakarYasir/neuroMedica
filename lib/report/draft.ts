// Client-side report draft, persisted in localStorage so "Add to report" works
// across module pages. Emits a window event so open views update live.

import type { ReportItem } from "./types";
import { reorder } from "./serialize";

const KEY = "neuromedica.reportDraft";
export const DRAFT_EVENT = "report-draft-changed";

function canUse(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getDraft(): ReportItem[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ReportItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: ReportItem[]): void {
  if (!canUse()) return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(DRAFT_EVENT));
}

export function addItem(item: ReportItem): void {
  save([...getDraft(), item]);
}

export function removeItem(id: string): void {
  save(getDraft().filter((it) => it.id !== id));
}

export function moveItem(id: string, dir: "up" | "down"): void {
  save(reorder(getDraft(), id, dir));
}

export function clearDraft(): void {
  save([]);
}

export function getCount(): number {
  return getDraft().length;
}
