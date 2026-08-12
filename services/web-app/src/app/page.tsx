"use client";

import { FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GatewayApiError } from "@/lib/api/client";
import { uploadDocument } from "@/lib/api/documents";
import { generatePresentation } from "@/lib/api/presentations";
import type { Tone, UploadDocumentResponse } from "@/types/gateway";

const toneOptions: Tone[] = ["professional", "casual", "academic", "persuasive"];

type FormErrors = Partial<Record<"topic" | "audience" | "slide_count", string>>;
type DocumentFormErrors = Partial<Record<"file" | "audience" | "slide_count", string>>;

const maximumFileSize = 10 * 1024 * 1024;
const supportedExtensions = ["pdf", "docx", "txt"];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"prompt" | "document">("prompt");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [slideCount, setSlideCount] = useState("6");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentAudience, setDocumentAudience] = useState("");
  const [documentTone, setDocumentTone] = useState<Tone>("professional");
  const [documentSlideCount, setDocumentSlideCount] = useState("6");
  const [documentErrors, setDocumentErrors] = useState<DocumentFormErrors>({});
  const [uploadedDocument, setUploadedDocument] = useState<UploadDocumentResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDocumentGenerating, setIsDocumentGenerating] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const parsedSlideCount = Number(slideCount);

    if (!topic.trim()) nextErrors.topic = "Enter a presentation topic.";
    if (!audience.trim()) nextErrors.audience = "Enter the intended audience.";
    if (!Number.isInteger(parsedSlideCount) || parsedSlideCount < 5 || parsedSlideCount > 10) {
      nextErrors.slide_count = "Choose a whole number from 5 to 10.";
    }

    return nextErrors;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsGenerating(true);

    try {
      const presentation = await generatePresentation({
        source: "prompt",
        topic: topic.trim(),
        audience: audience.trim(),
        tone,
        slide_count: Number(slideCount)
      });

      router.push(`/presentations/${presentation.presentation_id}`);
    } catch (error) {
      const message =
        error instanceof GatewayApiError
          ? error.message
          : "Unable to generate the presentation. Please try again.";

      toast.error("Generation failed", { description: message });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadedDocument(null);
    setDocumentErrors((current) => ({ ...current, file: undefined }));

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !supportedExtensions.includes(extension)) {
      setDocumentErrors((current) => ({ ...current, file: "Choose a PDF, DOCX, or TXT file." }));
      event.target.value = "";
      return;
    }

    if (file.size > maximumFileSize) {
      setDocumentErrors((current) => ({ ...current, file: "The file must be 10 MB or smaller." }));
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const document = await uploadDocument(file);
      setUploadedDocument(document);
      toast.success("Document uploaded", { description: document.filename });
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "Unable to upload the document.";
      setDocumentErrors((current) => ({ ...current, file: message }));
      toast.error("Upload failed", { description: message });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: DocumentFormErrors = {};
    const parsedSlideCount = Number(documentSlideCount);
    const document = uploadedDocument;

    if (!document) nextErrors.file = "Upload a document before generating.";
    if (!documentAudience.trim()) nextErrors.audience = "Enter the intended audience.";
    if (!Number.isInteger(parsedSlideCount) || parsedSlideCount < 5 || parsedSlideCount > 10) {
      nextErrors.slide_count = "Choose a whole number from 5 to 10.";
    }

    setDocumentErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!document) return;

    setIsDocumentGenerating(true);
    try {
      const presentation = await generatePresentation({
        source: "document",
        document_id: document.document_id,
        audience: documentAudience.trim(),
        tone: documentTone,
        slide_count: parsedSlideCount
      });

      router.push(`/presentations/${presentation.presentation_id}`);
    } catch (error) {
      const message = error instanceof GatewayApiError ? error.message : "Unable to generate the presentation.";
      toast.error("Generation failed", { description: message });
    } finally {
      setIsDocumentGenerating(false);
    }
  }

  const documentBusy = isUploading || isDocumentGenerating;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <section className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center sm:mb-10 sm:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-4 text-primary" aria-hidden="true" /> AI Presentation Assistant
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build a clear, compelling presentation</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground sm:mx-0">Start from an idea or an existing document, then tailor every slide to your audience.</p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-lg shadow-slate-200/50">
          <div className="border-b bg-muted/30 px-5 pt-5 sm:px-8 sm:pt-7">
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Presentation source">
            <button
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "prompt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "prompt"}
              onClick={() => setActiveTab("prompt")}
              disabled={documentBusy || isGenerating}
            >
              Prompt
            </button>
            <button
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "document" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              type="button"
              role="tab"
              aria-selected={activeTab === "document"}
              onClick={() => setActiveTab("document")}
              disabled={documentBusy || isGenerating}
            >
              Document
            </button>
          </div>
          </div>

          {activeTab === "prompt" ? <form className="space-y-6 p-5 sm:p-8" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} aria-invalid={Boolean(errors.topic)} aria-describedby={errors.topic ? "topic-error" : undefined} placeholder="e.g. Building resilient product teams" disabled={isGenerating} />
              {errors.topic && <p id="topic-error" className="text-sm text-destructive">{errors.topic}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" value={audience} onChange={(event) => setAudience(event.target.value)} aria-invalid={Boolean(errors.audience)} aria-describedby={errors.audience ? "audience-error" : undefined} placeholder="e.g. Engineering leaders" disabled={isGenerating} />
              {errors.audience && <p id="audience-error" className="text-sm text-destructive">{errors.audience}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <select id="tone" value={tone} onChange={(event) => setTone(event.target.value as Tone)} disabled={isGenerating} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {toneOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide-count">Slide count</Label>
                <Input id="slide-count" type="number" min="5" max="10" step="1" value={slideCount} onChange={(event) => setSlideCount(event.target.value)} aria-invalid={Boolean(errors.slide_count)} aria-describedby={errors.slide_count ? "slide-count-error" : undefined} disabled={isGenerating} />
                {errors.slide_count && <p id="slide-count-error" className="text-sm text-destructive">{errors.slide_count}</p>}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
              {isGenerating ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 size-4" aria-hidden="true" />}
              {isGenerating ? "Generating presentation…" : "Generate presentation"}
            </Button>
          </form> : <form className="space-y-6 p-5 sm:p-8" onSubmit={handleDocumentSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="document-file">Document</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input px-4 py-9 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.03] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                <span className="mb-3 rounded-full bg-primary/10 p-3"><Upload className="size-5 text-primary" aria-hidden="true" /></span>
                <span className="text-sm font-medium">Choose a PDF, DOCX, or TXT file</span>
                <span className="mt-1 text-xs text-muted-foreground">Maximum size: 10 MB</span>
                <input id="document-file" className="sr-only" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleFileChange} disabled={documentBusy} />
              </label>
              {isUploading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Uploading document…</p>}
              {uploadedDocument && <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 text-sm"><p className="flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" />{uploadedDocument.filename}</p><p className="mt-1 text-muted-foreground">{uploadedDocument.char_count.toLocaleString()} characters extracted</p></div>}
              {documentErrors.file && <p className="text-sm text-destructive">{documentErrors.file}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-audience">Audience</Label>
              <Input id="document-audience" value={documentAudience} onChange={(event) => setDocumentAudience(event.target.value)} aria-invalid={Boolean(documentErrors.audience)} placeholder="e.g. Engineering leaders" disabled={documentBusy} />
              {documentErrors.audience && <p className="text-sm text-destructive">{documentErrors.audience}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="document-tone">Tone</Label><select id="document-tone" value={documentTone} onChange={(event) => setDocumentTone(event.target.value as Tone)} disabled={documentBusy} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{toneOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="document-slide-count">Slide count</Label><Input id="document-slide-count" type="number" min="5" max="10" step="1" value={documentSlideCount} onChange={(event) => setDocumentSlideCount(event.target.value)} aria-invalid={Boolean(documentErrors.slide_count)} disabled={documentBusy} />{documentErrors.slide_count && <p className="text-sm text-destructive">{documentErrors.slide_count}</p>}</div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={documentBusy || !uploadedDocument}>
              {isDocumentGenerating ? <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 size-4" aria-hidden="true" />}
              {isDocumentGenerating ? "Generating presentation…" : "Generate presentation"}
            </Button>
          </form>}
        </div>
      </section>
    </main>
  );
}
