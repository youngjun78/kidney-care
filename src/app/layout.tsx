import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "안심콩팥케어 - 신장 질환 식단 안심 케어 서비스",
  description: "3040 자녀와 5070 부모님을 잇는 AI 기반 신장 질환 식단 안심 케어",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">{children}</body>
    </html>
  );
}
