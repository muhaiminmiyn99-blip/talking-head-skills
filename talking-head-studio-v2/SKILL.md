---
name: talking-head-studio-v2
description: Version 2 of the user's talking-head editor (Fira Worldwide / forex), kept separate from the original talking-head-studio skill, which must not be changed. Use it when the user invokes /talking-head-studio-v2 or asks for the v2 / HyperFrames / R3-R4 / "style CTA 2" / "style forex baru" edit of a vertical talking video (mp4/mov). Plain "edit video ni" without those words belongs to the original talking-head-studio skill. The v2 look is R3 lime kinetic captions; R4 dark-cinematic HyperFrames B-roll that shows what the speaker says, with seamless fog, red-sweep and phone transitions; red-glow 3D glass icons rising beside the speaker's head; and a typing/drone/deep-hit SFX layer. It ends in a Final Cut-style local editor. Bundled scripts cover transcription, HyperFrames B-roll, masks, icon placement, render, mix, QC, export and the editor. Also use it to change or extend this editing style.
---

# Talking Head Studio v2: attach a video, get the finished edit

This is a separate skill. The original `talking-head-studio` (A1 captions + Iman UI) stays exactly as the user saved it: never edit that folder. Make every v2 change here. Both share the asset library at `Documents/talking-head-studio-library`; only add files there, never change or remove the originals.

The user attaches a talking-head video. Take it through to a finished, QC'd export **without asking for things already decided below**. Speak conversational Bahasa Melayu. A request in the current message overrides a default.

## Locked style (user-approved on CONTENT 9 - CTA 2, 2026-10-23)
Reference example: [examples/cta2-hyperframes-r3-timeline.json](examples/cta2-hyperframes-r3-timeline.json) with its generator [hf-starter/build-hf.cjs](hf-starter/build-hf.cjs). Older looks are in [references/older-styles.md](references/older-styles.md); use them only on request.

### Captions: R3 lime bold
- Cards look like `{seg, r3:true, lead, key, sub?, strike?, icon?:'send'|'warn', zoom?}`.
  - **lead:** a small white Inter 600 line, upper left.
  - **key:** the big lime `#D7FF3A` Inter 800 word, popping in from 1.35x with a blur.
  - **sub:** small white, tucked lower right.
  - `strike` draws a red line through the key; `icon:'send'` flies an outline paper plane in from the lower right.
- Popup `kind:'ring'` draws a white circle round the face on the hook.
- **No REC frame**: the user removed it.
- 1–2 lines per card, never 3–4. Every piece of text stays inside the **TikTok + IG safe area: x 120–900, y 270–1260**.

### B-roll: R4 dark cinematic, built in HyperFrames (`<project>/hf/`)
- **Look:**
  - dark leather background with a top light and a vignette;
  - a small white lead typed letter by letter;
  - a big red `#FF2B2B` glowing key word whose letters slide in from the right with a blur;
  - huge outline glyphs (`?`, `*`) drifting at the edges.
- **Symbolic props that show the line:**
  - an eye that opens and blinks on "nampak / see", then casts a red beam with a card sliding into it;
  - red orbs circling a faceless masked figure;
  - a 3D phone with the app tile and a toggle;
  - a grey spotlight scene with rotating outline asterisks and a flat red word pushing in from 2.2x;
  - a red-orb step list;
  - an hourglass for "tunggu".
- **Show literally what is said. Trading talk looks like trading.** Never fake numbers or data.
- **Seamless transitions:** each composition contains the A-roll at its edges, so the cut happens inside the graphic.
  - **fog:** a white fog flash at the cut.
  - **red sweep:** a slanted polygon edge with a leading red stripe.
  - **phone match-cut:** the A-roll is homography-mapped into the phone screen and zooms through into real phone footage.
- **Assets:** library `fx/`: leather, figure, phone, desk, candles. Brand marks come from `brand/`. New stills come from Higgsfield `gpt_image_2_5` at medium quality (0.5 credits each).
- **HyperFrames rules:**
  - Styles and tweens on a `<video>` are ignored, so animate a wrapper div.
  - Give each video `data-start`, `data-duration` and `data-media-start`.
  - Encode clips with `-g 30`.
  - Use `.cjs` scripts, because the project is ESM.

### 3D icons rising beside the head
- Use the smoked-glass icons with chrome edges and a red neon rim from library `icons/r4-*.png` (people, link, calendar, chat). Popup fields: `{kind:'icon', behind:true, rise:760, glow:'rgba(255,30,30,.75)'}`.
- Put one on each concrete noun on the talking A-roll: together, ask, click link, event.
- **Never directly behind the head.** `place-icons.js --apply` chooses the box: about 88 % visible, about 12 % tucked behind the head or shoulder, 320–520 px, clear of the UI zones, the caption band and the frame edges.

### SFX (`sfx: {mode:'clean', drone:true, r3keys:true}`)
- Use real recorded sounds only (Mixkit plus the user's Envato pop). The library `sfx/` and `SOURCES.md` are approved.
- **Cues are read from the HyperFrames scripts:**
  - a keystroke on every second typed letter;
  - `deep` on red words;
  - `whoosh` plus `sub` on fog cuts, and `whoosh` mid-sweep;
  - a drone bed under each B-roll part.
- A `click` sounds on each lime key pop.
- `tl.duck` adds silence drops before 2–3 punch lines, inside a pause only, with a `deep` hit on the line.
- The SFX bus sits about 12–13 LU under the voice.

### Pacing and output
- About one B-roll part per 6–8 s of speech, 3–4 icons per 45 s, 2–3 punch-ins (1.08–1.15).
- Keep the face for the hook's first line, trust lines, invitations and the final CTA.
- Output is 1080x1920 at 30 fps, voice at about -14.5 LUFS, true peak ≤ -0.8 dBFS.

## Fast path
Run commands from the project folder (`<video>_edit/`) unless noted. `<skill>` = `~/.claude/skills/talking-head-studio-v2`. Windows notes are in [editing-and-qc.md](references/editing-and-qc.md).

1. **Init:** `node <skill>/scripts/init-project.js "<video>" --lang ms`.
   - It creates `<video>_edit/` with the engine, fonts, SFX, icons, fx stills, brand marks and `hf/` (the HyperFrames starter).
   - It writes a draft `timeline.json` (R3 cards, clean SFX), `_review/overview.png` and the transcript.
2. **Fix the transcript.**
   - Correct obvious ASR errors from context. Trading words: chart, zone, setup, entry, confirmation, trade, Smart Desk.
   - Ask once (AskUserQuestion) only about unclear phrases that matter.
3. **Captions:** choose real key words per card (benefit, contrast, CTA), add `strike` and `icon` where they fit, and set punch-ins.
4. **B-roll (HyperFrames):**
   - Edit `hf/build-hf.cjs`: keep the HEAD, LIB and helpers, and rewrite the `C.push` scene blocks for the new lines (segment ids, cue words, props).
   - `node hf/build-hf.cjs`.
   - Render each composition: `cd hf && npx hyperframes render . -c compositions/<id>.html -o renders/<id>.mp4`. Snapshot and check the frames.
   - Edit the T, R, popups and duck tables in `hf/apply-timeline.cjs`, then run `node hf/apply-timeline.cjs`. It fills `broll` (raw video parts with SFX cues), the R3 cards, the icons and the ducks.
   - Get new stills or icons from Higgsfield if the props need them.
5. **Masks and icons:**
   - `node <skill>/scripts/cut-mask-clips.js`.
   - Run Higgsfield `video_background_remover` on each new clip and save it as `<id>_rb.mp4`. Unchanged windows reuse their old mask; each new one costs about 1 credit.
   - `node <skill>/scripts/place-icons.js --apply`, then check `qc/icon-placement.png`.
6. **Render + QC:** `node <skill>/scripts/render-all.js`.
   - All checks must be true.
   - Look at `qc/safe-area.png` and `qc/sheet-2fps.png`, plus single frames at every transition and icon.
7. **Deliver:**
   - The export is `<video> - EDIT.mp4` + `.srt` next to the source; it never overwrites. Move older versions to `out/old/`.
   - Start the **editor**: `node <skill>/scripts/editor-server.js "<project>" 4747`, or the `.claude/launch.json` config `editor`. Give the link **http://localhost:4747/**.
     - It is a Final Cut-style timeline with a live caption preview, inline caption edits, Save and Render.
     - `- REVIEW.html` is the read-only fallback.
   - Report the checks that ran, the credits used, and what wasn't verified (nobody listened to the audio; word timing is estimated).

## Credits and permissions
- Higgsfield is for stills, icons and person masks only. Usually 5–10 credits per video; ask before going beyond about 10.
- Don't download new SFX without asking. Mixkit files stay in the library, not in this skill folder.
- Never publish or post the video, and never publish the editor or review page as an Artifact (client footage).

## When the request differs
- **"Subtitle sahaja"**: leave `broll` and `popups` empty.
- **Older looks** (N1 neon, editorial collage, A1 + Iman, R1+R4 mix): [references/older-styles.md](references/older-styles.md), [timeline-schema.md](references/timeline-schema.md).
- **Non-9:16 source**: decide the crop with the user before rendering.
- **New style decisions**: update "Locked style" above, `hf-starter/` and the library, so the next video inherits them.

## Engine map (`engine/`, copied into each project)
| File | Role |
| --- | --- |
| `captions.html` | R3 / N1 / A1 cards, `fitRows`, flash, dip. |
| `broll-iman.js` | HTML B-roll scenes (older looks), `raw` HyperFrames parts, popups (icons, ring, pills), SFX events. |
| `render-captions.js` | Transparent PNG frames via puppeteer-core; front or behind layer. |
| `mix-sfx.js` | Clean SFX bus: HyperFrames cues, drone beds, key clicks, duck hits, voice-onset snapping. |
| `composite.js` | FFmpeg passes: pieces → concat → overlay, person matte, silence-drop ducking, mix and limiter. |
| `trim-icons.js` | Trims transparent padding off PNGs. |

| Script (`scripts/`) | Role |
| --- | --- |
| `init-project.js` | Project setup and transcription. |
| `cut-mask-clips.js`, `place-icons.js` | Masks; visible icon placement. |
| `render-all.js` | Render, QC, export, review page. |
| `editor-server.js` + `editor/editor.html` | The local Final Cut-style editor. |
| `make-review.js`, `serve-review.js` | Static review page. |
