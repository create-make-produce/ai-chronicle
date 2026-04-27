import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ | AI Chronicle',
  description: 'AI Chronicleへのお問い合わせはこちらから。',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
