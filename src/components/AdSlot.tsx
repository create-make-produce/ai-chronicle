// src/components/AdSlot.tsx
// AdSense/アフィリエイト広告の配置枠
// HayakatsuLabo方式：最初は display:none で準備、承認後に表示切替
// styles: .ad-slot を globals.css に定義済み（display:none !important）

interface AdSlotProps {
  /** 枠の識別用（ヘッダー、サイドバー、インコンテンツなど） */
  slot?: 'header' | 'sidebar' | 'in-content' | 'footer' | 'anchor';
  /** カスタムクラス */
  className?: string;
}

export default function AdSlot({ slot = 'in-content', className = '' }: AdSlotProps) {
  return (
    <div className={`ad-slot ${className}`} data-ad-slot={slot} aria-hidden="true">
      {/* AdSense承認後、ここに ins タグを挿入し、
          globals.css の .ad-slot を display:block に変更 */}
      <span>advertisement</span>
    </div>
  );
}
