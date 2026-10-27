# A-roll subtitle direction

## Reference interpretation

Read [reference-index.md](reference-index.md) to resolve A1-A5. The relevant typography is inside AFTER/My work. Never reproduce the outer before/after cards, view counts, results graphs or portfolio labels.

The references are multiple related treatments, not one identical font/palette. The default is A1/A5 white + yellow/gold; A2 red, A3 orange and A4 blue/white-pill are selectable variants. User instructions override the default. Do not cycle all palettes in one video.

Observed examples:

- A1 around 1.4-2.52 s: white lead-in; thin box enters and settles; phrase accumulates inside; the important phrase becomes yellow. Around 14.5 s: small white lead-in with a larger bold yellow keyword.
- A2 around 6.2-7.04 s: red emphasized word above smaller white supporting lines inside a red outlined treatment.
- A3 around 0-0.84 s: orange phrase enters near the lower edge of the inner landscape video. Around 6.7 s: large orange text behind the isolated subject.
- A4 around 4-5.12 s: white pill labels enter in sequence for list items. Around 16.4 s: white text over a blue emphasis bar.
- A5 around 2.2-3.04 s: outgoing yellow text moves with blur; new supporting text/icon appears; emphasized keyword settles through tracking/position changes.

Inspect [layout examples](visuals/aroll-layouts.jpg) and [motion examples](visuals/aroll-motion.jpg), then examine original frames for finer calibration. Timestamps are sample locations, not authoritative phrase timings for new footage.

### Full-timeline caption inventory (direct review 2026-10-21)

Whole-video panel sheets: [A1](visuals/aroll-timeline-A1.jpg), [A2](visuals/aroll-timeline-A2.jpg), [A5](visuals/aroll-timeline-A5.jpg); A3/A4 in [editorial-inserts.md](editorial-inserts.md). Approximate times:

- **A1 (white lead + yellow keyword):** 1.4-3 s "Are you Ready / for your summer road trip?" in thin outlined glowing box with yellow side rules; 5-6.5 s "Don't let a Breakdown" → dashed connector → "Ruin your Vibe" in box; 8-8.5 s "Before you hit the / **Highway**"; 9.5-11.5 s "make sure your" + stacked list Filters / Fluids / Battery; 13.5-15 s "We have all the / **MAINTENANCE ESSENTIALS**" (condensed caps); 16 s "Right Here" with underline glow; 17-21 s CTA "Call Us Today" + phone icon, "Or Come On In To / 58 Toro Road" + pin icon, "to get / RoadTrip Ready!". Pattern: lead-in in small light/italic white, keyword in bold yellow with soft glow; every caption is one beat, replaced rather than scrolled.
- **A2 (red neon):** 0-1.5 s grey pill labels with icons "Cheap" / "Expensive"; 2.5-4 s huge red "**BUY?**" over white "Which One Would You"; 4-5.5 s "This One? / Not / Necessarily"; 6.2-7.5 s "Expensive / Doesn't / Always Mean Better" inside red neon bracket rails; 8.5-11 s white "Just A Normal City Driving?" then red scrambled "You May Not Need / To Pay Extra"; 11.5-13 s "Drive / Harder / Or / Heavier?" mixed sizes; 13.5-15 s "Going Too Cheap / Can Cost / You Later"; 15.5-18 s "So don't / buy by price", "Buy What / Fits Your Car" with angular neon rails. Pattern: white = question/setup, red = consequence/emphasis.
- **A5 (yellow condensed + glow):** 0-2.5 s "**Cafe Daily**" tall condensed with glow + tiny "is your regular spot" in pill; 2.5-3.3 s people icon + "you need our / **Membership**" (wide tracking collapses to normal); 4-6.5 s "and Every time you order / you get **10% Back** in points / For your **Entire Bill**" in outlined rounded box + money overlay; 7.5-9.5 s "Plus you / Stack up Points so Fast" under an arc line; 10-11.5 s alarm icon + "you're going to get / **Free items** / in no time"; 12-14.5 s "And on your birthday you get a" + outlined pills "Free Black Coffee" / "and a Croffle"; 14.5-16 s "It's totally **Free to join**"; 16.5-18 s "Just **Tap the link in the bio** / ■ and Come hang with us ■".

### Measured placement (inside the edited panel)

Panel crops used: A1/A2/A5 AFTER panel ≈ `x=281 y=211 w=358 h=637` of the 720x1280 export (≈9:16); A3/A4 My work panel ≈ `x=59 y=229 w=602 h=338` (16:9). ±3 px; re-measure if a new export differs.

- Medium/close shots (A1, A2, A5): caption block centre at **y ≈ 0.53-0.70** of panel height (chest to waist), horizontally centred, block width up to ~0.80-0.90 of panel width.
- Wide/establishing shots where the subject is small: block drops to **y ≈ 0.77-0.82**. In a 1080x1920 deliverable this sits inside TikTok/Reels bottom UI, so clamp to the platform safe area (keep the block centre ≤ ~0.72 unless the user accepts the risk).
- A3/A4 landscape: captions lower-left/lower-centre band y ≈ 0.75-0.90 of the 16:9 panel; behind-subject words fill y ≈ 0.15-0.55. Reflow for portrait rather than copying.

### Font candidates (observed, unconfirmed)

| Role | Seen in | Visual description | Candidate families to test |
| --- | --- | --- | --- |
| Lead-in support | A1, A5 | Small light/regular sans, often italic, white | Inter / SF Pro / Poppins Light Italic |
| Keyword bold | A1, A2 | Bold grotesk/geometric, Title Case, slight glow | Montserrat ExtraBold, Poppins Bold, Gilroy Bold |
| Keyword condensed | A1 "MAINTENANCE", A5 "Cafe Daily" | Tall condensed heavy, caps or title | Bebas Neue, Anton, Oswald Bold, Barlow Condensed ExtraBold |
| Red emphasis | A2 | Bold italic sans, red fill with light outer glow | Montserrat Black Italic, Poppins ExtraBold Italic |
| Orange display | A3 | Bold neo-grotesk, tight tracking | Inter Bold/ExtraBold, SF Pro Display Bold |
| Editorial serif | A3 "money", A4 "Cheating", "200 Million" | High-contrast serif italic, sometimes condensed | Playfair Display Italic, Instrument Serif Italic, DM Serif Display Italic |
| White pill / list | A4 | Bold sans, black on white pill | Inter / SF Pro Bold |

Test these with the same words and record the winner in `style-tokens.json`; none is verified. Accent colours (yellow/gold, red, orange, blue) must be sampled from settled, un-glowed glyph centres during calibration rather than guessed.

## Font matching and hierarchy

Keep separate font roles for neutral supporting text, bold/condensed emphasis and optional editorial serif. Match the role to the selected reference; do not force one family or weight throughout.

Compare legible word crops against installed or supplied candidate fonts using the same text. Record font path, family, weight, size, tracking and confidence. Where the low-resolution reference cannot establish the exact family, state the approximation and select the best measured visual fit. Never silently fall back during rendering.

Use smaller white support text and larger emphasized words in the default preset. Highlight meaning: benefit, objection, number, product, contrast or action. Do not color every word merely because it is currently spoken.

**User rule (2026-10-22): all subtitles and on-screen text stay inside the TikTok + Instagram Reels safe area.** On a 1080x1920 frame that is the box x 120–900, y 270–1260.
- It avoids the top 270 px, the bottom 660 px (caption, description and buttons), 120 px on each side, and the right action-button column (x > 900 from y 840 down).
- Caption cards use left 120 / right 180 (centre x 510), a max row width of 780 px (`fitRows`), and a default centre of y 0.555 (≈1066 px).
- Third-party sources disagree on the exact numbers, so this is the conservative union. Verify with a red safe-zone overlay on sample frames before delivery (see editing-and-qc).
- 3D icons may sit right of x 900 only above y 840.

**User rule (2026-10-22): every subtitle card is 1–2 lines, never 3–4.** Rows must not wrap; shrink-to-fit or merge a lead and a keyword inline instead. Start with short semantic phrases, often 2-6 words. This is a layout starting point, not a hard transcription rule. Permit a third line only when justified by the hierarchy. Preserve names, number/unit pairs, negations and complete meaning. Do not silently rewrite the speaker's claim to fit the box.

## Reusable caption presets

| Preset | Appropriate use | Treatment |
| --- | --- | --- |
| phrase | Most ordinary speech | Stable short phrase, optionally one emphasized span. |
| lead-keyword | Main benefit or concept | Small supporting line and larger bold keyword. |
| question-box | Hook or question | Thin outlined box, controlled glow, staged phrase reveal. |
| highlight-bar | A selected strong phrase or number | Contrast bar behind the emphasized span, based on A4. |
| list-pills | Actual enumerated list | Sequential pill labels with consistent alignment. |
| behind-subject | Occasional major emphasis | Large typography behind a clean subject mask. |
| stacked-list | A short spoken list (2-4 items) | Lead-in with dot markers, items added one line at a time (A1). |
| neon-rail | Contrast, warning, "but" moments | Red glowing line brackets/rails that draw on around the block (A2). |
| outlined-pill | Item names, offers, CTA lines | Accent-outlined rounded pills stacked vertically (A5). |
| scramble | A reveal or punchline | Characters resolve over ~10 frames; use at most once or twice per video (A2). |

Optional devices (HUD, icons, overlays, connectors) and transitions are catalogued in [editorial-inserts.md](editorial-inserts.md).

Use common presets most of the time. Special layouts need a narrative reason. Tiny icons may clarify a topic, but avoid arbitrary emojis and icon clutter.

## Placement

Measure normalized coordinates within the actual edited panel. Transfer visual relationships, not raw coordinates from the outer portrait portfolio export. Landscape A3/A4 layouts require reflow in a portrait target; do not stretch them.

Choose a stable chest/below-face anchor per shot, keeping eyes, mouth, meaningful gestures and the demonstrated product readable. Check the subject across the entire phrase, not just its first frame. If the anchor must change, change at a phrase boundary or cut rather than tracking the body frame by frame.

Fit the real target aspect ratio and platform UI safe areas. Keep line breaks and bounding boxes stable as words appear; intentional progressive layouts may grow, but must not jitter. Add restrained shadow or a local gradient for contrast only when necessary.

## Motion and timing

Align to the actual audio; use word timestamps where available, then verify timing rather than assuming recognition is exact. Phrase-level holds should allow reading, including during rapid speech. Maintain the language and code-switching of the speaker.

Recreate the selected reference's phrase building, short translation, scale settling, tracking change or sequential entrance. Do not substitute generic karaoke coloring for every treatment. Avoid continuous wobble, exaggerated bounce and random rotation.

Measure entrance/hold/exit timing from frame sequences where possible. Frame strips ([transition frames](visuals/aroll-transition-frames.jpg)) show an added keyword wiping in over ~3-4 frames (≈100-130 ms at 30 fps), a caption wiping out over ~3 frames, and captions carried through 8-12-frame whip blurs (±2 frames, low-resolution source). Use 100-240 ms entrances as a provisional range and re-measure on originals before claiming fidelity. Use blur during movement sparingly; settled text must be sharp. Inspect at real speed as well as at transition frames.

Large behind-subject text requires clean masks through hair and hand motion. If masking remains visibly unstable, use a foreground layout that preserves readability rather than shipping broken cutouts.

## Caption-specific acceptance

Check actual rendered fonts, spelling, synchronization, reading time, line wrapping, contrast, collisions and platform edges. Inspect a full moving shot for face/gesture obstruction. Keep animated styling in the editable project; export SRT separately for the text and timing.
