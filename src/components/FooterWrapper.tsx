// src/components/FooterWrapper.tsx
import Footer from './Footer';

export default function FooterWrapper({ showFeatures = false }: { showFeatures?: boolean }) {
  return <Footer lang="ja" showFeatures={showFeatures} />;
}
