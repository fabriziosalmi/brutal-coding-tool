# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-19

First tagged release of **Brutal Rep Auditor** — a browser-based, AI-powered
GitHub repository auditor. This baselines a previously untagged project and makes
it actually runnable from a fresh clone.

### Added
- Core app: paste a public GitHub repo URL → fetch README, latest commits, file
  tree, manifests, and source samples → run a Gemini audit → render a scored
  report (radar chart + 20-point matrix + vibe check + prioritized fix plan),
  with Markdown export and print-to-PDF.
- Model fallback chain: `gemini-3-pro-preview` → `gemini-2.5-flash`.
- Continuous Integration (GitHub Actions): lint → typecheck → test → build, plus
  a guard step that fails if the build emits no application bundle.
- ESLint flat config and `npm run lint`.
- Vitest unit tests for the GitHub service (URL parsing, `403` rate-limit
  handling, context formatting) and `npm run test`.
- `npm run typecheck` (`tsc --noEmit`).
- README: quickstart (≤3 commands), a worked input→output demo, and an honest
  status / limitations section.
- This `CHANGELOG.md`.

### Fixed
- **Blank app / empty production build.** `index.html` never referenced the
  `index.tsx` entry module, so the dev server mounted nothing and `npm run build`
  produced a `dist/` with zero application JavaScript. Added the missing
  `<script type="module" src="/index.tsx">`.
- Removed an unused import and two redundant regex escapes flagged by ESLint
  (no behavior change).

### Security
- `.gitignore` now excludes `.env` / `.env.*` (keeping `.env.example`) so the
  Gemini API key can't be committed by accident.

[0.1.0]: https://github.com/fabriziosalmi/brutal-coding-tool/releases/tag/v0.1.0
