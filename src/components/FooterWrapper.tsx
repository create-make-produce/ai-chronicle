'use client';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  const isEn = pathname.startsWith('/en');
  return <Footer lang={isEn ? 'en' : 'ja'} />;
}
