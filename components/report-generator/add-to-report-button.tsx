"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssignToReportDialog } from "./assign-to-report-dialog";
import type { ReportItem } from "@/lib/report/types";

/**
 * "Add to report" button. Each module passes a `build` callback that serializes
 * its current result into a ReportItem. Clicking opens a popup to pick (or
 * create) a patient and assign the result to a new or existing report.
 */
export function AddToReportButton({
  build,
  className,
  label = "Add to report",
}: {
  build: () => ReportItem;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={className}
      >
        <FilePlus2 className="h-4 w-4" />
        {label}
      </Button>
      <AssignToReportDialog open={open} onOpenChange={setOpen} build={build} />
    </>
  );
}
