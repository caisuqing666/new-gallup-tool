import { StrengthId, getStrengthById } from './gallup-strengths';

declare const require: NodeRequire;

interface KnowledgeSource {
  id: string;
  title: string;
  filename: string;
}

interface KnowledgeChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  text: string;
}

interface KnowledgeIndex {
  version: number;
  createdAt: string;
  sources: KnowledgeSource[];
  chunks: KnowledgeChunk[];
}

export interface KnowledgeQuery {
  strengths?: StrengthId[];
  confusion?: string;
  problemFocus?: string;
  ocrText?: string;
  limit?: number;
}

let cachedIndex: KnowledgeIndex | null | undefined;
let cachedFs: typeof import('fs') | null = null;
let cachedPath: typeof import('path') | null = null;

function getIndexPath(): string {
  if (!cachedPath) {
    cachedPath = require('path') as typeof import('path');
  }
  return cachedPath.join(process.cwd(), 'docs', 'knowledge', 'index.json');
}

function loadIndex(): KnowledgeIndex | null {
  if (cachedIndex !== undefined) {
    return cachedIndex;
  }

  if (typeof window !== 'undefined') {
    cachedIndex = null;
    return cachedIndex;
  }

  if (!cachedFs) {
    cachedFs = require('fs') as typeof import('fs');
  }

  const indexPath = getIndexPath();
  if (!cachedFs.existsSync(indexPath)) {
    cachedIndex = null;
    return cachedIndex;
  }

  try {
    const raw = cachedFs.readFileSync(indexPath, 'utf-8');
    cachedIndex = JSON.parse(raw) as KnowledgeIndex;
    return cachedIndex;
  } catch (error) {
    console.warn('Failed to load knowledge index:', error);
    cachedIndex = null;
    return cachedIndex;
  }
}

function extractTerms(text?: string): string[] {
  if (!text) {
    return [];
  }

  const terms = new Set<string>();
  const cjkMatches = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const latinMatches = text.match(/[a-zA-Z][a-zA-Z0-9-]{2,}/g) || [];

  for (const term of [...cjkMatches, ...latinMatches]) {
    terms.add(term.toLowerCase());
  }

  return Array.from(terms);
}

function countOccurrences(text: string, term: string): number {
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(term, index);
    if (found === -1) {
      return count;
    }
    count += 1;
    index = found + term.length;
  }
}

function scoreChunk(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!term) {
      continue;
    }
    if (lower.includes(term)) {
      const occurrences = countOccurrences(lower, term);
      score += Math.min(3, occurrences) * (2 + term.length);
    }
  }
  return score;
}

export function buildKnowledgeContext(query: KnowledgeQuery): string {
  const index = loadIndex();
  if (!index || index.chunks.length === 0) {
    return '';
  }

  const strengthNames = (query.strengths || [])
    .map((id) => getStrengthById(id)?.name || id)
    .map((name) => name.toLowerCase());

  const terms = new Set<string>([
    ...strengthNames,
    ...extractTerms(query.problemFocus),
    ...extractTerms(query.confusion),
    ...extractTerms(query.ocrText),
  ]);

  const termList = Array.from(terms).filter((term) => term.length >= 2);
  if (termList.length === 0) {
    return '';
  }

  const scored = index.chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk.text, termList),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const limit = query.limit ?? 4;
  const top = scored.slice(0, limit);
  if (top.length === 0) {
    return '';
  }

  const lines = [
    '## 【参考资料（需优先引用）】',
    '以下内容来自内部资料，仅在有明确依据时使用；如无依据，请说明并不要编造。',
    '',
  ];

  for (const { chunk } of top) {
    lines.push(`### ${chunk.sourceTitle} (${chunk.id})`);
    lines.push(chunk.text);
    lines.push('');
  }

  return lines.join('\n').trim();
}
