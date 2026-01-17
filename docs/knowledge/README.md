# Knowledge Base

This folder stores the offline knowledge used for prompt injection.

Workflow:
1. Put source files in `docs/knowledge/raw/` (prefer `.txt` or `.md`).
2. Run `node scripts/knowledge-index.mjs` to build `docs/knowledge/index.json`.
3. The runtime will load the index and inject top matches into prompts.

PDFs:
- If you only have PDFs, convert them to text first, or install `pypdf`
  and let the script extract text via `scripts/extract-pdf-text.py`.
