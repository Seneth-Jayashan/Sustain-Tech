import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SustainTech: 10 Days to Decide | Annual Research Symposium 2026",
  description: "Disaster Command & Strategic Resilience Simulator — Annual Research Symposium 2026",
  icons: {
    icon: "/assets/images/Logo.jpg",
    apple: "/assets/images/Logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050b14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full min-h-[100dvh] flex flex-col bg-[#050b14] text-slate-100 selection:bg-teal-500/30 overflow-x-hidden">{children}</body>
    </html>
  );
}

