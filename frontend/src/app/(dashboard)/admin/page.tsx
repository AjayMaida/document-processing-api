"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { formatDate, getFileExtension } from "@/lib/utils";
import { AdminDocumentItem, UserListItem } from "@/types/api";
import {
  Shield,
  FileText,
  Users,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  BookOpen,
  UserCheck,
  UserX,
  X,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminConsolePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"documents" | "users">("documents");
  const [docPage, setDocPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const limit = 10;

  // Text preview modal state
  const [previewDoc, setPreviewDoc] = useState<AdminDocumentItem | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  // Role updating state
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Auth & Admin check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "admin") {
        toast.error("Access denied: Admin privileges required.");
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 1. Fetch Global Admin Documents
  const {
    data: docData,
    isLoading: docsLoading,
    isRefetching: docsRefetching,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ["adminDocuments", docPage],
    queryFn: () => api.getAdminDocuments(docPage, limit),
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      const hasActive = docs.some(
        (d) => d.status === "processing" || d.status === "pending" || d.status === "uploaded"
      );
      return hasActive ? 3000 : false;
    },
  });

  // 2. Fetch Global Admin Users
  const {
    data: userData,
    isLoading: usersLoading,
    isRefetching: usersRefetching,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["adminUsers", userPage],
    queryFn: () => api.getAdminUsers(userPage, limit),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const allDocuments = docData?.documents || [];
  const totalDocs = docData?.total || allDocuments.length;
  const allUsers = userData?.users || [];
  const totalUsers = userData?.total || allUsers.length;

  // Filter documents locally by search query
  const filteredDocuments = useMemo(() => {
    if (!searchDocQuery.trim()) return allDocuments;
    const q = searchDocQuery.toLowerCase();
    return allDocuments.filter(
      (d) =>
        d.original_filename.toLowerCase().includes(q) ||
        d.user.username.toLowerCase().includes(q) ||
        d.user.email.toLowerCase().includes(q)
    );
  }, [allDocuments, searchDocQuery]);

  // Filter users locally by search query
  const filteredUsers = useMemo(() => {
    if (!searchUserQuery.trim()) return allUsers;
    const q = searchUserQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, searchUserQuery]);

  // Format badge helper
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

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </div>
        );
      case "processing":
      case "pending":
      case "uploaded":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="capitalize">{status}</span>
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </div>
        );
    }
  };

  // Handle previewing extracted text
  const handlePreviewText = async (doc: AdminDocumentItem) => {
    setPreviewDoc(doc);
    setPreviewText(null);
    setPreviewLoading(true);
    try {
      const text = await api.getAdminExtractedText(doc.id);
      setPreviewText(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load extracted text";
      toast.error(msg);
      setPreviewText(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle role change
  const handleToggleRole = async (targetUser: UserListItem) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (targetUser.id === user?.id && newRole === "user") {
      if (!confirm("Warning: Demoting yourself from admin will immediately remove your admin privileges. Proceed?")) {
        return;
      }
    }

    setUpdatingUserId(targetUser.id);
    try {
      await api.updateUserRole(targetUser.id, newRole);
      toast.success(`Updated ${targetUser.username}'s role to ${newRole.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (authLoading || (!isAuthenticated && !docData)) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-zinc-900/50 p-6 sm:p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPERUSER CONTROL PANEL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Global System Administration
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Inspect and download all user files across the entire platform, review background Celery extraction jobs, and manage team member permissions.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[110px]">
                <span className="block text-2xl font-extrabold text-amber-400">{totalDocs}</span>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">All Documents</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center min-w-[110px]">
                <span className="block text-2xl font-extrabold text-indigo-400">{totalUsers}</span>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Users</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="relative z-10 mt-8 flex items-center gap-2 border-b border-zinc-800/80 pb-px">
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                activeTab === "documents"
                  ? "bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All System Documents</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-800 text-zinc-300">
                {totalDocs}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Directory & Permissions</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-zinc-800 text-zinc-300">
                {totalUsers}
              </span>
            </button>
          </div>
        </section>

        {/* TAB 1: SYSTEM DOCUMENTS */}
        {activeTab === "documents" && (
          <section className="glass-panel rounded-3xl border border-zinc-800/80 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Repository Documents</span>
                  {docsRefetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                </h3>
                <p className="text-xs text-zinc-400">
                  Direct administrative access to view and download all files and extraction outputs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchDocQuery}
                    onChange={(e) => setSearchDocQuery(e.target.value)}
                    placeholder="Search by file or owner..."
                    className="w-full glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => refetchDocs()}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Refresh documents"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Document</th>
                    <th className="py-3.5 px-4">Owner / User</th>
                    <th className="py-3.5 px-4">Format</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Uploaded</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {docsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                        <span>Loading system documents...</span>
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        <p className="font-semibold text-zinc-400">No documents found</p>
                        <p className="text-[11px] text-zinc-600">No documents match the current criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const downloadUrl = api.getAdminDocumentDownloadUrl(doc.id);
                      return (
                        <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors group">
                          {/* File info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="max-w-xs truncate">
                                <span className="font-semibold text-white block truncate" title={doc.original_filename}>
                                  {doc.original_filename}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">ID #{doc.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-medium text-zinc-300 block">{doc.user?.username || `User #${doc.user_id}`}</span>
                              <span className="text-[10px] text-zinc-500 block">{doc.user?.email || "—"}</span>
                            </div>
                          </td>

                          {/* Format */}
                          <td className="py-3.5 px-4">
                            {getFormatBadge(doc.original_filename)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(doc.status)}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                            {formatDate(doc.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Download Original */}
                              <a
                                href={downloadUrl}
                                download={doc.original_filename}
                                title="Download Original File (Admin)"
                                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              {/* View Extracted Text */}
                              {doc.status === "completed" && (
                                <button
                                  onClick={() => handlePreviewText(doc)}
                                  title="View Extracted Text"
                                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Open Studio */}
                              <Link
                                href={`/documents/${doc.id}`}
                                title="Inspect in Document Studio"
                                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalDocs > limit && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500">
                  Showing page {docPage} of {Math.ceil(totalDocs / limit)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                    disabled={docPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setDocPage((p) => p + 1)}
                    disabled={docPage * limit >= totalDocs}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: USER DIRECTORY & ROLE MANAGEMENT */}
        {activeTab === "users" && (
          <section className="glass-panel rounded-3xl border border-zinc-800/80 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Registered Users</span>
                  {usersRefetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage user accounts, view access roles, and promote or demote administrators.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full glass-input rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => refetchUsers()}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Refresh users"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Current Role</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                        <span>Loading user directory...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        <p className="font-semibold text-zinc-400">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isTargetAdmin = u.role === "admin";
                      const isSelf = u.id === user?.id;
                      const isUpdating = updatingUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                          {/* User info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${
                                isTargetAdmin
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-300"
                              }`}>
                                {isTargetAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {u.username} {isSelf && <span className="text-[10px] text-amber-400 font-bold">(You)</span>}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">User ID #{u.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-zinc-300 font-mono">
                            {u.email}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {isTargetAdmin ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                                <Shield className="w-3 h-3 text-amber-400" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                                Standard User
                              </span>
                            )}
                          </td>

                          {/* Created date */}
                          <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                            {formatDate(u.created_at)}
                          </td>

                          {/* Role action button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isUpdating}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isTargetAdmin
                                  ? "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-red-400"
                                  : "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm"
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isTargetAdmin ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Demote to User</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Promote to Admin</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalUsers > limit && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500">
                  Showing page {userPage} of {Math.ceil(totalUsers / limit)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setUserPage((p) => p + 1)}
                    disabled={userPage * limit >= totalUsers}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Extracted Text Quick Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950 flex flex-col max-h-[85vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm truncate max-w-md">
                    {previewDoc.original_filename}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Uploaded by {previewDoc.user?.username || `User #${previewDoc.user_id}`} • Extracted Text
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewText && (
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(previewText);
                      setTextCopied(true);
                      toast.success("Copied extracted text!");
                      setTimeout(() => setTextCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
                  >
                    {textCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{textCopied ? "Copied" : "Copy"}</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-auto bg-zinc-950/80 font-mono text-xs leading-relaxed text-zinc-300">
              {previewLoading ? (
                <div className="py-16 text-center text-zinc-500">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-400 mb-2" />
                  <span>Loading extracted text stream...</span>
                </div>
              ) : previewText ? (
                <div className="whitespace-pre-wrap selection:bg-emerald-500/30">
                  {previewText}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-center py-12">No text content available.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                Document ID: #{previewDoc.id}
              </span>
              <a
                href={api.getAdminDocumentDownloadUrl(previewDoc.id)}
                download={previewDoc.original_filename}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original Document</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        DocuFlow Studio Admin Console • Full administrative privileges active
      </footer>
    </div>
  );
}
