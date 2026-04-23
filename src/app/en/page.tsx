import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chronicle - AI Tools Database & Price Comparison",
  description:
    "Cross-compare AI tools, pricing, free plans, and latest news. Updated automatically.",
};

/**
 * AI Chronicle - Top Page (English)
 *
 * Phase 1: Minimal page for setup verification.
 */
export default function HomePageEn() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/en" className="font-display text-2xl font-black tracking-tight">
            AI CHRONICLE
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/en/tools" className="hover:text-accent transition-colors">
              Tools
            </Link>
            <Link href="/en/news" className="hover:text-accent transition-colors">
              News
            </Link>
            <Link href="/en/free" className="hover:text-accent transition-colors">
              Free Tools
            </Link>
            <Link
              href="/"
              className="text-xs font-bold tracking-widest border border-border px-3 py-1 rounded hover:bg-text hover:text-bg transition-colors"
            >
              JP
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="section-label mb-4">★ AI TOOLS DATABASE ★</p>
        <h1 className="hero-heading text-5xl md:text-7xl mb-6">
          Compare every<br />
          AI tool. Instantly.
        </h1>
        <p className="text-text-sub text-lg max-w-2xl">
          Pricing, features, free plans, and the latest news — bilingual,
          automatically updated.
        </p>

        <div className="mt-10 inline-flex items-center gap-3 text-sm text-text-muted">
          <span>🚧</span>
          <span>Phase 1 in progress: foundation setup complete</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-xs text-text-muted leading-relaxed">
            Information about AI tools on this site including pricing, features,
            and specifications is collected automatically and provided for
            reference only. We do not guarantee the accuracy or completeness of
            this information. Please verify current information on each tool's
            official website.
          </p>
          <div className="mt-6 flex gap-6 text-xs text-text-sub">
            <Link href="/about" className="hover:text-accent">About</Link>
            <Link href="/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/contact" className="hover:text-accent">Contact</Link>
          </div>
          <p className="mt-6 text-xs text-text-muted">© 2026 AI Chronicle</p>
        </div>
      </footer>
    </main>
  );
}
