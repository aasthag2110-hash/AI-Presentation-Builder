import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Presentation Assistant",
  description: "Create and refine presentations with AI assistance."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors closeButton position="top-right" toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
