import type { AudienceQuestion as AudienceQuestionContract } from "@/types/gateway";

interface AudienceQuestionsProps {
  questions: AudienceQuestionContract[];
}

export function AudienceQuestions({ questions }: AudienceQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Audience questions">
      <h4 className="text-sm font-medium">Audience questions</h4>
      {questions.map((item, index) => (
        <div key={`${index}-${item.question}`} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{item.question}</p>
          <p className="mt-1 text-muted-foreground">Suggested answer: {item.suggested_answer}</p>
        </div>
      ))}
    </section>
  );
}
