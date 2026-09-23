"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { formatDate, getFileExtension, calculateTextMetrics } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function DocumentStudioPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = Number(params.id);

  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch document metadata
  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => api.getDocumentById(documentId),
    enabled: !!documentId,
  });

  // 2. Fetch document & Celery extraction status with smart polling
  const { data: statusInfo } = useQuery({
    queryKey: ["documentStatus", documentId],
    queryFn: () => api.getDocumentStatus(documentId),
    enabled: !!documentId,
    refetchInterval: (query) => {
      const extStatus = query.state.data?.extraction_status;
      return extStatus === "pending" || extStatus === "processing" ? 2000 : false;
    },
  });

  // 3. Fetch extracted text if extraction is completed
  const isCompleted =
    document?.status === "completed" || statusInfo?.extraction_status === "completed";

  const {
    data: extractedText,
    isLoading: textLoading,
    error: textError,
  } = useQuery({
    queryKey: ["extractedText", documentId],
    queryFn: () => api.getExtractedText(documentId),
    enabled: isCompleted,
    retry: 2,
  });

  const textMetrics = useMemo(() => {
    return calculateTextMetrics(extractedText || "");
  }, [extractedText]);

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success("Extracted text copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  const handleDownloadText = () => {
    if (!extractedText || !document) return;
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `extracted_${document.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded extracted text file");
  };

  // Highlight search matches
  const highlightedContent = useMemo(() => {
    if (!extractedText) return null;
    if (!searchTerm.trim()) return extractedText;

    const parts = extractedText.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-400 text-black px-1 rounded font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [extractedText, searchTerm]);

  if (docLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Document Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">
          The requested document could not be located.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const ext = getFileExtension(document.original_filename);
  const isPdf = ext === "pdf";
  const downloadUrl = api.getDocumentDownloadUrl(document.id);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Navbar />

      {/* Studio Header Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Back & Document Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-md">
                  {document.original_filename}
                </h1>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {ext}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Uploaded {formatDate(document.created_at)} • ID #{document.id}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={document.original_filename}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Original File</span>
            </a>

            {isCompleted && (
              <>
                <button
                  onClick={handleDownloadText}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Text"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
          {/* Left Pane: Original Document Preview */}
          <div className="glass-panel rounded-3xl border border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Original Document
                </span>
              </div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex-1 bg-zinc-950/60 p-4 flex flex-col justify-center items-center overflow-auto">
              {isPdf ? (
                <iframe
                  src={downloadUrl}
                  className="w-full h-full rounded-xl border border-zinc-800"
                  title="PDF Document Viewer"
                />
              ) : (
                <div className="text-center p-8 max-w-sm">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">
                    {document.original_filename}
                  </h4>
                  <p className="text-xs text-zinc-400 mb-6">
                    Direct iframe preview is optimized for PDF files. You can download and inspect this {ext.toUpperCase()} document anytime.
                  </p>
                  <a
                    href={downloadUrl}
                    download={document.original_filename}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Extracted Text Inspector */}
          <div className="glass-panel rounded-3xl border border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Extracted Text Inspector
                </span>
              </div>

              {/* Status pill */}
              {isCompleted ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Extraction</span>
                </div>
              )}
            </div>

            {/* Metrics and Search Bar if completed */}
            {isCompleted && (
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>
                    <strong className="text-zinc-200">{textMetrics.words}</strong> words
                  </span>
                  <span>
                    <strong className="text-zinc-200">{textMetrics.characters}</strong> chars
                  </span>
                  <span>
                    <strong className="text-zinc-200">{textMetrics.readingTimeMinutes}</strong> min read
                  </span>
                </div>

                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Find in text..."
                    className="w-full glass-input rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Text Viewer Content */}
            <div className="flex-1 bg-zinc-950/90 p-5 overflow-auto font-mono text-xs leading-relaxed text-zinc-300 select-text">
              {!isCompleted ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1">
                    Text Extraction in Progress
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Celery worker is currently processing this file in the background. The text stream will render automatically once finished.
                  </p>
                </div>
              ) : textLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : textError ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-red-400">
                  <AlertTriangle className="w-8 h-8 mb-2" />
                  <p className="font-semibold text-sm">Failed to load extracted text</p>
                </div>
              ) : extractedText ? (
                <div className="whitespace-pre-wrap selection:bg-indigo-500/40">
                  {highlightedContent}
                </div>
              ) : (
                <p className="text-zinc-500 italic">No text content extracted.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
