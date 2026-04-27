export const runtime = 'edge';
import { redirect } from 'next/navigation';

export default async function CategoryPageEn({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/en/tools?cat=${slug}`);
}
