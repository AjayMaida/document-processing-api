"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FileText, LogOut, User as UserIcon, Shield, Sparkles, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  return (
    <nav className="w-full border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">DocuFlow</span>
          </Link>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/dashboard"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>My Documents</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    pathname === "/admin"
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 shadow-sm"
                      : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Console</span>
                </Link>
              )}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celery Async Engine</span>
          </div>
        </div>

        {/* Right: User and Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-zinc-200">{user.username}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-sm">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{user.email}</span>
              </div>
              <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${
                isAdmin 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                  : "bg-zinc-800 border-zinc-700 text-zinc-300"
              }`}>
                {isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
