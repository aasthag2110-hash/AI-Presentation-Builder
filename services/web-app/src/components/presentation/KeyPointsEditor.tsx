"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KeyPointsEditorProps {
  keyPoints: string[];
  onChange: (keyPoints: string[]) => void;
}

export function KeyPointsEditor({ keyPoints, onChange }: KeyPointsEditorProps) {
  const updateKeyPoint = (index: number, value: string) => {
    onChange(keyPoints.map((point, pointIndex) => (pointIndex === index ? value : point)));
  };

  return (
    <div className="space-y-2">
      <Label>Key points</Label>
      <div className="space-y-2">
        {keyPoints.map((point, index) => (
          <div key={`${index}-${point}`} className="flex gap-2">
            <Input aria-label={`Key point ${index + 1}`} value={point} onChange={(event) => updateKeyPoint(index, event.target.value)} />
            <Button type="button" variant="outline" size="sm" className="shrink-0" aria-label={`Remove key point ${index + 1}`} onClick={() => onChange(keyPoints.filter((_, pointIndex) => pointIndex !== index))}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...keyPoints, ""])}>
        <Plus className="mr-2 size-4" /> Add key point
      </Button>
    </div>
  );
}
