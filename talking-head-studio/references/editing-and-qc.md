# Edit, render and verify

## Input and timeline

Read actual dimensions, duration, frame rate, orientation and audio streams. Inspect variable frame rate if synchronization is unstable. Choose an output frame rate suited to the source/timeline; the B-roll reference's 25 fps does not require a 25 fps final. Use portrait output when appropriate to the request and source, without stretching landscape footage.

Transcribe and align the real speaker. Verify names, figures, Malay/English code-switching and low-confidence phrases. Never silently replace an unclear material fact with a guess. Ask only for ambiguity that materially affects the edit, while continuing independent work.

Trim obvious mistakes/dead space when the request permits editing. Preserve intent, negation, voice identity and natural phrasing. Keep face/gesture-led moments as A-roll; use B-roll for concrete explanatory value. Do not impose a fabricated hook or promise of more views.

Maintain a machine-readable timeline with source in/out, output in/out, caption/word events, shot type, visual purpose, asset IDs and transition data. Keep source-time and edited-time mappings distinct so cuts do not break subtitle sync.

## Windows environment notes (observed 2026-10-21)

- FFmpeg/ffprobe 9.0.2 was installed via winget and on PATH; verify with `ffmpeg -version` rather than assuming.
- Native Windows executables fail from Git Bash when the current directory path is very long ("path longer than allowed for a Win32 working directory"). Run FFmpeg from a short working directory (for example a short folder under `%LOCALAPPDATA%\Temp`) and pass absolute paths.
- Source filenames contain curly quotes and apostrophes; copy them to short ASCII names (A1.mp4 …) in a work folder before processing, keeping originals untouched.
- FFmpeg `drawtext` may print Fontconfig warnings; pass `fontfile=C\\:/Windows/Fonts/arial.ttf` (or the chosen font) explicitly for burned-in labels.
- `python` may resolve to the Microsoft Store stub; prefer Node.js (installed) or verify Python before relying on it.
- Transcription: the FFmpeg 9 build includes the `whisper` filter, and `~/.cache/whisper/ggml-large-v3-turbo.bin` exists. From Git Bash, set `MSYS2_ARG_CONV_EXCL='*'` and pass the model as `/Users/muhai/.cache/whisper/ggml-large-v3-turbo.bin` (no drive letter, so the colon doesn't break filter parsing). It produces segment timing only: estimate word times by character share and verify. Whisper hallucinates "Terima kasih kerana menonton!" over music or end cards, so drop it.
- Proven renderer (TEST 00 project):
  - Caption and B-roll typography: an HTML page driven by `renderAt(t)`, captured as transparent PNGs with puppeteer-core and the installed Chrome (`--allow-file-access-from-files`, load from a `file://` page, and force `document.fonts` to load before the first frame).
  - Composite with FFmpeg.
- Composite pitfalls:
  - Use **three simple passes**:
    1. Render each A-roll piece (seeked source plus punch-in zoompan) and each video B-roll part to its own clip with an exact `-frames:v` count.
    2. Join them with the concat demuxer (`-c copy`).
    3. Overlay the caption PNG layer and map the source audio.
  - A single big filter graph stalled or silently truncated the video on this FFmpeg 9 build. That happened with one `split` into many trims, with many late-start overlays, and even with a multi-input concat filter that froze at 16 s.
  - Do not use `-shortest`; use `-t <duration>`.
  - Always ffprobe the output duration and frame count, and compare a few A-roll frames with the previous version to check sync.
- B-roll look is pluggable: set `timeline.json` `broll_layer` to `broll-iman.js` (Iman Dark Luxury UI) or `broll-layer.js` (B1). `render-captions.js` injects it with `page.addScriptTag`.

## Project persistence

Store the calibrated profile and implementation alongside the editing project. Recommended records:

- `STYLE_GUIDE.md`: visual choices, evidence, approved overrides and unresolved approximations.
- `style-tokens.json`: actual fonts, palette, preset geometry, animation and output settings.
- `timeline.json`: source/edit timing and caption/shot events.
- `asset-manifest.json`: generation records, provenance and reusable asset paths.
- Editable caption and B-roll components, with locked tool dependencies where appropriate.

The filenames are conventions, not a reason to replace an existing compatible project structure. Preserve user edits and source files. Do not modify global configuration merely to run the project.

## Quality gates

Render a short representative segment before a full export. Inspect the rendered media rather than only source code. Correct the most consequential mismatch first: wrong composition/font, timing, then secondary polish. Routine internal review does not require repeated user approval.

Review the final export for:

1. Accurate transcript and audio sync after all cuts; no lost words, clipping or accidental reference audio.
2. Loaded fonts, readable text, correct line breaks, stable anchors and no overflow.
3. Face/hand/product clearance across moving shots and safe placement for the target platform.
4. Clean masking when typography is behind the subject; no hair/hand edge flicker.
5. Smooth entrances/exits at normal speed; sharp settled text and no accidental blank frames.
6. B-roll relevance, object continuity, consistent materials/light and no unexplained generative artifacts.
7. No copied portfolio frames, watermarks, source-brand CTA or fabricated numbers.
8. Correct output dimensions, duration, frame rate and playable audio/video streams.

If audio playback, visual inspection or some rendering capability is unavailable, say which check remains unperformed. Do not label unchecked material as verified.

## Safe-area check (TikTok + Instagram Reels)

Before delivery, overlay the unsafe zones on sample frames, for example with FFmpeg `drawbox`:
- red fill over y < 270 and y > 1260;
- x < 120;
- x > 900 for y ≥ 840;
- x > 960 for y < 840.

Confirm that every subtitle, pill, title and narration line sits in the clear area. Fix anything that touches the zones.

## Delivery

For a full editing request, deliver the final playable video, editable project and used assets, SRT, timing data and persistent style profile. SRT carries text/time, not font or animation. Include a concise note on actual checks and material limitations, especially unconfirmed font matches or unresolved generation defects.

For setup-only work, deliver the style system and any completed calibration preview. Do not call it a finished edit. For a blocked render, hand over completed work and the specific missing prerequisite rather than claiming success.
