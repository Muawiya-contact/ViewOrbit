import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/styles/theme.css";
import { ToastViewport } from "@/components/design-system/ToastViewport";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthContextProvider } from "@/context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ViewOrbit",
  description: "Enterprise video engagement platform frontend",
  icons: {
    icon: "/favicon.ico?v=3",
    shortcut: "/favicon.ico?v=3",
    apple: "/favicon.ico?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <AuthContextProvider>
          <AuthProvider>{children}</AuthProvider>
        </AuthContextProvider>
        <ToastViewport />
      </body>
    </html>
  );
}
