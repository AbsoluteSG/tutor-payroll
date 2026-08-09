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

export const metadata: Metadata = {
  title: "Tutor Payroll",
  description: "Class submissions, balances, and payouts",
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
