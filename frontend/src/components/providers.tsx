"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="dark"
          closeButton
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fafafa",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
