import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocuFlow — Document Processing Studio",
  description: "Asynchronous document processing, text extraction & analytics platform powered by FastAPI & Celery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#09090b] text-zinc-100 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
