// src/lib/category-colors.ts
// カテゴリカラー定義の唯一の真実（Single Source of Truth）
// ToolCard・NewsRow・その他すべてのコンポーネントはここからimportする

export interface CategoryColor {
  bg:     string;
  color:  string;
  border: string;
  text:   string;
  label:  string; // バッジ表示用短縮名
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'text-generation':  { bg: 'rgba(139,184,255,0.12)', color: '#8BB8FF', border: 'rgba(139,184,255,0.5)', text: '#2B5FA8', label: '文章・チャット' },
  'image-generation': { bg: 'rgba(255,182,200,0.12)', color: '#FFB6C8', border: 'rgba(255,182,200,0.5)', text: '#A03050', label: '画像・動画'     },
  'audio':            { bg: 'rgba(192,168,255,0.12)', color: '#C0A8FF', border: 'rgba(192,168,255,0.5)', text: '#5E38B0', label: '音声・音楽'     },
  'coding':           { bg: 'rgba(168,240,212,0.12)', color: '#A8F0D4', border: 'rgba(168,240,212,0.5)', text: '#1E7A58', label: 'コーディング'   },
  'productivity':     { bg: 'rgba(255,200,130,0.12)', color: '#FFC882', border: 'rgba(255,200,130,0.5)', text: '#8A5010', label: '業務効率化'     },
  'research':         { bg: 'rgba(130,210,200,0.12)', color: '#82D2C8', border: 'rgba(130,210,200,0.5)', text: '#1E7A70', label: '情報・分析'     },
  'marketing':        { bg: 'rgba(255,224,102,0.12)', color: '#FFE066', border: 'rgba(255,224,102,0.5)', text: '#7A5200', label: 'マーケティング' },
  'other':            { bg: 'rgba(200,200,200,0.10)', color: '#AAAAAA', border: 'rgba(200,200,200,0.4)',  text: '#555555', label: 'その他'         },
};

export const DEFAULT_CATEGORY_COLOR: CategoryColor =
  { bg: 'rgba(200,200,200,0.10)', color: '#AAAAAA', border: 'rgba(200,200,200,0.4)', text: '#555555', label: 'その他' };

export function getCategoryColor(slug?: string | null): CategoryColor {
  return (slug && CATEGORY_COLORS[slug]) ? CATEGORY_COLORS[slug] : DEFAULT_CATEGORY_COLOR;
}
