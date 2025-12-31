# Testing Checklist

## Pipeline
- Generate a pack from a small playlist.
- Confirm progress updates via polling or SSE.
- Verify notes show citations and visuals.
- Confirm visuals show storyboard tiles when available.
- Enable frame capture (`ENABLE_FRAME_CAPTURE=1`) and verify screenshots render.
- Ensure question bank includes citations and verification notes when needed.
- Enable Interactions API and confirm generation still completes.
- Enable Deep Research and confirm the blueprint shifts (topics/weights) when research is on.

## Exam + Remediation
- Submit at least one correct and one incorrect answer.
- Verify grading feedback and citations.
- Generate a remediation plan and confirm topic grouping.
- Check Analytics for topic accuracy updates after answers.

## Exports
- PDF: renders blueprint, notes, questions.
- HTML: opens in new tab with formatting.
- Anki CSV/TSV: downloads and imports into Anki.

## Adaptive Practice
- Generate a practice set and verify due topics appear.
- Submit practice answers and confirm mastery updates.

## Vault + Research
- Upload a PDF/TXT and confirm it appears as indexed.
- Enable research sources and verify report renders.
- Enable Deep Research with Serper and confirm sources appear.
- Enable File Search and verify responses cite vault content.

## Live Sessions
- Enable WebSocket mode locally and confirm streaming replies.
- Enable Gemini Live API toggle and confirm responses stream from live session.
- Try Viva mode and verify the coach asks one question at a time with feedback.
- Try Assist mode with a research key and confirm search-based context appears.
