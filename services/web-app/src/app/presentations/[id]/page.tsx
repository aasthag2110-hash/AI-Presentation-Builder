"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PresentationEditor } from "@/components/presentation/PresentationEditor";
import { Button } from "@/components/ui/button";
import { GatewayApiError } from "@/lib/api/client";
import { getPresentation } from "@/lib/api/presentations";
import type { Presentation } from "@/types/gateway";

interface PresentationPageProps {
  params: { id: string };
}

export default function PresentationPage({ params }: PresentationPageProps) {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPresentation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      setPresentation(await getPresentation(params.id));
    } catch (caughtError) {
      if (caughtError instanceof GatewayApiError && caughtError.status === 404) {
        setIsNotFound(true);
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load this presentation.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void loadPresentation(); }, [loadPresentation]);

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-muted/40 px-4" aria-busy="true"><div className="flex flex-col items-center gap-3 text-muted-foreground"><span className="rounded-full bg-primary/10 p-4"><LoaderCircle className="size-6 animate-spin text-primary" /></span><p className="text-sm font-medium">Loading presentation…</p></div></main>;
  if (isNotFound) return <StatusPage title="Presentation not found" message="This presentation may have been removed or the link is invalid." />;
  if (error) return <StatusPage title="Unable to load presentation" message={error} onRetry={loadPresentation} />;
  return presentation ? <PresentationEditor presentation={presentation} /> : null;
}

function StatusPage({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-muted/40 px-4"><section className="max-w-md rounded-xl border bg-card p-7 text-center shadow-lg shadow-slate-200/50"><span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10"><AlertCircle className="size-7 text-destructive" /></span><h1 className="mt-5 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>{onRetry && <Button className="mt-6" onClick={onRetry}>Try again</Button>}</section></main>;
}
