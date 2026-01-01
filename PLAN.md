# VeriLearn Exam Pack - Hackathon Plan

Goal: turn lecture playlists into a trusted, evidence-backed exam prep system that feels like a product in a 3-minute demo and scores high on Technical Execution, Innovation, Impact, and Demo.

## Win Criteria
- Judges understand the product in under 30 seconds.
- End-to-end flow works live: playlist -> notes + questions -> exam simulator -> remediation.
- Every claim and answer is grounded with citations to video timestamps and (optional) screenshots.
- Outputs are exportable (PDF + Anki + share link) and look polished.

## Product Promise
"Paste a playlist and exam date; VeriLearn builds a syllabus-aligned exam plan, evidence-backed notes, and a practice system that targets your weaknesses."

## Scope

### Must-Have (Grand Prize Magnets)
- Evidence-anchored notes with timestamp citations and deep links.
- Evidence-anchored question bank with auto-verification and regeneration.
- Exam simulator with grading and remediation links.

### Should-Have
- Blueprint builder: topics, prerequisites, weights, and revision order.
- Adaptive practice engine (mastery tracking + spaced repetition).
- Export pack: PDF + Anki + share link.

### Stretch
- Deep Research blueprint report (syllabus + past papers) via `deep-research-pro-preview-12-2025` (Interactions API, background mode).
- Live oral-viva mode via streaming responses (Interactions API or streamGenerateContent). Optional TTS via Gemini 2.5 TTS models.
- Live API can run client-to-Gemini using ephemeral tokens (no WebSocket proxy needed).
- "Assist mode" computer-use for resource collection (not supported on Gemini 3; only if we switch to a 2.5 model).

## System Architecture (Modules)
- VeriMap: syllabus mapping + topic graph + weights.
- VeriNotes: evidence-backed notes + keyframes + citations.
- VeriBank: question generation with strict JSON schemas.
- VeriVerify: quality gates (evidence, ambiguity, distractors, coverage).
- VeriCoach: adaptive practice + mastery model.
- VeriExam: timed mock exam + grading + analytics.
- VeriExports: PDF/Anki/share outputs.
- VeriVault: user docs ingestion + retrieval for grounding.

## Data Contracts (JSON)
- Blueprint: topics, prerequisites, weights, exam styles, revision order.
- Note: concept, summary, timestamps, screenshots, citations.
- Question: type, difficulty, bloom, time, tags, stem, options, answer, rationale, citations.
- Exam: sections, timing, marks, question IDs.
- Mastery: concept_id, score, streak, last_seen.

Strict JSON schemas for anything the UI consumes.

## Workflow (Pipeline)
1) Ingest playlist and metadata (week structure, video IDs).
2) Optional Gemini video understanding (Files API or inline video) -> chapters, concepts, keyframes; otherwise use transcripts.
3) VeriMap builds blueprint (optionally from Deep Research report).
4) VeriNotes generates notes with timestamp evidence.
5) VeriBank generates questions as structured JSON.
6) VeriVerify validates and regenerates low-quality questions.
7) VeriCoach updates mastery and schedules practice.
8) VeriExam builds and grades mock exams.
9) VeriExports produces PDF/Anki/share artifacts.

## Gemini Features Used (Judging Visibility)
- Video understanding for chapters, concepts, and timestamps (via Files API or inline video).
- Structured outputs (JSON schema) for questions and blueprints (generateContent uses `responseMimeType` + `responseJsonSchema`; Interactions uses `response_format` + `response_mime_type`).
- File Search tool (`file_search`) for grounding against slides, syllabus, PDFs.
- Code Execution tool (`code_execution`) to verify numericals and rubric checks.
- Interactions API for long-running, resumable jobs with progress (`previous_interaction_id`).
- Streaming responses for oral-viva mode (Interactions streaming or streamGenerateContent).
- Deep Research agent for syllabus and past-paper blueprint (stretch).
- Computer-use for resource collection (stretch, opt-in; not supported on Gemini 3).

## Evidence and Trust (Non-Negotiables)
- Every note and answer includes timestamps.
- Optional screenshot evidence for slides/diagrams.
- "Show me where this is taught" deep links.
- Citation enforcement: ungrounded claims flagged for review.

## Quality Gates
- Evidence check: answer supported by timestamps or documents.
- Ambiguity check: multiple interpretations rejected.
- Distractor check: MCQ options are plausible but wrong.
- Coverage check: matches blueprint topic weights.
- Regenerate loop for failures.

## Demo Story (3-Minute)
1) Paste playlist + exam date -> show progress + ETA.
2) Open Exam Pack: blueprint + notes with citations.
3) Start Mock Exam: answer 2 questions (1 right, 1 wrong).
4) Show grading + "show evidence" timestamps.
5) Export PDF / share link.

## Milestones (Hackathon-Optimized)

### M1 - Core Pipeline (Day 1-2)
- Blueprint generator (basic, playlist-only).
- Evidence-backed notes with timestamps.
- Question generation with JSON schema.

### M2 - Verification + Exam Flow (Day 2-3)
- Verification gates + regen loop.
- Mock exam generator + grading + analytics.
- Basic adaptive practice (mastery tracking).

### M3 - Polish + Exports (Day 3-4)
- PDF + Anki + share link.
- UI/UX for evidence links and remediation.
- Demo script + dataset.

### M4 - Stretch Features (Day 4+)
- Deep Research blueprint report.
- Live oral-viva mode via streaming (text) and optional TTS.
- Assist mode (computer-use; only on non-Gemini 3 models).

## Risks and Mitigations
- Hallucinated answers -> evidence gating + regen loop.
- Latency on long playlists -> resumable jobs + progress UI.
- Unclear exam alignment -> Deep Research report + manual overrides.
- Demo instability -> cache a known playlist and prebuild assets.
- Tooling limitations (Gemini 3: no computer use or Maps grounding, no remote MCP, built-in tools cannot mix with function calling) -> separate passes or backend tools.

## Testing and Validation
- Golden playlist with expected blueprint and sample questions.
- Regression checks on JSON schema validity.
- Verify timestamp links open correctly.
- PDF export check (notes, questions, answer key).

## Deliverables
- Working web demo.
- Exam Pack PDF + Anki export.
- Devpost writeup + 3-minute demo video.
- Architecture diagram and module map.

## Implementation Notes (Current Next.js Stack)
This repo runs as a single Next.js app (UI + API routes + pipeline) instead of the older Python backend draft.

### Directory layout
- app/: Next.js routes (API + UI pages)
- lib/: pipeline modules (verimap, verinotes, veribank, veriverify, veriexam, veriexports, coach, videoUnderstanding)
- components/: UI
- docs/: architecture + demo + testing

### Module mapping
- lib/verimap.ts: playlist -> blueprint (optionally uses deep research report)
- lib/videoUnderstanding.ts: Gemini video understanding fallback (file_data with YouTube URLs)
- lib/verinotes.ts: notes + citations
- lib/veribank.ts: question bank
- lib/veriverify.ts: evidence gates + regen
- lib/veriexam.ts: mock exam + grading
- lib/mastery.ts + lib/practice.ts: mastery + spaced practice
- lib/fileSearchStore.ts + app/api/vault: File Search grounding
- lib/research.ts: Serper search + Deep Research agent (Interactions background)
- lib/veriexports.ts: PDF/HTML/Anki exports
- lib/coach.ts + app/api/coach*: streaming coach/viva/assist

### API surface (current)
- POST /api/generate-pack, GET /api/status/:jobId
- GET /api/status/stream/:jobId (SSE)
- GET /api/study-pack/:packId, GET /api/packs
- POST /api/submit-answer, POST /api/remediation, GET /api/practice
- GET /api/export/pdf|html|anki
- POST /api/coach, /api/coach/session, /api/coach/session/:id
- POST /api/tts
- POST /api/live-token
- POST /api/vault
