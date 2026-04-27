export const runtime = 'edge';
import { redirect } from 'next/navigation';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/tools?cat=${slug}`);
}
