'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Tool {
  id: string; slug: string; name_ja: string; name_en: string;
  tagline_ja: string; tagline_en: string; description_ja: string; description_en: string;
  official_url: string; logo_url: string; company_name: string;
  status: string; is_published: number; has_free_plan: number;
  manually_verified: number; has_verified_pricing: number; category_id: string; category_name_ja: string;
  product_hunt_url: string; ph_slug: string;
  ph_name: string;          // PH正式名（例: "Claude by Anthropic"）
  search_keywords: string;  // Noteマッチング用キーワード（例: "Claude,クロード,Claude AI"）
  launch_count: number;
  ios_url: string | null; android_url: string | null;
  created_at: string; updated_at: string;
}

interface Plan {
  id: string; tool_id: string; plan_name: string; plan_name_ja: string;
  is_free: number; price_usd: number | null; price_jpy_official: number | null;
  has_japan_pricing: number; billing_cycle: string;
  price_usd_annual: number | null; price_jpy_annual: number | null;
  manually_verified: number;
}

interface Contact {
  id: string; category: string; subject: string; email: string;
  checked: number; checked_at: string | null; created_at: string;
}

interface ContactDetail extends Contact {
  body: string;
}

interface NoteArticle {
  id: string; tool_id: string; title: string;
  thumbnail_url: string | null; author_name: string | null;
  note_url: string; likes_count: number; published_at: string | null;
  created_at: string;
}

const INPUT = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '7px 10px', background: '#111318',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
  color: '#F0EBE1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', ...extra
});

const BTN = (bg = '#008CED', color = '#000'): React.CSSProperties => ({
  padding: '6px 14px', background: bg, border: `1px solid ${bg}`, borderRadius: '2px',
  color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
  letterSpacing: '0.05em', textTransform: 'uppercase' as const,
});

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#4A5568',
  marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
};

const PANEL = (accent = '#008CED'): React.CSSProperties => ({
  background: '#1A1D24', border: '1px solid rgba(0,140,237,0.1)',
  borderLeft: `3px solid ${accent}`, borderRadius: '4px', padding: '1.25rem', marginBottom: '1rem',
});

export default function AdminDashboard() {
  const router = useRouter();

  const [mainTab, setMainTab] = useState<'tools' | 'contacts'>('tools');
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editTab, setEditTab] = useState<'tools' | 'pricing'>('tools');
  const [csvText, setCsvText] = useState('');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactDetail | null>(null);

  const [brokenLogos, setBrokenLogos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Note関連
  const [noteCountMap, setNoteCountMap] = useState<Record<string, number>>({});
  const [noteModal, setNoteModal] = useState<{ tool: Tool; articles: NoteArticle[] } | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortArrow = (col: string) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  const filteredTools = (() => {
    const list = [...tools];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if      (sortCol === 'published') { aVal = a.is_published; bVal = b.is_published; }
      else if (sortCol === 'company')   { aVal = a.company_name ?? ''; bVal = b.company_name ?? ''; }
      else if (sortCol === 'name')      { aVal = a.name_ja ?? ''; bVal = b.name_ja ?? ''; }
      else if (sortCol === 'launch')    { aVal = a.launch_count ?? 0; bVal = b.launch_count ?? 0; }
      else if (sortCol === 'ios')        { aVal = a.ios_url ? 1 : 0; bVal = b.ios_url ? 1 : 0; }
      else if (sortCol === 'android')    { aVal = a.android_url ? 1 : 0; bVal = b.android_url ? 1 : 0; }
      else if (sortCol === 'note')      { aVal = (noteCountMap[a.id] ?? 0) > 0 ? 1 : 0; bVal = (noteCountMap[b.id] ?? 0) > 0 ? 1 : 0; }
      else if (sortCol === 'desc')      { aVal = a.description_ja ? 1 : 0; bVal = b.description_ja ? 1 : 0; }
      else if (sortCol === 'url')       { aVal = a.official_url ? 1 : 0; bVal = b.official_url ? 1 : 0; }
      else if (sortCol === 'logo')      { aVal = a.logo_url ? 1 : 0; bVal = b.logo_url ? 1 : 0; }
      else if (sortCol === 'updated')   { aVal = a.updated_at ?? ''; bVal = b.updated_at ?? ''; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  const fetchTools = useCallback(async (q = '') => {
    setLoading(true);
    const res = await fetch(`/api/admin/tools?q=${encodeURIComponent(q)}`);
    if (res.status === 401) { router.push('/admin'); return; }
    const data = await res.json();
    setTools(data.tools ?? []);
    setLoading(false);
  }, [router]);

  const fetchNoteCounts = useCallback(async () => {
    const res = await fetch('/api/admin/notes?counts=1');
    if (!res.ok) return;
    const data = await res.json();
    setNoteCountMap(data.counts ?? {});
  }, []);

  const fetchContacts = useCallback(async () => {
    setContactLoading(true);
    const res = await fetch('/api/admin/contacts');
    if (res.status === 401) { router.push('/admin'); return; }
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setContactLoading(false);
  }, [router]);

  useEffect(() => { fetchTools(); fetchNoteCounts(); }, [fetchTools, fetchNoteCounts]);
  useEffect(() => { if (mainTab === 'contacts') fetchContacts(); }, [mainTab, fetchContacts]);

  const openNoteModal = async (tool: Tool) => {
    setNoteLoading(true);
    const res = await fetch(`/api/admin/notes?tool_id=${tool.id}`);
    const data = await res.json();
    setNoteModal({ tool, articles: data.articles ?? [] });
    setNoteLoading(false);
  };

  const deleteNoteArticle = async (articleId: string) => {
    if (!confirm('このNote記事をDBから削除しますか？')) return;
    await fetch(`/api/admin/notes?id=${articleId}`, { method: 'DELETE' });
    if (noteModal) {
      setNoteModal({ ...noteModal, articles: noteModal.articles.filter(a => a.id !== articleId) });
      setNoteCountMap(prev => ({
        ...prev,
        [noteModal.tool.id]: Math.max(0, (prev[noteModal.tool.id] ?? 1) - 1),
      }));
    }
    showMsg('✅ Note記事を削除しました');
  };

  const openContact = async (contact: Contact) => {
    const res = await fetch('/api/admin/contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contact.id }),
    });
    const data = await res.json();
    setSelectedContact(data.contact);
  };

  const toggleCheck = async (id: string, checked: boolean) => {
    await fetch('/api/admin/contacts', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, checked }),
    });
    fetchContacts();
    if (selectedContact?.id === id) {
      setSelectedContact(prev => prev ? { ...prev, checked: checked ? 1 : 0 } : null);
    }
    showMsg(checked ? '✅ チェック済みにしました（7日後に自動削除）' : '✅ チェックを解除しました');
  };

  const deleteContact = async (id: string) => {
    if (!confirm('このお問い合わせを削除しますか？')) return;
    await fetch(`/api/admin/contacts?id=${id}`, { method: 'DELETE' });
    setSelectedContact(null);
    fetchContacts();
    showMsg('✅ 削除しました');
  };

  const deleteTool = async (tool: Tool) => {
    if (!confirm(`「${tool.name_ja}」を削除しますか？\n関連するローンチ・ニュース・Note記事もすべて削除されます。`)) return;
    const res = await fetch(`/api/admin/tools?id=${tool.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      showMsg(`✅ 「${tool.name_ja}」を削除しました`);
      fetchTools(search);
    } else {
      showMsg('❌ 削除失敗: ' + data.error);
    }
  };

  const openEdit = async (tool: Tool) => {
    setEditTool({ ...tool });
    const res = await fetch(`/api/admin/pricing?tool_id=${tool.id}`);
    const data = await res.json();
    setPlans(data.plans ?? []);
    setEditTab('tools');
  };

  const saveTool = async () => {
    if (!editTool) return;
    setSaving(true);
    const res = await fetch('/api/admin/tools', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editTool, manually_verified: 1 }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { showMsg('✅ 保存しました'); fetchTools(search); }
    else showMsg('❌ 保存失敗: ' + data.error);
  };

  const savePlan = async (plan: Plan) => {
    const res = await fetch('/api/admin/pricing', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    const data = await res.json();
    if (data.ok) showMsg('✅ 料金プランを保存しました');
    else showMsg('❌ 保存失敗');
  };

  const toggleAllPricingLock = async (locked: boolean) => {
    if (plans.length === 0) return;
    const updated = plans.map(p => ({ ...p, manually_verified: locked ? 1 : 0 }));
    setPlans(updated);
    setSaving(true);
    await Promise.all(updated.map(plan =>
      fetch('/api/admin/pricing', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
    ));
    setSaving(false);
    fetchTools(search);
    showMsg(locked ? '✅ 料金を固定しました（全プラン）' : '✅ 料金固定を解除しました');
  };

  const addPlan = async () => {
    if (!editTool) return;
    await fetch('/api/admin/pricing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: editTool.id }),
    });
    const res = await fetch(`/api/admin/pricing?tool_id=${editTool.id}`);
    const data = await res.json();
    setPlans(data.plans ?? []);
  };

  const deletePlan = async (id: string) => {
    if (!confirm('このプランを削除しますか？')) return;
    await fetch(`/api/admin/pricing?id=${id}`, { method: 'DELETE' });
    setPlans(plans.filter(p => p.id !== id));
  };

  const exportCSV = async () => {
    const res = await fetch('/api/admin/csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chronicle-tools-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async () => {
    if (!csvText.trim()) { showMsg('❌ CSVデータを貼り付けてください'); return; }
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const dataLines = lines.length > 2 ? lines.slice(2) : lines.slice(1);
    const rows = dataLines.map(line => {
      const vals = parseCSVLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
      return obj;
    }).filter(r => r['id'] && r['id'] !== 'id');
    setSaving(true);
    const res = await fetch('/api/admin/csv', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setSaving(false);
    showMsg(`✅ ${data.updated}件更新${data.errors?.length ? `（エラー${data.errors.length}件）` : ''}`);
    setCsvText('');
    fetchTools(search);
  };

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  // PHリンク生成（ph_slug優先 → product_hunt_urlからフォールバック）
  const getPhUrl = (tool: Tool): string | null => {
    if (tool.ph_slug) return `https://www.producthunt.com/products/${tool.ph_slug}/launches`;
    const raw = tool.product_hunt_url;
    if (!raw) return null;
    const slug = raw.match(/\/products\/([^?/]+)/)?.[1] ?? raw.split('/posts/')?.[1]?.split('?')?.[0];
    return slug ? `https://www.producthunt.com/products/${slug}/launches` : null;
  };

  const uncheckedCount = contacts.filter(c => !c.checked).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0D12', color: '#F0EBE1', fontFamily: 'Fira Sans, sans-serif' }}>
      {/* ヘッダー */}
      <header style={{ background: '#1A1D24', borderBottom: '1px solid rgba(0,140,237,0.2)', padding: '0 1.5rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.95rem', fontWeight: 900, letterSpacing: '0.06em' }}>
          AI<span style={{ color: '#008CED' }}>/</span>CHRONICLE <span style={{ color: '#4A5568', fontSize: '0.7rem', fontFamily: 'Fira Sans, sans-serif' }}>Admin</span>
        </span>
        <button onClick={logout} style={BTN('#374151', '#9CA3AF')}>ログアウト</button>
      </header>

      {/* メインタブ */}
      <div style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '4px' }}>
          {[
            { key: 'tools',    label: 'ツール一覧',    badge: null },
            { key: 'contacts', label: 'お問い合わせ', badge: uncheckedCount > 0 ? uncheckedCount : null },
          ].map(({ key, label, badge }) => (
            <button key={key} onClick={() => setMainTab(key as any)}
              style={{ padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${mainTab === key ? '#008CED' : 'transparent'}`, color: mainTab === key ? '#008CED' : '#4A5568', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              {label}
              {badge !== null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', borderRadius: '50%', background: '#F97316', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '0 3px', lineHeight: 1 }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {msg && (
          <div style={{ padding: '10px 16px', background: msg.startsWith('✅') ? 'rgba(52,211,153,0.1)' : 'rgba(249,115,22,0.1)', border: `1px solid ${msg.startsWith('✅') ? '#34D399' : '#F97316'}`, borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', color: msg.startsWith('✅') ? '#34D399' : '#F97316' }}>
            {msg}
          </div>
        )}

        {/* ===== ツール一覧タブ ===== */}
        {mainTab === 'tools' && (
          <>
            <div style={PANEL()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A8A99', margin: 0 }}>
                  ツール一覧 <span style={{ color: '#008CED' }}>{filteredTools.length}件</span>
                </h2>
                <input type="text" placeholder="名前・スラッグで検索..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchTools(search)}
                  style={{ ...INPUT(), maxWidth: '300px', flex: 1 }} />
                <button onClick={() => fetchTools(search)} style={BTN()}>検索</button>
                <button onClick={exportCSV} style={{ ...BTN('#10B981', '#000'), marginLeft: 'auto' }}>CSV出力</button>
              </div>

              {/* 非表示ロゴ読み込み */}
              <div style={{ display: 'none' }}>
                {tools.map(tool => tool.logo_url ? (
                  <img key={tool.id} src={tool.logo_url} alt=""
                    onError={() => setBrokenLogos(prev => prev.includes(tool.name_en) ? prev : [...prev, tool.name_en])}
                    onLoad={() => setBrokenLogos(prev => prev.filter(n => n !== tool.name_en))}
                  />
                ) : null)}
              </div>

              {brokenLogos.length > 0 && (
                <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>⚠ ロゴ読み込みエラー {brokenLogos.length}件：</span>
                  <span style={{ color: '#9CA3AF', marginLeft: '8px' }}>{brokenLogos.join('、')}</span>
                </div>
              )}

              {loading ? <p style={{ color: '#4A5568', fontSize: '0.85rem' }}>読み込み中...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#111318' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {[
                          { col: 'published', label: '公開' },
                          { col: 'company',   label: '会社名' },
                          { col: 'name',      label: 'ツール名' },
                          { col: 'launch',    label: 'ローンチ' },
          { col: 'ios',       label: 'iOS' },
          { col: 'android',   label: 'Android' },
                          { col: 'note',      label: 'NOTE' },
                        ].map(({ col, label }) => (
                          <th key={col} onClick={() => handleSort(col)}
                            style={{ padding: '8px 10px', textAlign: col === 'launch' || col === 'note' ? 'center' : 'left', color: sortCol === col ? '#008CED' : '#4A5568', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontSize: '0.65rem', cursor: 'pointer', userSelect: 'none', background: '#111318' }}>
                            {label}{sortArrow(col)}
                          </th>
                        ))}
                        {[
                          { col: 'desc',  label: '概要',    right: 100 },
                          { col: 'url',   label: '公式URL', right: 50 },
                          { col: 'logo',  label: 'ロゴ',    right: 0 },
                        ].map(({ col, label, right }) => (
                          <th key={col} onClick={() => handleSort(col)}
                            style={{ padding: '8px 6px', textAlign: 'center', color: sortCol === col ? '#008CED' : '#4A5568', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', position: 'sticky', right: `${right}px`, background: '#111318', zIndex: 3, width: '50px' }}>
                            {label}{sortArrow(col)}
                          </th>
                        ))}
                        <th onClick={() => handleSort('updated')}
                          style={{ padding: '8px 10px', textAlign: 'left', color: sortCol === 'updated' ? '#008CED' : '#4A5568', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontSize: '0.65rem', cursor: 'pointer', userSelect: 'none', background: '#111318' }}>
                          更新日{sortArrow('updated')}
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#4A5568', fontWeight: 700, fontSize: '0.65rem', background: '#111318' }}>PH</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#4A5568', fontWeight: 700, fontSize: '0.65rem', background: '#111318' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.map(tool => {
                        const noteCount = noteCountMap[tool.id] ?? 0;
                        const launchCount = tool.launch_count ?? 0;
                        const phUrl = getPhUrl(tool);
                        return (
                          <tr key={tool.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,140,237,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                            {/* 公開 */}
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 700, background: tool.is_published ? 'rgba(52,211,153,0.15)' : 'rgba(156,163,175,0.1)', color: tool.is_published ? '#34D399' : '#6B7280' }}>
                                {tool.is_published ? '公開' : '非公開'}
                              </span>
                            </td>

                            {/* 会社名 */}
                            <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tool.company_name ?? ''}
                            </td>

                            {/* ツール名 */}
                            <td style={{ padding: '8px 10px', maxWidth: '200px' }}>
                              <a href={`/tool/${tool.slug}`} target="_blank" rel="noreferrer"
                                style={{ fontWeight: 600, color: '#008CED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>
                                {tool.name_ja}
                              </a>
                              <div style={{ color: '#4A5568', fontSize: '0.7rem' }}>{tool.slug}</div>
                            </td>

                            {/* ローンチ件数（DB） */}
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: launchCount > 0 ? '#F0EBE1' : '#4A5568' }}>
                                {launchCount > 0 ? launchCount : '—'}
                              </span>
                            </td>

                            {/* Note */}
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button onClick={() => openNoteModal(tool)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '3px', fontSize: '0.82rem', color: noteCount > 0 ? '#34D399' : '#EF4444', fontWeight: 700 }}
                                title={noteCount > 0 ? `${noteCount}件のNote記事` : 'Note記事なし'}>
                                {noteCount > 0 ? `○ ${noteCount}` : '×'}
                              </button>
                            </td>

                            {/* 概要・URL・ロゴ（sticky） */}
                            <td style={{ padding: '8px 6px', textAlign: 'center', position: 'sticky', right: '100px', background: 'inherit', zIndex: 1, width: '50px' }}>
                              <StatusDot ok={!!tool.description_ja} />
                            </td>
                            <td style={{ padding: '8px 6px', textAlign: 'center', position: 'sticky', right: '50px', background: 'inherit', zIndex: 1, width: '50px' }}>
                              <StatusDot ok={!!tool.official_url} />
                            </td>
                            <td style={{ padding: '8px 6px', textAlign: 'center', position: 'sticky', right: '0px', background: 'inherit', zIndex: 1, width: '50px' }}>
                              <StatusDot ok={!!tool.logo_url && !brokenLogos.includes(tool.name_en)} error={brokenLogos.includes(tool.name_en)} />
                            </td>

                            {/* 更新日 */}
                            <td style={{ padding: '8px 10px', color: '#4A5568', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                              {tool.updated_at?.slice(0, 10)}
                            </td>

                            {/* PHリンク */}
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {phUrl ? (
                                <a href={phUrl} target="_blank" rel="noreferrer"
                                  style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(249,115,22,0.15)', color: '#F97316', textDecoration: 'none' }}>
                                  PH
                                </a>
                              ) : <span style={{ color: '#4A5568', fontSize: '0.65rem' }}>—</span>}
                            </td>

                            {/* iOS */}
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {tool.ios_url
                                ? <span style={{ color: '#34D399', fontWeight: 700 }}>○</span>
                                : <span style={{ color: '#F87171', fontWeight: 700 }}>×</span>}
                            </td>
                            {/* Android */}
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {tool.android_url
                                ? <span style={{ color: '#34D399', fontWeight: 700 }}>○</span>
                                : <span style={{ color: '#F87171', fontWeight: 700 }}>×</span>}
                            </td>
                            {/* 操作 */}
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => openEdit(tool)} style={BTN('#1A56DB', '#fff')}>編集</button>
                                <button onClick={() => deleteTool(tool)} style={BTN('#7F1D1D', '#FCA5A5')}>削除</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CSV一括インポート */}
            <div style={PANEL('#F97316')}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A8A99', marginBottom: '0.5rem' }}>
                CSV一括インポート
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#4A5568', marginBottom: '0.75rem' }}>
                出力したCSVを編集して貼り付け → id列をキーに差分上書き。1行目・2行目は自動スキップ。
              </p>
              <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                placeholder="CSVデータをここに貼り付け..." rows={6}
                style={{ ...INPUT(), resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' }} />
              <div style={{ marginTop: '0.75rem' }}>
                <button onClick={importCSV} disabled={saving} style={BTN(saving ? '#374151' : '#F97316', saving ? '#9CA3AF' : '#000')}>
                  {saving ? 'インポート中...' : 'インポート実行'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===== お問い合わせタブ ===== */}
        {mainTab === 'contacts' && (
          <div style={PANEL('#60A5FA')}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A8A99', marginBottom: '1rem' }}>
              お問い合わせ一覧 <span style={{ color: '#60A5FA' }}>{contacts.length}件</span>
              {uncheckedCount > 0 && <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(249,115,22,0.2)', color: '#F97316', borderRadius: '2px', fontSize: '0.7rem' }}>未確認 {uncheckedCount}件</span>}
            </h2>

            {contactLoading ? <p style={{ color: '#4A5568' }}>読み込み中...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {['確認', 'カテゴリ', '件名', '連絡先', '受信日時', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#4A5568', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#4A5568' }}>お問い合わせはありません</td></tr>
                      ) : contacts.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedContact?.id === c.id ? 'rgba(96,165,250,0.08)' : 'transparent', opacity: c.checked ? 0.5 : 1 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,140,237,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = selectedContact?.id === c.id ? 'rgba(96,165,250,0.08)' : 'transparent')}>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="checkbox" checked={!!c.checked}
                              onChange={e => toggleCheck(c.id, e.target.checked)}
                              style={{ accentColor: '#008CED', width: '15px', height: '15px', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>{c.category}</span>
                          </td>
                          <td style={{ padding: '8px 10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F0EBE1' }}>{c.subject}</td>
                          <td style={{ padding: '8px 10px', color: '#4A5568', fontSize: '0.72rem' }}>{c.email || '—'}</td>
                          <td style={{ padding: '8px 10px', color: '#4A5568', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                            {c.created_at?.replace('T', ' ').slice(0, 16)}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <button onClick={() => openContact(c)} style={BTN('#1A56DB', '#fff')}>詳細</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedContact && (
                  <div style={{ background: '#111318', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '4px', padding: '1.5rem', position: 'sticky', top: '1rem', alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>{selectedContact.category}</span>
                      <button onClick={() => setSelectedContact(null)} style={{ background: 'transparent', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F0EBE1', marginBottom: '1rem', lineHeight: 1.4 }}>{selectedContact.subject}</h3>
                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ color: '#4A5568', minWidth: '60px' }}>受信日時</span>
                        <span style={{ color: '#9CA3AF' }}>{selectedContact.created_at?.replace('T', ' ').slice(0, 16)}</span>
                      </div>
                      {selectedContact.email && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ color: '#4A5568', minWidth: '60px' }}>連絡先</span>
                          <a href={`mailto:${selectedContact.email}`} style={{ color: '#008CED' }}>{selectedContact.email}</a>
                        </div>
                      )}
                      {selectedContact.checked_at && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ color: '#4A5568', minWidth: '60px' }}>確認日時</span>
                          <span style={{ color: '#34D399', fontSize: '0.72rem' }}>{selectedContact.checked_at?.slice(0, 16)} ✓</span>
                        </div>
                      )}
                    </div>
                    <div style={{ background: '#1A1D24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#D1D5DB', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                      {selectedContact.body}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => toggleCheck(selectedContact.id, !selectedContact.checked)}
                        style={BTN(selectedContact.checked ? '#374151' : '#008CED', selectedContact.checked ? '#9CA3AF' : '#000')}>
                        {selectedContact.checked ? 'チェック解除' : '確認済みにする'}
                      </button>
                      <button onClick={() => deleteContact(selectedContact.id)} style={BTN('#DC2626', '#fff')}>削除</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Note記事モーダル ===== */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, overflowY: 'auto', padding: '2rem' }}
          onClick={e => e.target === e.currentTarget && setNoteModal(null)}>
          <div style={{ maxWidth: '900px', margin: '0 auto', background: '#1A1D24', border: '1px solid rgba(0,140,237,0.2)', borderTop: '3px solid #34D399', borderRadius: '4px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F0EBE1', margin: 0 }}>
                  Note記事 — {noteModal.tool.name_ja}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#4A5568', marginTop: '4px' }}>{noteModal.articles.length}件</p>
              </div>
              <button onClick={() => setNoteModal(null)} style={BTN('#374151', '#9CA3AF')}>閉じる</button>
            </div>

            {noteLoading ? (
              <p style={{ color: '#4A5568' }}>読み込み中...</p>
            ) : noteModal.articles.length === 0 ? (
              <p style={{ color: '#4A5568', textAlign: 'center', padding: '2rem' }}>Note記事はありません</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {noteModal.articles.map(article => (
                  <div key={article.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                    {article.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.thumbnail_url} alt="" style={{ width: '80px', height: '54px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={article.note_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#F0EBE1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {article.title}
                      </a>
                      <div style={{ fontSize: '0.72rem', color: '#4A5568', marginTop: '3px' }}>
                        {article.author_name && <span style={{ marginRight: '12px' }}>{article.author_name}</span>}
                        {article.likes_count > 0 && <span style={{ marginRight: '12px' }}>♡ {article.likes_count}</span>}
                        {article.published_at && <span>{article.published_at?.slice(0, 10)}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteNoteArticle(article.id)} style={{ ...BTN('#DC2626', '#fff'), flexShrink: 0, whiteSpace: 'nowrap' }}>
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ツール編集モーダル ===== */}
      {editTool && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, overflowY: 'auto', padding: '2rem' }}
          onClick={e => e.target === e.currentTarget && setEditTool(null)}>
          <div style={{ maxWidth: '900px', margin: '0 auto', background: '#1A1D24', border: '1px solid rgba(0,140,237,0.2)', borderTop: '3px solid #008CED', borderRadius: '4px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F0EBE1', margin: 0 }}>{editTool.name_ja}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveTool} disabled={saving} style={BTN()}>{saving ? '保存中...' : '保存'}</button>
                <button onClick={() => setEditTool(null)} style={BTN('#374151', '#9CA3AF')}>閉じる</button>
              </div>
            </div>

            {/* PRICING_DISABLED */}

            {editTab === 'tools' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { key: 'name_ja',      label: 'ツール名（日本語）' },
                  { key: 'name_en',      label: 'ツール名（英語）' },
                  { key: 'tagline_ja',   label: 'タグライン（日本語）' },
                  { key: 'tagline_en',   label: 'タグライン（英語）' },
                  { key: 'official_url', label: '公式URL' },
                  { key: 'logo_url',     label: 'ロゴURL' },
                  { key: 'company_name', label: '会社名' },
                  { key: 'ph_name',      label: 'PH正式名（例: Claude by Anthropic）' },
                ].map(({ key, label }) => {
                  const val = (editTool as any)[key] ?? '';
                  const isEmpty = !val;
                  return (
                    <div key={key}>
                      <label style={{ ...LABEL, color: isEmpty ? '#EF4444' : '#4A5568' }}>{label}{isEmpty ? ' ⚠ 未入力' : ''}</label>
                      <input value={val} onChange={e => setEditTool({ ...editTool, [key]: e.target.value })}
                        style={INPUT({ borderColor: isEmpty ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)' })} />
                    </div>
                  );
                })}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL}>Noteマッチングキーワード（カンマ区切り）</label>
                  <input
                    value={(editTool as any).search_keywords ?? ''}
                    onChange={e => setEditTool({ ...editTool, search_keywords: e.target.value })}
                    placeholder="例: Claude,クロード,Claude AI"
                    style={INPUT()}
                  />
                  <p style={{ fontSize: '0.65rem', color: '#4A5568', marginTop: '4px' }}>
                    Note記事タイトルと照合するキーワード。英語名・日本語名・略称をカンマ区切りで入力。
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...LABEL, color: !editTool.description_ja ? '#EF4444' : '#4A5568' }}>
                    概要（日本語）{!editTool.description_ja ? ' ⚠ 未入力' : ''}
                  </label>
                  <textarea value={editTool.description_ja ?? ''} onChange={e => setEditTool({ ...editTool, description_ja: e.target.value })} rows={4}
                    style={{ ...INPUT(), resize: 'vertical', borderColor: !editTool.description_ja ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...LABEL, color: !editTool.description_en ? '#EF4444' : '#4A5568' }}>
                    概要（英語）{!editTool.description_en ? ' ⚠ 未入力' : ''}
                  </label>
                  <textarea value={editTool.description_en ?? ''} onChange={e => setEditTool({ ...editTool, description_en: e.target.value })} rows={4}
                    style={{ ...INPUT(), resize: 'vertical', borderColor: !editTool.description_en ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label style={LABEL}>ステータス</label>
                  <select value={editTool.status} onChange={e => setEditTool({ ...editTool, status: e.target.value })} style={{ ...INPUT(), cursor: 'pointer' }}>
                    <option value="active">active（稼働中）</option>
                    <option value="beta">beta</option>
                    <option value="inactive">inactive（停止）</option>
                    <option value="deprecated">deprecated（廃止）</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {[
                    { key: 'is_published',      label: '公開する' },
                    { key: 'has_free_plan',      label: '無料プランあり' },
                    { key: 'manually_verified',  label: 'ツール内容固定（自動更新スキップ）' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#9CA3AF', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!(editTool as any)[key]} onChange={e => setEditTool({ ...editTool, [key]: e.target.checked ? 1 : 0 })} style={{ accentColor: '#008CED', width: '16px', height: '16px' }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ ok, error }: { ok: boolean; error?: boolean }) {
  if (error) return <span style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 700 }} title="404エラー">✕</span>;
  if (ok)    return <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>○</span>;
  return       <span style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 700 }}>✕</span>;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
