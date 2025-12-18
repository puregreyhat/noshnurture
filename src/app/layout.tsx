import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import GoogleTranslate from "@/components/GoogleTranslate";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ConditionalHeyNosh from "@/components/ConditionalHeyNosh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NoshNuture - Smart Food Inventory",
  description: "Track your food, reduce waste, and save money",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        {/* Global subtle background pattern + soft gradients */}
        <div className="fixed inset-0 -z-10 pointer-events-none select-none">
          {/* soft radial glows */}
          <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-green-300/20 blur-3xl" />
          {/* light grid */}
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        <AuthProvider>
          <ToastProvider>
            <GoogleTranslate />
            {children}
            {/* Floating navbar visible on all screens */}
            <FloatingNavbar />
            {/* Hey Nosh Voice Assistant - hidden on survey page */}
            <ConditionalHeyNosh />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
