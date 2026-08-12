import { ImageIcon, Lightbulb } from "lucide-react";

import type { VisualRecommendation as VisualRecommendationContract } from "@/types/gateway";

interface VisualRecommendationProps {
  recommendation: VisualRecommendationContract;
}

export function VisualRecommendation({ recommendation }: VisualRecommendationProps) {
  return (
    <section className="rounded-md border bg-muted/30 p-4" aria-label="Visual recommendation">
      <div className="flex items-center gap-2 text-sm font-medium"><ImageIcon className="size-4" /> Visual recommendation</div>
      <p className="mt-2 text-sm text-muted-foreground">{recommendation.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-background px-2 py-1 text-xs font-medium capitalize">{recommendation.type}</span>
        {recommendation.search_keywords.map((keyword) => <span key={keyword} className="rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground">{keyword}</span>)}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Lightbulb className="size-3" /> Suggested visual direction</div>
    </section>
  );
}
