import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Queple - Deep Questions",
  description: "Connect deeply through meaningful questions.",
  icons: {
    icon: "/patterns/logo.png",
    shortcut: "/patterns/logo.png",
    apple: "/patterns/logo.png",
  },
  openGraph: {
    title: "Queple - Deep Questions",
    description: "Connect deeply through meaningful questions.",
    images: [
      {
        url: "/patterns/logo.png",
        width: 800,
        height: 600,
        alt: "Queple Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Queple - Deep Questions",
    description: "Connect deeply through meaningful questions.",
    images: ["/patterns/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
