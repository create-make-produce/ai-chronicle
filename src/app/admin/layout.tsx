// src/app/admin/layout.tsx
// 管理画面専用レイアウト（サイトのHeader/Footerを除外）
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
