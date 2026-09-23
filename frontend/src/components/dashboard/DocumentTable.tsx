"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DocumentItem } from "@/types/api";
import { formatDate, getFileExtension } from "@/lib/utils";
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  FileCode,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface DocumentTableProps {
  documents: DocumentItem[];
  total: number;
  page: number;
  limit: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (newPage: number) => void;
  onDocumentDeleted: () => void;
  isLoading: boolean;
}

export function DocumentTable({
  documents,
  total,
  page,
  limit,
  searchQuery,
  onSearchChange,
  onPageChange,
  onDocumentDeleted,
  isLoading,
}: DocumentTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Are you sure you want to delete "${doc.original_filename}"?`)) {
      return;
    }

    setDeletingId(doc.id);
    try {
      await api.deleteDocument(doc.id);
      toast.success(`Deleted "${doc.original_filename}"`);
      onDocumentDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete document";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getFormatBadge = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case "pdf":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            PDF
          </span>
        );
      case "docx":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            DOCX
          </span>
        );
      case "txt":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            TXT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {ext.toUpperCase()}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Extracted</span>
          </div>
        );
      case "processing":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Extracting</span>
          </div>
        );
      case "pending":
      case "uploaded":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Queued</span>
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium capitalize">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-zinc-800/80 shadow-xl">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Uploaded Documents</h3>
          <p className="text-xs text-zinc-400">
            {total} document{total === 1 ? "" : "s"} indexed in your workspace
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by filename..."
            className="w-full glass-input rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900/80 text-[11px] uppercase font-semibold text-zinc-400 tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-6">Document</th>
              <th className="py-3.5 px-4">Format</th>
              <th className="py-3.5 px-4">Extraction Status</th>
              <th className="py-3.5 px-4">Uploaded At</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {isLoading && documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                  <span>Loading documents...</span>
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-zinc-500">
                  <FileText className="w-10 h-10 mx-auto text-zinc-600 mb-3 opacity-60" />
                  <p className="text-base font-semibold text-zinc-400">No documents found</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {searchQuery ? "Try refining your search keyword" : "Upload your first document above"}
                  </p>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-semibold text-zinc-100 hover:text-indigo-400 transition-colors truncate block max-w-xs sm:max-w-md"
                        >
                          {doc.original_filename}
                        </Link>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          ID: #{doc.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">{getFormatBadge(doc.original_filename)}</td>

                  <td className="py-4 px-4">{getStatusBadge(doc.status)}</td>

                  <td className="py-4 px-4 text-xs text-zinc-400 font-mono">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-colors"
                      >
                        <span>Studio</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <a
                        href={api.getDocumentDownloadUrl(doc.id)}
                        download={doc.original_filename}
                        title="Download Original File"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        title="Delete Document"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!searchQuery && totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Showing page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
