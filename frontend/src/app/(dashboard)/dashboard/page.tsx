"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch documents with TanStack Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["documents", page, searchQuery],
    queryFn: async () => {
      if (searchQuery.trim()) {
        return api.searchDocuments(searchQuery.trim());
      }
      return api.getDocuments(page, limit);
    },
    enabled: isAuthenticated,
    // Smart auto-polling: If any document is still processing/pending/uploaded, poll every 2.5s
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      const hasActiveJobs = docs.some(
        (d) => d.status === "processing" || d.status === "pending" || d.status === "uploaded"
      );
      return hasActiveJobs ? 2500 : false;
    },
  });

  const documents = data?.documents || [];
  const total = data?.total || documents.length;

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const handleDocumentDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  if (authLoading || (!isAuthenticated && !data)) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Header */}
        <section>
          <MetricCards documents={documents} total={total} />
        </section>

        {/* Upload Dropzone */}
        <section>
          <UploadDropzone onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* Documents Table */}
        <section>
          <DocumentTable
            documents={documents}
            total={total}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onPageChange={setPage}
            onDocumentDeleted={handleDocumentDeleted}
            isLoading={isLoading}
          />
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        DocuFlow Studio • Connected to Celery + Redis + FastAPI
      </footer>
    </div>
  );
}
