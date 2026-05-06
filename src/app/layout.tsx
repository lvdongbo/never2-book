import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "不二集 Never2",
  description: "凡所记录，皆不再犯。",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
