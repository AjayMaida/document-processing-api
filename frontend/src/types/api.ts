export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | string;
  is_active?: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
}

export type ExtractionStatus = "not_started" | "pending" | "processing" | "completed" | "failed";

export interface DocumentItem {
  id: number;
  original_filename: string;
  stored_filename: string;
  status: string;
  created_at: string;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  page: number;
  limit: number;
  total: number;
}

export interface DocumentStatusInfo {
  document_status: string;
  extraction_status: ExtractionStatus;
}

export interface DocumentOwner {
  id: number;
  username: string;
  email: string;
}

export interface AdminDocumentItem extends DocumentItem {
  user_id: number;
  user: DocumentOwner;
}

export interface AdminDocumentListResponse {
  documents: AdminDocumentItem[];
  page: number;
  limit: number;
  total: number;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | string;
  created_at: string;
}

export interface UserListResponse {
  users: UserListItem[];
  page: number;
  limit: number;
  total: number;
}
