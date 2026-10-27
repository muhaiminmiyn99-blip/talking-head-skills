# Older styles (still supported, not default)

Kept for reference after the user locked the HyperFrames R3/R4 look on 2026-10-23. Use one only if the user asks for it.

## N1 neon captions + editorial collage B-roll (CTA 2 v8–v9, 2026-10-22)
- **Captions: N1 "CapCut neon"** (cards with `neon`, see [timeline-schema.md](references/timeline-schema.md)).
  - A small white Inter lead, then a big glowing main word, with an optional script or sub word tucked under its right side.
  - Each word blurs in on its spoken time and blurs out on exit, over a soft dark bed.
  - Presets: `clean` (orange + white script), `select` (blue text-selection box), `oldmoney` (cream serif + green script), `water` (cyan), `green`, `orange` (warp in), `smooth` (blue italic, letter by letter), `blue` (white + blue sans), `error` (RGB glitch + red strike, for negative lines).
  - Pick a preset by the line's meaning and vary it across the video.
  - The older A1 grammar (`rows`) still works when asked for ([aroll-subtitles.md](references/aroll-subtitles.md)).
  - **1–2 lines per card, never 3–4.** Every piece of text stays inside the **TikTok + IG safe area: x 120–900, y 270–1260**.
- **B-roll: editorial "collage"** (scene `collage`; reference: editorial paper/ink explainer, 2026-10-22).
  - Cream paper with a faint grid alternates with pure-black "ink" scenes.
  - Headline: bold black (white on ink) lead plus a big red accent word, revealed word by word.
  - Elements (approved 2026-10-22; editorial layout plus **dark-luxury glass inside it**):
    - Cards, chart panels and app tiles are **dark frosted glass**: backdrop blur over the swoosh, a gradient gold border, a top sheen and an amber outer glow.
    - Checklists have glowing amber check orbs and an amber rail that fills as each step is spoken.
    - The chart sits in a glass panel with amber candles.
    - The app tile has a rotating gold rim and a pulsing glow; the circle highlight is an amber glow ring. The red pin stays.
    - **The swoosh is alive**: it draws on, then breathes (control points drift on slow sines) while a soft white/amber light runs along it.
    - Photo cut-out objects and 3D emoji come from library `objects/`.
  - **Transitions (matched frame by frame to the reference; keep them fast and crisp):**
    - In: `iris` shows a solid dot for 2 frames, then an accelerating, soft-edged circle covers the frame in about 6 frames while the scene settles from 1.1x. Put the dot on the face or on the previous scene's red accent word, and chain paper→ink parts with it. Or use `pop`: a hard cut with a 4-frame scale settle.
    - Out: `flicker` (dim → black → normal → dim, then a hard cut back to the face).
    - Elements pop in over 6–7 frames, headline words over 4 frames, and the swoosh slides in.
    - Nothing should be blank after the cut: the headline and the main element show at once, and only the accent word and objects wait for their cue.
    - Start parts on a voice onset, and end them about 2 frames before the next caption card starts.
    - `spin` and `dip` still exist but read as messy; avoid them.
  - The Iman scenes (`candles`, `channel`, `steps`, `app-icon`…) are still available.
  - **Show literally what is said. Make trading talk look like trading (candles, zone, confirmation, waiting). No statues or abstract props.** Never fake numbers or data.
- **Popups while talking:**
  - 3D glass/amber icons (about 500 px visible) rise from **behind the speaker** with a smooth spring.
  - Text popups (tracked title plus glass pills) replace the A1 card for that line.
- **SFX: `sfx.mode:'clean'`** (the user found the full layer messy, 2026-10-22). Use real recorded sounds only (Mixkit plus the user's Envato pop), never synthesized. `mix-sfx.js` builds the clean set from the timeline, about 25 events for 45 s:
  - one sound in per B-roll part (a whoosh peaking when the iris covers the frame, or a swipe on a pop cut) and one out (a soft swipe on the flicker);
  - at most two accents inside a part (headline accent `select`, main object `iconpop`), each at least 0.4 s clear of the transitions;
  - one pop per popup and a bass hit on punch-ins;
  - a glass hit on the hook, and boom + glass on the end card.
  - Accents snap to the nearest **voice onset** (the beat of a talking-head edit; detected from the source audio). Nothing sits closer than 0.22 s to another sound, and transitions win.
  - The old full layer (riser/boom/tail plus every UI click) stays available with `mode` unset.
  - No music during the animated moments.
- **Pacing:**
  - About one full-screen B-roll part per 6–8 s of speech.
  - 2–3 icon popups and 0–1 text popup per 30 s.
  - 2–3 punch-in zooms (1.08–1.15).
  - Keep the face for the hook's first line, trust or personal lines, dates, invitations and the final CTA.
- **Output:** 1080x1920 at 30 fps, voice at about -14.5 LUFS, SFX at about 12 LU under the voice, true peak ≤ -0.8 dBFS (limiter).

## R1+R4 HyperFrames mix (CTA 2 v10)
Generator: [../examples/hyperframes-forex/build-hf.cjs](../examples/hyperframes-forex/build-hf.cjs). White R1 UI scenes (channel card, phone + toggle, sticky note) with R4 dark stills; transitions: morph into a shape, green wash, white bloom, light leak + capsule, phone match-cut. REC corner frame (`overlay:'rec'`) was removed at the user's request.

## A1 captions + Iman Dark Luxury UI (TEST 00 v7)
Example [../examples/test00-timeline.json](../examples/test00-timeline.json); see [aroll-subtitles.md](aroll-subtitles.md) and [broll-iman-style.md](broll-iman-style.md).
