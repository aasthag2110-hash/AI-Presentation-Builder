"use client";

import { LoaderCircle, RotateCw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AudienceQuestions } from "@/components/presentation/AudienceQuestions";
import { KeyPointsEditor } from "@/components/presentation/KeyPointsEditor";
import { SpeakerNotesEditor } from "@/components/presentation/SpeakerNotesEditor";
import { VisualRecommendation } from "@/components/presentation/VisualRecommendation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GatewayApiError } from "@/lib/api/client";
import { updateSlide } from "@/lib/api/presentations";
import { regenerateSlide } from "@/lib/api/presentations";
import type { Slide } from "@/types/gateway";

interface SlideCardProps {
  slide: Slide;
  presentationId: string;
  onSlideSaved: (slide: Slide) => void;
}

export function SlideCard({ slide, presentationId, onSlideSaved }: SlideCardProps) {
  const [title, setTitle] = useState(slide.title);
  const [keyPoints, setKeyPoints] = useState(slide.key_points);
  const [speakerNotes, setSpeakerNotes] = useState(slide.speaker_notes);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerationInstructions, setRegenerationInstructions] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isDirty = title !== slide.title || speakerNotes !== slide.speaker_notes || keyPoints.length !== slide.key_points.length || keyPoints.some((point, index) => point !== slide.key_points[index]);

  async function handleSave() {
    if (isSaving || !isDirty) return;

    setIsSaving(true);
    try {
      const savedSlide = await updateSlide(presentationId, slide.slide_number, {
        title,
        key_points: keyPoints,
        speaker_notes: speakerNotes
      });
      setTitle(savedSlide.title);
      setKeyPoints(savedSlide.key_points);
      setSpeakerNotes(savedSlide.speaker_notes);
      onSlideSaved(savedSlide);
      toast.success("Slide saved", { description: `Slide ${slide.slide_number} was updated.` });
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "Unable to save changes. Please try again.";
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerate() {
    if (isRegenerating) return;

    setIsRegenerating(true);
    try {
      const regeneratedSlide = await regenerateSlide(
        presentationId,
        slide.slide_number,
        regenerationInstructions.trim() || undefined
      );
      setTitle(regeneratedSlide.title);
      setKeyPoints(regeneratedSlide.key_points);
      setSpeakerNotes(regeneratedSlide.speaker_notes);
      onSlideSaved(regeneratedSlide);
      setIsRegenerateDialogOpen(false);
      setRegenerationInstructions("");
      toast.success("Slide regenerated", { description: `Slide ${slide.slide_number} has been updated.` });
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "Unable to regenerate this slide. Please try again.";
      toast.error("Regeneration failed", { description: message });
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Slide {slide.slide_number}</span>
        <span className={`text-xs font-medium ${isDirty ? "text-amber-700" : "text-muted-foreground"}`}>{isDirty ? "Unsaved changes" : "Saved"}</span>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`slide-title-${slide.slide_number}`}>Title</Label>
          <Input id={`slide-title-${slide.slide_number}`} value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <KeyPointsEditor keyPoints={keyPoints} onChange={setKeyPoints} />
        <SpeakerNotesEditor id={`speaker-notes-${slide.slide_number}`} speakerNotes={speakerNotes} onChange={setSpeakerNotes} />
        <VisualRecommendation recommendation={slide.visual_recommendation} />
        <AudienceQuestions questions={slide.audience_questions} />
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
          <Button type="button" className="sm:flex-1" onClick={handleSave} disabled={isSaving || isRegenerating || !isDirty}>
            {isSaving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" className="sm:flex-1" onClick={() => setIsRegenerateDialogOpen(true)} disabled={isSaving || isRegenerating}><RotateCw className="mr-2 size-4" />Regenerate with AI</Button>
        </div>
      </div>
      <Dialog open={isRegenerateDialogOpen} ariaLabelledBy={`regenerate-slide-${slide.slide_number}-title`} onOpenChange={(open) => { if (!isRegenerating) setIsRegenerateDialogOpen(open); }}>
        <DialogClose onClick={() => { if (!isRegenerating) setIsRegenerateDialogOpen(false); }} />
        <h2 id={`regenerate-slide-${slide.slide_number}-title`} className="text-lg font-semibold">Regenerate slide {slide.slide_number}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Optionally guide the regenerated content. Existing slide content will be replaced on success.</p>
        <div className="mt-5 space-y-2"><Label htmlFor={`regenerate-instructions-${slide.slide_number}`}>Instructions <span className="text-muted-foreground">(optional)</span></Label><Textarea id={`regenerate-instructions-${slide.slide_number}`} maxLength={500} value={regenerationInstructions} onChange={(event) => setRegenerationInstructions(event.target.value)} disabled={isRegenerating} /><p className="text-right text-xs text-muted-foreground">{regenerationInstructions.length}/500</p></div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsRegenerateDialogOpen(false)} disabled={isRegenerating}>Cancel</Button><Button type="button" onClick={handleRegenerate} disabled={isRegenerating}>{isRegenerating && <LoaderCircle className="mr-2 size-4 animate-spin" />}{isRegenerating ? "Regenerating…" : "Regenerate"}</Button></div>
      </Dialog>
    </article>
  );
}
