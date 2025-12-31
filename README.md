# VeriLearn Exam Pack (Next.js)

A full-stack Next.js app that turns YouTube lecture playlists into evidence-backed exam prep: blueprint, notes with timestamps, question bank, mock exam, mastery tracking, exports (PDF/HTML/CSV/TSV), and a live coach.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and paste a playlist or a list of video URLs. Provide your YouTube + Gemini API keys in the UI.

## Features

- Playlist ingestion via YouTube Data API
- Transcript grounding from YouTube timed text + storyboard keyframes
- Gemini Pro for notes + questions
- Gemini Flash for verification gates
- Mock exam with grading + remediation links
- Remediation plans grouped by weak topics
- Mastery tracking with spaced repetition cadence
- Exports: PDF + HTML + Anki CSV/TSV
- Shareable pack pages
- Saved pack list + delete
- Coach / Viva / Assist chat mode (streamed + live sessions)
- Deep research mode via Serper (optional API key)
- Resume generation via job id

## Deployment (Vercel)

1. Deploy the repo to Vercel.
2. Add **Vercel KV** if you want persistence across serverless invocations.
3. The UI collects API keys from the user, so no secrets are required at build time.

If KV is not configured, the app falls back to a local JSON file store in `data/` (dev only).

## Docs

- `docs/ARCHITECTURE.md`
- `docs/DEMO_SCRIPT.md`
- `docs/TESTING.md`

## Notes

- Transcripts are fetched from YouTube timed text endpoints; some videos may not expose captions.
- For best results, keep playlists under 20-30 lectures per run to avoid long generation times.
- Models are configurable in the UI (defaults: `gemini-3-pro`, `gemini-3-flash`).
- For Deep Research search, supply a Serper API key in the UI (optional).
- Upload PDFs/TXT in the Vault section to ground generation against syllabus or slides.
