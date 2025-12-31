# VeriLearn Architecture

## Overview
VeriLearn is a single Next.js full-stack app hosted on Vercel. The UI, API routes, and pipeline logic all live in one codebase. Long-running generation is dispatched in the background using `waitUntil`, and results are stored in Vercel KV or a local JSON store for dev.

## Data flow
1. User submits a playlist + API keys in the UI.
2. `/api/generate-pack` creates a job and starts the pipeline.
3. The pipeline ingests YouTube metadata + transcripts, then:
   - Builds a blueprint.
   - Generates evidence-backed notes.
   - Generates and verifies the question bank.
   - Builds a mock exam and mastery state.
4. UI receives progress from polling or SSE.
5. Results are stored as a Pack and surfaced via `/api/study-pack/:id` and share pages.

## Key modules
- `lib/verimap.ts`: playlist -> blueprint.
- `lib/verinotes.ts`: transcript-grounded notes with citations and visuals.
- `lib/storyboard.ts`: storyboard keyframes for visual evidence (sprite tiles).
- `lib/veribank.ts`: structured question bank.
- `lib/veriverify.ts`: verification and regeneration gates.
- `lib/veriexam.ts`: mock exam assembly + grading.
- `lib/veriexports.ts`: PDF/HTML/Anki exports.
- `lib/verivault.ts` (via `app/api/vault`): PDF/TXT ingestion and storage.
- `lib/vaultSearch.ts`: lightweight vault search for grounding snippets.
- `lib/coach.ts`: prompts for coach/viva/assist modes.

## Storage
- Vercel KV (recommended): jobs, packs, vault docs, transcripts.
- Local store (`data/store.json`) when KV is not configured.

## APIs
- `POST /api/generate-pack` (supports optional resume job id)
- `GET /api/status/:jobId` + `GET /api/status/stream/:jobId`
- `GET /api/packs`
- `GET/DELETE /api/study-pack/:packId`
- `POST /api/submit-answer`
- `POST /api/remediation`
- `GET /api/export/pdf|html|anki`
- `POST /api/coach` (stateless stream)
- `POST /api/coach/session` + `POST /api/coach/session/:id` (live sessions)
- `POST /api/vault`

## Deployment
Designed for Vercel. The UI collects API keys per user, so no build-time secrets are required. KV is optional for persistence.
