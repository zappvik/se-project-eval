import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";
import { CurrentProfessor } from "@/components/current-professor";
import { ChangePasswordLink } from "@/components/change-password-link";

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-sky-50 pb-safe">
          <div className="mx-auto w-full max-w-5xl flex flex-col px-3 py-4 sm:px-6 sm:py-8">
            <header className="mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 truncate">
                    SE Project Evaluation
                  </h1>
                  <p className="text-xs text-zinc-500 hidden sm:block">
                    Faculty portal for panel-based project assessment.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 justify-end w-full sm:w-auto">
                  <CurrentProfessor />
                  <ChangePasswordLink />
                  <LogoutButton />
                </div>
              </div>
            </header>
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
