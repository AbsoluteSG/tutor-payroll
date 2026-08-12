import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundFade } from "@/components/background-fade";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The public default. Every marketing page sets its own title; this is what
 * anything without one inherits, including the homepage — which until the
 * marketing site moved to the root was announcing itself as "Tutor Payroll —
 * class submissions, balances, and payouts", the internal app's metadata, on
 * the front door.
 *
 * The signed-in app (/admin, /dashboard) inherits it too. That is harmless —
 * those routes are behind auth and not indexed — but they should carry a
 * noindex before anything crawls them.
 */
export const metadata: Metadata = {
  title: {
    default: "Borough Prep — An independent tutoring studio",
    template: "%s",
  },
  description:
    "Online one-to-one tutoring from Brooklyn: English, mathematics, computer science, and preparation for the SHSAT, SAT, and ACT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes the theme class onto <html> before paint, which the
    // server cannot know about; suppressHydrationWarning covers exactly that
    // one attribute and nothing below it.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // Without this, every colour on the page runs its own transition
          // during a theme switch and the change arrives as a slow smear.
          disableTransitionOnChange
        >
          {children}
          <BackgroundFade />
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
