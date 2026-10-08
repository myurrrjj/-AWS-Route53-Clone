import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { FlashProvider } from "@/components/FlashProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Route 53 Management Console",
  description: "A clone of the AWS Route 53 console for hosted zones and DNS records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <FlashProvider>
            <AuthProvider>{children}</AuthProvider>
          </FlashProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
