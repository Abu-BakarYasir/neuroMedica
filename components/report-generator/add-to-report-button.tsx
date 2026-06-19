"use client";

import { useState } from "react";
import { FilePlus2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addItem } from "@/lib/report/draft";
import type { ReportItem } from "@/lib/report/types";

/**
 * Small reusable "Add to report" button. Each module passes a `build` callback
 * that serializes its current result into a ReportItem when clicked.
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
  const [added, setAdded] = useState(false);

  const onClick = () => {
    addItem(build());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={className}
    >
      {added ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          Added
        </>
      ) : (
        <>
          <FilePlus2 className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
