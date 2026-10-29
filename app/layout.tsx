import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "My Work AI | 나의 업무 파트너",
  description: "업무를 연결하는 통합 AI 비서",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
