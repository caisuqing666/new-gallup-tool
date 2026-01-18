import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'docs', 'knowledge', 'raw');
const OUTPUT_PATH = path.join(ROOT, 'docs', 'knowledge', 'index.json');

const MIN_CHUNK = 320;
const MAX_CHUNK = 900;

function normalizeTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoChunks(text) {
  const paragraphs = normalizeText(text)
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';

  for (const para of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${para}` : para;
    if (candidate.length <= MAX_CHUNK) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push(buffer);
    }
    buffer = para;
  }

  if (buffer) {
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return [];
  }

  const merged = [];
  for (const chunk of chunks) {
    if (merged.length === 0) {
      merged.push(chunk);
      continue;
    }
    if (chunk.length < MIN_CHUNK && merged[merged.length - 1].length + chunk.length + 2 <= MAX_CHUNK) {
      merged[merged.length - 1] = `${merged[merged.length - 1]}\n\n${chunk}`;
    } else {
      merged.push(chunk);
    }
  }

  return merged;
}

function extractPdfText(pdfPath) {
  const pythonResult = spawnSync('python3', ['scripts/extract-pdf-text.py', pdfPath], {
    encoding: 'utf-8',
  });

  if (pythonResult.status === 0) {
    return pythonResult.stdout.trim();
  }

  const error = pythonResult.stderr || 'Unknown PDF extraction error.';
  throw new Error(error.trim());
}

function loadText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (ext === '.pdf') {
    return extractPdfText(filePath);
  }
  return '';
}

function buildIndex() {
  if (!fs.existsSync(RAW_DIR)) {
    throw new Error(`Missing directory: ${RAW_DIR}`);
  }

  const entries = fs.readdirSync(RAW_DIR);
  const sources = [];
  const chunks = [];

  for (const entry of entries) {
    const fullPath = path.join(RAW_DIR, entry);
    if (!fs.statSync(fullPath).isFile()) {
      continue;
    }

    const text = loadText(fullPath);
    if (!text) {
      continue;
    }

    const sourceId = entry.replace(/\.[^/.]+$/, '');
    const title = normalizeTitle(entry);
    sources.push({ id: sourceId, title, filename: entry });

    const split = splitIntoChunks(text);
    split.forEach((chunk, index) => {
      chunks.push({
        id: `${sourceId}-${index + 1}`,
        sourceId,
        sourceTitle: title,
        text: chunk,
      });
    });
  }

  const index = {
    version: 1,
    createdAt: new Date().toISOString(),
    sources,
    chunks,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2), 'utf-8');

  console.log(`Indexed ${chunks.length} chunks from ${sources.length} source(s).`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

buildIndex();
