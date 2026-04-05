import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MerryMe — 상상 속의 우리 결혼식, 미리 만나보세요",
  description:
    "AI를 활용해 둘만의 완벽한 결혼식과 꿈같은 신혼여행을 가상으로 체험하고, 아름다운 추억으로 남기세요. 스냅사진, 드레스 시착, 결혼식장 미리보기, 신혼여행 갤러리까지.",
  keywords: ["가상 결혼식", "AI 웨딩", "웨딩 스냅", "신혼여행", "MerryMe"],
  openGraph: {
    title: "MerryMe — 가상 결혼 & 신혼여행 체험",
    description: "AI로 만드는 우리만의 결혼 이야기",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
