import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";
import { CurrentProfessor } from "@/components/current-professor";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SE Project Evaluation Portal",
  description: "Faculty portal for software engineering project evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-900`}
      >
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-sky-50">
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  Software Engineering Project Evaluation
                </h1>
                <p className="text-xs text-zinc-500">
                  Faculty portal for panel-based project assessment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CurrentProfessor />
                <Link
                  href="/change-password"
                  className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                >
                  Change password
                </Link>
                <LogoutButton />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
