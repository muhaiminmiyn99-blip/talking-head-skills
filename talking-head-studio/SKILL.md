---
name: talking-head-studio
description: One-step editor for the user's vertical talking-head videos. When the user attaches or names a talking video (mp4/mov) and asks to edit it ("edit video ni", "edit talking", "buat macam biasa"), or invokes /talking-head-studio, produce the finished edit in the user's locked style. That means A1 kinetic captions (1–2 lines, TikTok/IG safe area), Iman Gadzhi Dark Luxury UI motion graphics that show what the speaker says, 3D icons rising from behind the speaker, and cinematic Iman-style SFX. Bundled scripts cover transcription, render, mix, QC and export. Also use it to change or extend this editing style.
---

# Talking Head Studio: attach a video, get the finished edit

The user attaches a talking-head video. Take it through to a finished, QC'd export **without asking for things already decided below**. Speak conversational Bahasa Melayu. A request in the current message overrides a default.

## Locked style (user-approved on TEST 00 v7, 2026-10-22)
- **Captions: A1 grammar** ([aroll-subtitles.md](references/aroll-subtitles.md)).
  - White lead (light italic or upright) plus a yellow glowing Montserrat keyword.
  - Hook in a glow box with side rules; dashed connector to a pill; underline; per-word jitter; wipe in and out.
  - **1–2 lines per card, never 3–4.** Every piece of text stays inside the **TikTok + IG safe area: x 120–900, y 270–1260**.
- **B-roll: Iman Gadzhi Dark Luxury UI** ([broll-iman-style.md](references/broll-iman-style.md)).
  - Near-black scenes with an amber underglow, glass pills with ✦, a gradient app icon, a line chart, a slot grid, a big statement word, tracked caps, and a narration line that switches Light→Bold.
  - **Show literally what is said. No statues or abstract props.** Never fake numbers or data.
- **Popups while talking:**
  - 3D glass/amber icons (about 500 px visible) rise from **behind the speaker** with a smooth spring.
  - Text popups (tracked title plus glass pills) replace the A1 card for that line.
- **SFX:** real recorded sounds only (Mixkit plus the user's Envato pop), never synthesized. A UI layer (select, click, slide, shimmer, magic, mouse, icon pop) plus a cinematic layer:
  - a riser → boom on each B-roll cut, with a reverb tail back;
  - a bass hit on punch-ins;
  - a glass hit on the hook, and boom + glass on the end card.
  - No music during the animated moments.
- **Pacing:**
  - About one full-screen B-roll part per 6–8 s of speech.
  - 2–3 icon popups and 0–1 text popup per 30 s.
  - 2–3 punch-in zooms (1.08–1.15).
  - Keep the face for the hook's first line, trust or personal lines, dates, invitations and the final CTA.
- **Output:** 1080x1920 at 30 fps, voice at about -14.5 LUFS, SFX at about 12 LU under the voice, true peak ≤ -0.8 dBFS (limiter).

## Fast path

Paths are relative to this skill folder (`~/.claude/skills/talking-head-studio`). Run Node and FFmpeg commands from a short working path. Re-check the Windows notes in [editing-and-qc.md](references/editing-and-qc.md) if a tool misbehaves.

1. **Init:** `node scripts/init-project.js "<video>" [--lang ms]`.
   - It creates `<video name>_edit/` next to the video: engine, fonts, node_modules, the SFX and icon library, `timeline.json` draft, `_review/overview.png` and `_review/whisper.json`.
   - It drops known whisper hallucinations ("Terima kasih kerana menonton" and similar).
   - Read the printed transcript and view the overview sheet.
2. **Fix the transcript.**
   - Correct obvious ASR errors from context (spelling, dates such as "Otober"→"Oktober", names). The speaker's words are the truth; don't rewrite claims.
   - If a phrase is unintelligible **and** matters, ask the user once, with all doubts in one AskUserQuestion.
   - Keep working on everything else meanwhile.
3. **Design `timeline.json`** using [timeline-schema.md](references/timeline-schema.md). Copy patterns (not text) from [examples/test00-timeline.json](examples/test00-timeline.json). Decide:
   - **cards:** one per spoken segment, at most 2 rows, with keywords that carry meaning (benefit, contrast, number, CTA). Use the box with rules on the hook, and pill/connector/underline/icon flags where they fit.
   - **broll:** pick the scene type that literally matches the line (`pills`, `chart`, `app-icon`, `slots`, `statement`) and its cues. Hide the A1 cards that those parts cover.
   - **popups:** icons on concrete nouns (people, date or calendar, link or CTA, and so on).
     - Reuse library icons (`assets/icons/`: people, calendar, link-cursor) when they fit.
     - Otherwise generate one with Higgsfield (`gpt_image_2_5`, 1:1, glossy frosted white glass with warm amber edges, isolated on pure white, no text), then `remove_background` (image), then `node trim-icons.js <png>`. Copy the trimmed icon into the library `icons/` for next time.
   - **zoom** on 2–3 emphatic cards, plus `endcard` if the video ends on a logo card.
   - Set `accent` from the footage (warm amber `#FF9A3C` for warm interiors).
4. **Masks for behind-icons.**
   - Run `node <skill>/scripts/cut-mask-clips.js` in the project.
   - Upload each printed clip to Higgsfield (`media_upload` → PUT → `media_confirm`), run `remove_background` (video), and save the result as the printed `<id>_rb.mp4`.
   - If Higgsfield isn't connected, set those popups to `behind:false` and say so.
5. **Render + QC:** `node <skill>/scripts/render-all.js` in the project.
   - Read the printed report. All checks must be true.
   - **Look at** `qc/safe-area.png` (no text in red zones, nothing clipped) and `qc/sheet-2fps.png` (graphics match the speech, icons visible and emerging from behind the shoulder, captions 1–2 lines).
   - Fix the timeline and re-run until it is clean. Use `--keep` to debug frames.
6. **Deliver.**
   - The script exports `<video name> - EDIT.mp4` + `.srt` next to the source and never overwrites.
   - Report the checks that ran, any Higgsfield credits used (about 0.25 per new icon plus small remove_background costs; usually 5–10 per video), and what wasn't verified. Nobody has listened to the audio; word timing is estimated from segments.

## Credits and permissions
- Use Higgsfield only for new 3D icons and person masks. Every other graphic is deterministic HTML, so don't generate B-roll video unless the user asks.
- Spending up to about 10 credits per video is within the locked workflow. Ask before going beyond that.
- Don't download new SFX without asking. The library at `C:\Users\muhai\Documents\talking-head-studio-library\sfx` (Mixkit plus Envato; licences in `SOURCES.md`) is already approved. Mixkit files may not be redistributed, so keep them out of this skill folder.
- Never publish or post the video.

## When the request differs
- **"Subtitle sahaja"**: leave `broll` and `popups` empty and keep `cinematic:false` unless asked.
- **B1 black-gold look**: set `broll_layer:'broll-layer.js'` ([broll-higgsfield.md](references/broll-higgsfield.md)).
- **A2/A3/A4/A5 caption variants or editorial inserts**: [aroll-subtitles.md](references/aroll-subtitles.md), [editorial-inserts.md](references/editorial-inserts.md).
- **Non-9:16 source**: the engine fills 1080x1920. Decide the crop or reframe with the user before rendering.
- **New style decisions**: update the matching reference file and the "Locked style" section above, so the next video inherits them.

## Engine map (`engine/`, copied into each project)
| File | Role |
| --- | --- |
| `captions.html` | A1 cards, `fitRows`, white flash. |
| `broll-iman.js` | Iman scenes, popups, SFX events. |
| `broll-layer.js` | B1 alternative. |
| `render-captions.js` | Transparent PNG frames via puppeteer-core and Chrome; front or behind layer. |
| `mix-sfx.js` | UI + cinematic SFX bus. |
| `composite.js` | Three-pass FFmpeg: pieces → concat → overlay, person matte, audio mix and limiter. |
| `trim-icons.js` | Trims transparent padding off icon PNGs. |

Research and reference evidence: [reference-index.md](references/reference-index.md), [broll-iman-style.md](references/broll-iman-style.md) (TikTok research on Iman Gadzhi), [editing-and-qc.md](references/editing-and-qc.md).
