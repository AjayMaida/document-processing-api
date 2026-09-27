"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadDropzoneProps {
  onUploadSuccess: () => void;
}

export function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Unsupported file format. Please upload PDF, DOCX, or TXT.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds the 10MB limit.`;
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    const errorMsg = validateFile(file);
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const doc = await api.uploadDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`Uploaded "${file.name}" successfully!`, {
        description: "Background text extraction queued with Celery.",
      });

      onUploadSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      toast.error("Upload failed", { description: message });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`relative group rounded-3xl p-8 border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
        isDragging
          ? "border-indigo-500 bg-indigo-500/10 scale-[1.008]"
          : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated Icon badge */}
        <div
          className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
            isDragging
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {isUploading ? "Uploading Document..." : "Drop your documents here or click to browse"}
        </h3>
        <p className="text-sm text-zinc-400 max-w-md mb-4">
          Automated background text extraction starts immediately upon upload. Supports{" "}
          <span className="text-zinc-200 font-medium">PDF, Word (DOCX)</span>, and{" "}
          <span className="text-zinc-200 font-medium">TXT</span> files up to 10MB.
        </p>

        {/* Supported badges */}
        <div className="flex items-center gap-2">
          {ALLOWED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 uppercase tracking-wider"
            >
              {ext.replace(".", "")}
            </span>
          ))}
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="w-full max-w-xs mt-6">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-mono">{uploadProgress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}
