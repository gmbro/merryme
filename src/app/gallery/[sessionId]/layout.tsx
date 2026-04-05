import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;

  return {
    title: `웨딩 앨범 | MerryMe`,
    description: 'AI가 만들어준 가상 웨딩 앨범을 감상하세요. 스냅사진, 드레스 시착, 결혼식, 신혼여행까지!',
    openGraph: {
      title: '💍 MerryMe - 가상 웨딩 앨범',
      description: 'AI가 만들어준 특별한 가상 웨딩 앨범을 함께 감상해보세요!',
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/gallery/${sessionId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: '💍 MerryMe - 가상 웨딩 앨범',
      description: 'AI가 만들어준 특별한 가상 웨딩 앨범',
    },
  };
}

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
