# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router pages, API routes (`app/api/*`), hooks, and app-scoped components.
- `components/` holds shared UI components that are not app-route specific.
- `lib/` contains core domain logic (AI generation, path config, types, mock data, parsers).
- `__tests__/` stores Jest tests (e.g., `__tests__/schema.test.ts`).
- `scripts/` contains CLI utilities and research/test harnesses.
- `ocr-service/` is a separate Python OCR service with its own `README.md` and `requirements.txt`.
- `docs/` holds design/process notes such as `docs/PIPELINE.md`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server on `127.0.0.1:3001`.
- `npm run build`: production build.
- `npm run start`: run the production server after build.
- `npm run lint`: run ESLint (Next.js config).
- `npm run test`, `npm run test:watch`, `npm run test:coverage`: Jest tests.
- `npm run check-config`: validate `.env.local` configuration.
- `npm run pipeline:example`: run the AI pipeline demo script.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js). Use 2-space indentation and keep components in `.tsx`.
- Prefer types from `lib/types.ts` and keep path aliases via `@/` (root-based).
- Client components should include `'use client'` at the top.
- Run `npm run lint` before submitting changes.

## Testing Guidelines
- Jest + Testing Library; test patterns include `**/*.test.ts(x)` and `__tests__/`.
- Keep unit tests close to domain logic in `__tests__/` and name files `*.test.ts`.
- Use `npm run test -- path/to/test.ts` to run a single test file.

## Commit & Pull Request Guidelines
- Recent commits use conventional prefixes like `feat:`, `fix:`, `chore:` with short summaries; some messages are in Chinese. Follow the same pattern and keep subjects concise.
- PRs should explain the user-facing impact, include relevant screenshots for UI changes, and mention any new config keys.
- Link issues or tracking IDs when available.

## Configuration & Security Notes
- Copy `.env.local.example` to `.env.local` and update keys; see `CONFIG.md` for details.
- Never commit secrets; `.env.local` is gitignored.

## 操作原则
- **删除文件必须用 `trash` 命令，严禁使用 `rm`**（`trash` 移入回收站，可恢复；`rm` 永久删除，不可逆）
