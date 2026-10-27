# B-roll: Iman Gadzhi-style motion graphics (default since 2026-10-21)

On 2026-10-21 the user chose **Iman Gadzhi-style B-roll**, sub-style **Dark Luxury UI** (glass pills, glow, statues), as the default for every talking video. It replaces the B1 black-gold illustration concept as the default. B1 ([broll-higgsfield.md](broll-higgsfield.md)) stays available on request. The placement rules ("Default B-roll plan") and the Higgsfield workflow in that file still apply.

## Research summary (2026-10-21)

Sources:
- TikTok editor breakdowns: snipp.co, prime.animator (11.7K likes), maxmill_ae, camzora__.
- Frames from Iman's own YouTube channel ("If I Was Broke In My 20s").
- Web articles: SozAI breakdown, Submagic, SendShort.

Iman's own TikTok (@realimangadzhi) is vlog-style with plain white captions. The viral "Iman style" comes from his YouTube motion graphics and the editors who copy it. Most web sources are third-party, so treat specifics as observed patterns, not confirmed specs.

Evidence sheets (third-party frames, analysis only; never use them as assets):
- [Dark UI glass](visuals/iman-dark-ui-glass.jpg): prime.animator.
- [Dark statue](visuals/iman-dark-statue.jpg): camzora.
- [Paper collage](visuals/iman-paper-collage.jpg): maxmill.
- [Minimal luxury](visuals/iman-minimal-luxury.jpg): snipp.co.

### Three sub-styles
1. **Dark Luxury UI (default).**
   - Near-black scenes.
   - Frosted glass pills with a thin white border and a ✦ sparkle icon ("✦ Solutions"), with a warm orange or cool blue underglow at the frame bottom.
   - A rounded-square "app icon" with a gradient glow border (magenta→orange→blue) and short stacked words beside it that blur in ("Faster / Better / Cheaper").
   - Bulleted lists with small accent dots.
   - Wide-tracked light caps ("A N I M A T I O N") with a ✦ and a small diamond-icon subline.
   - White marble Greek statues (thinker at a laptop) under a cool rim light.
   - A huge white condensed name behind the subject; glowing 3D app icons.
2. **Paper Collage (classic).**
   - Cream paper texture with one accent colour in big shapes.
   - Black-and-white halftone cutouts with black eye bars; condensed bold caps headlines plus a tiny subline.
   - Ransom-note letters, "?" marks, money and hand cutouts, arrows.
   - Low-fps stop-motion jitter with a glow.
3. **Minimal Luxury.**
   - Off-white paper with window or leaf shadows; a big grey number that blurs in.
   - A cutout over a red circle; sepia photo cards.
   - Bold sans overlapped with a script or serif italic.

### Shared rules
- **Colour:** take the accent from the footage. Ratio: 60% dark variant, 30% light variant, 10% vibrant accent.
- **Text motion:** each word pops, fades and blurs in, one after another. UI elements ease fast-out/slow-in, and certain elements always lead. Camera moves are slow (push-in, a slight tilt), so fast reveals contrast with slow emphasis.
- **Density:** the intro carries 2–5× more graphics (4–10 per minute). The body has about 2 per minute, triggered by new information, numbers, proof, or a long dry stretch. Reuse the same chapter animation every time.
- **Sound:** animated scenes use SFX only, no music.
- **YouTube captions (single source, unconfirmed):** white only, Montserrat, words switch from Light to Bold as they are spoken, no colour highlight.

## Dark Luxury UI implementation (validated on TEST 00 v4)

**Palette**
- Background: #050505–#0B0B0C.
- Glass: rgba(255,255,255,.06–.10) fill, a 1.5–2 px rgba(255,255,255,.35) border, and an inner highlight.
- Text: white #F5F5F5 and grey #9A9A9A.
- Accent: from the footage (warm amber #FF9A3C for a warm interior). The icon-border gradient is magenta→orange→blue.

**Type**
- Scene words: Inter Regular/Medium, 56–72 px.
- Tracked caps: Montserrat Light, letter-spacing 0.45em.
- Narration line during B-roll: Montserrat, Light → Bold as each word is spoken, white, lower area (y≈0.74).

**Elements, all deterministic HTML/CSS**
- Glass pill with ✦ and text.
- Glowing app icon with a short label.
- Blur-in stacked word list.
- Bottom underglow (radial gradient).
- Tracked caps title.
- Small ✦ sparkles that twinkle.

**No statues (user rule, 2026-10-22).** The user rejected the marble-statue scenes. Every graphic must show **what the speaker is literally saying**. Examples validated on TEST 00 v5:
- "buy ataupun sell": glass pills Buy and Sell with an amber strike.
- "kenapa entry dekat setup": a glass card with a line that draws on, a dashed setup zone and a pulsing entry ring.
- "pakai AI": a gradient AI app icon plus a blur-in list.
- "slot very limited": a slot grid filling up with two amber slots left.

Build these deterministically in HTML/CSS. Use Higgsfield only for objects that HTML can't draw well, such as 3D icons.

**Popups while the speaker talks (default, not only full-screen B-roll)**
- **3D icon from behind the speaker:**
  - Generate a glossy white-glass icon with amber edges using `gpt_image_2_5` (1:1, "isolated on plain pure white background, no text"), then run `remove_background` (image) to get a transparent PNG.
  - Motion: the icon rises from behind the shoulder with an overshoot (about 12 frames), then floats ±8 px with a slight tilt, and blurs out over 5 frames. Place it beside the head so its lower part starts hidden behind the shoulder.
  - Use 2–3 per 30 s, each on a concrete noun: people, calendar or date, link or CTA, money, tool.
- **Text popup:** a tracked-caps title plus 1–2 glass pills near the lap or lower-chest area. Hide the A1 caption card for that line so the text never appears twice.
- **Person matte for "behind":**
  - Upload short clips of only the popup windows (frame-aligned) to Higgsfield `remove_background` (video). It returns the subject on pure black in an MP4 with no alpha.
  - Threshold luma > 21 into a matte. Limited-range black is 16, so a lower threshold makes the mask all white.
  - Apply the same punch-in zoom as the A-roll.
  - Composite order: footage → behind layer → footage × matte (person) → front layer.

**SFX (Iman: SFX only, no music in animated moments)**
- **Never synthesize SFX.** The user rejected FFmpeg-synthesized SFX as sounding cheap (2026-10-22). Higgsfield's SFX model is limited to its game pipeline and must not be used here either.
- Use real recorded SFX:
  - First, the user's own licensed Envato downloads in `C:\Users\muhai\Downloads` (for example `pop-2026-05-07-17-20-52-utc\Pop 1–10.wav`, `reward-…`, `bonus-reward-…`, and a template's `whoosh_2.mp3` and keyboard clicks).
  - Then Mixkit (free licence, commercial and social use allowed, no attribution; no redistribution of raw files, so keep them in the project, never in this skill folder). Ask the user once before downloading.
  - Files in `Fira High Rollers Motion\…\assets\sfx*` were FFmpeg-generated; don't use them.
- Validated set (TEST 00 v6; files and licences in `project/sfx/pro/SOURCES.md`):

  | Role | Source |
  | --- | --- |
  | whoosh: B-roll in | Mixkit 1492, cinematic whoosh fast transition |
  | impact: B-roll cut | Mixkit 1143, cinematic whoosh deep impact |
  | select: glass pill | Mixkit 3124, modern technology select |
  | click: list item or slot | Mixkit 2568, cool interface click tone |
  | slide: card in | Mixkit 3120, technology transition slide |
  | shimmer: icon land, entry ring | Mixkit 3083, magic sparkle touch |
  | magic: AI glow | Mixkit 2638, magic transition sweep |
  | rise and swipe: icon rise, strike | Mixkit 166, fast small sweep |
  | mouse: "klik link" | Mixkit 275, fast double click |
  | iconpop: 3D icon land | Envato Pop 7 |

  Mixkit WAV URL pattern: `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`, falling back to `<id>-preview.mp3`.
- **Cinematic layer (user asked for "more cinematic Iman style", 2026-10-22).** `mix-sfx.js` adds these automatically from the timeline:

  | Moment | Sound | Source |
  | --- | --- | --- |
  | Into each B-roll cut (peak on the cut) | riser | Mixkit 790, cinematic trailer riser |
  | On each B-roll cut | boom | Mixkit 788, big cinematic impact, trimmed from 1.9 s |
  | Back to A-roll | reverb tail | Mixkit 1486, cinematic tunnel reverb woosh |
  | Each punch-in zoom | bass hit | Mixkit 2299, short bass hit |
  | Hook opening | glass hit | Mixkit 677, cinematic glass hit |
  | AI reveal | futuristic bass | Mixkit 2303 |
  | End card | boom + glass | as above |

  Available but unused: Mixkit 2919 (movie trailer whoosh hit). Mixkit 784 "reverse impact" does not build to a hit, so skip it.
- **B-roll text inside the safe area too:**
  - Narration line at y 1130.
  - Titles, pills, icon and list all centred at x 510 within 120–900.
  - Tracked caps stay on one line (`white-space: nowrap`, 42 px, 0.36em).
- **Preparation:** trim leading silence, trim to length with a 0.25 s fade, loudnorm to -18 LUFS, 48 kHz stereo.
- **Mixing** (`mix-sfx.js`):
  - Transient sounds start on the event. Swells (whoosh, rise, swipe, magic, slide, impact) are shifted so their peak lands on the event.
  - Bus gain 0.42 puts the SFX track at about -27 LUFS under a -14.6 LUFS voice.
  - Always put `alimiter` on the final voice + SFX mix (without it, v6 first peaked at +0.3 dBFS). Then check `ebur128` integrated loudness and true peak.

**Subtitles: 1–2 lines only (user rule, 2026-10-22).** Each caption card has at most 2 rows. Rows never wrap (`flex-wrap: nowrap`), and `fitRows()` zooms down any row wider than 980 px after fonts load. Merge a lead and a keyword inline ("Live trade *Face-to-Face*") instead of stacking three rows.

**3D icon size and motion (user feedback, 2026-10-22):**
- Too small at 330 px, and "not smooth" with an overshoot over 12 frames.
- Trim transparent padding first (`trim-icons.js`; generated icons carry about 20% padding). Then use about 470–540 px of visible icon width beside the head.
- Motion: a critically-damped spring rise (no jerk), scale 0.55→1 over 16 frames, de-blur over 8 frames, a slow float (±7 px) and sway (±2°) once settled, then exit with shrink, blur and lift over 9 frames.

**Motion**
- Pills scale from 0.85 and blur in over 8 frames with a fast-out ease.
- Words blur in from 8 px over 6 frames, staggered by speech.
- Camera: a slow 1.0→1.06 push over the whole part.
- Exit: a quick blur and fade over 4 frames.

**Never:**
- Use Iman's face, name, footage or the breakdown creators' assets.
- Fabricate numbers or counters.
- Fill every gap. Keep the "~1 part per 6–8 s" plan.
