"use client";

import { Clock3, Layers3, Users } from "lucide-react";
import { useState } from "react";

import { SlideCard } from "@/components/presentation/SlideCard";
import type { Presentation } from "@/types/gateway";

interface PresentationEditorProps {
  presentation: Presentation;
}

export function PresentationEditor({ presentation }: PresentationEditorProps) {
  const [slides, setSlides] = useState(presentation.slides);

  const handleSlideSaved = (savedSlide: Presentation["slides"][number]) => {
    setSlides((current) => current.map((slide) => slide.slide_number === savedSlide.slide_number ? savedSlide : slide));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-xl border bg-card p-6 shadow-lg shadow-slate-200/50 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Presentation editor</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{presentation.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{presentation.summary}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md bg-muted/50 p-3"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3" />Duration</dt><dd className="mt-1 text-sm font-medium">{presentation.estimated_duration_minutes} minutes</dd></div>
            <div className="rounded-md bg-muted/50 p-3"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-3" />Audience</dt><dd className="mt-1 text-sm font-medium">{presentation.audience}</dd></div>
            <div className="rounded-md bg-muted/50 p-3"><dt className="text-xs text-muted-foreground">Tone</dt><dd className="mt-1 text-sm font-medium capitalize">{presentation.tone}</dd></div>
            <div className="rounded-md bg-muted/50 p-3"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Layers3 className="size-3" />Slides</dt><dd className="mt-1 text-sm font-medium">{presentation.slide_count}</dd></div>
          </dl>
        </header>
        <section className="mt-8 space-y-6" aria-label="Presentation slides">
          {slides.map((slide) => <SlideCard key={slide.slide_number} slide={slide} presentationId={presentation.presentation_id} onSlideSaved={handleSlideSaved} />)}
        </section>
      </div>
    </main>
  );
}
