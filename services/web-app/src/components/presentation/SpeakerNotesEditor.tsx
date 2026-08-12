"use client";


import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SpeakerNotesEditorProps {
  id: string;
  speakerNotes: string;
  onChange: (speakerNotes: string) => void;
}

export function SpeakerNotesEditor({ id, speakerNotes, onChange }: SpeakerNotesEditorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Speaker notes</Label>
      <Textarea id={id} value={speakerNotes} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
