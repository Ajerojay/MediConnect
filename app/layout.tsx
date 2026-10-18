import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "MediConnect", template: "%s | MediConnect" },
  description: "Secure healthcare appointments and medical records.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Extensions such as Grammarly add body attributes before hydration. */}
      <body suppressHydrationWarning>
        <a
          href="#main"
          className="focus-ring fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-white p-3 focus:translate-y-0"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
