"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Sparkles, FileText, Zap, Shield, Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background radial gradients */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">DocuFlow</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            API v1.0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-md text-xs text-zinc-300 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Asynchronous Document Text Extraction</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          Intelligent Document Processing <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            Built for Modern Scale.
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-zinc-400 mb-10 leading-relaxed">
          Upload PDF, DOCX, and TXT files with asynchronous background extraction powered by
          Celery & Redis. Inspect original documents and extracted text side-by-side with full-text search.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold transition-all hover:border-zinc-700"
          >
            API Swagger Docs
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Celery Async Engine</h3>
            <p className="text-sm text-zinc-400">
              Non-blocking document processing runs in background workers with real-time status tracking and Redis queues.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Dual-Pane Studio</h3>
            <p className="text-sm text-zinc-400">
              Inspect original uploaded files side-by-side with stream-extracted text, word count analytics, and 1-click copy.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Stateless Storage</h3>
            <p className="text-sm text-zinc-400">
              Decoupled storage interface supporting local filesystem and cloud S3 mock with secure JWT token protection.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        Document Processing API • Next.js 15 & React 19 Client
      </footer>
    </main>
  );
}
