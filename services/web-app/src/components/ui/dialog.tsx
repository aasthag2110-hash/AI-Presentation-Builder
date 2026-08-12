"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabelledBy?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, ariaLabelledBy, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center p-4" role="presentation"><button className="absolute inset-0 bg-black/50" aria-label="Close dialog" onClick={() => onOpenChange(false)} /><div role="dialog" aria-modal="true" aria-labelledby={ariaLabelledBy} className="relative z-10 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">{children}</div></div>;
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return <button type="button" aria-label="Close dialog" onClick={onClick} className={cn("absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground")}><X className="size-4" /></button>;
}
