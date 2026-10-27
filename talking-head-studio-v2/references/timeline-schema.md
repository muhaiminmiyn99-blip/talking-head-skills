# timeline.json schema (engine contract)

`init-project.js` drafts this file. You then design `cards`, `broll`, `popups`, zooms and `endcard`. Times are in seconds of the source; there are no cuts, so source time and edit time are the same. Current validated example (neon captions, collage B-roll, iris/flicker, clean SFX): [../examples/cta2-collage-neon-timeline.json](../examples/cta2-collage-neon-timeline.json). Older A1/Iman example: [../examples/test00-timeline.json](../examples/test00-timeline.json).

## Top level
| Key | Meaning |
| --- | --- |
| `source` | Absolute path of the source video. |
| `output` | `{width:1080,height:1920,fps:30,duration}` |
| `accent` | Footage-derived accent for the Iman layer (`#FF9A3C`, warm amber, for warm interiors). |
| `broll_layer` | `broll-iman.js` (default) or `broll-layer.js` (B1 black-gold). |
| `segments` | `[{id:'S1',start,end,text}]` from whisper. Fix wording in `text`. Splitting or merging is allowed; keep ids unique. |
| `endcard` | `{start, captions:false}` when the video ends on a logo card (no captions after `start`). `null` if none. |
| `sfx` | `{dir:'sfx/pro',bus_gain:0.42,mode:'clean',peak_align:[…],gains:{}}`. Set `mode:'clean'` (the default style; see SKILL.md). `mix-sfx.js` then writes the chosen events to `sfx-clean.json` for review. |
| `masks` | Written by `cut-mask-clips.js`: `[{file:'assets/mask/<id>_rb.mp4',start,popup}]`. |

## cards (A1 captions; one per spoken segment, max 2 rows)
`{seg:'S4', rows:[[spec, text], …], zoom?:1.08–1.15, hide?:true, size?:{key:96}}`

- Hide a card when a B-roll part covers its segment, or when a text popup carries that line.
- `zoom` is an instant punch-in held for the segment. Use it on 2–3 emphatic lines; it gets a bass hit SFX.
- Row `spec` (first word picks the row type, then flags):

| Spec | Look |
| --- | --- |
| `ital` | Light italic white lead; `*word` makes a word a yellow keyword inline (`"Live trade *Face-to-Face"`). |
| `lead` | Upright Montserrat Medium white lead. |
| `key` | Whole row as a yellow Montserrat Bold keyword with glow and per-word jitter. |
| `box` | White outlined glow box (A1 hook); plain words white, `*word` yellow. |
| `pill` | Yellow outlined pill; all yellow unless some words carry `*`. |
| `conn` | Dashed yellow connector line (text `""`), placed between two rows. Counts as no line. |
| flags | `rules` (yellow side rules), `dots` (list markers), `underline` (glow underline under a key row), `icon:cal` / `icon:link`, `item` (bigger list keyword). |

Rules:
- At most 2 text rows per card.
- `fitRows` shrinks any row wider than 740 px.

### N1 neon cards (current default)
`{seg:'S1', neon:'clean', lead:'Selalu tengok Fira dekat', main:'Phone', sub?:'je kan?', subStyle?:'sans'|'small', size?:{main:104,sub:64,lead:50}, zoom?}`

- `lead` is a small white Inter line. `main` is the glowing word (keep it 1–2 words, 112 px by default). `sub` is tucked under the right side of `main`: Great Vibes script by default, `sans` for a bold sans word, or `small` for small Inter.
- Presets: `clean`, `select`, `oldmoney`, `water`, `green`, `orange`, `smooth`, `blue`, `error`. Each word blurs in at its spoken time; the card blurs out.
- Fonts: Great Vibes, Allura and DM Serif Display, all OFL from Google Fonts (`engine/fonts`, with the licence files).
- Cards sit in the safe area (x 120–900, centre y≈1066).

## broll (Iman Dark Luxury full-screen parts; `type:'html'` draws in the caption layer)
`{id, type:'html', scene, start, end, p:{…}, sparks?:[[x,y,phase]], purpose}`

Every scene must show what is literally said, and pick the scene that shows the **topic** itself, not a generic shape: trading lines get `candles`, channel or group lines get `channel`, a listed process gets `steps`, the client's app gets `app-icon` with their mark. Brand marks: crop the logo from the source's end card into `assets/brand/` (FFmpeg crop + `colorkey=black`). Keep tracked-caps titles short (≤ ~16 characters) so they stay left of x 900. Scenes:

| Scene | `p` params | Use for |
| --- | --- | --- |
| `pills` | `title`, `titleY?`, `items:[{text,cue}]` (≤3), `y0?`, `gap?`, `strike?:{cue}` | Lists, options, "not just X or Y" (strike). |
| `chart` | `title`, `titleCue`, `marks:[{text,cue}]` (≤2: first is the ring, second is the zone) | Explaining a setup, trend, entry, growth. Metaphorical, never real data. |
| `app-icon` | `label` ('AI', 'IG', '1:1'…) or `img` (brand mark PNG), `glowCue`, `items:[{text,cue,accent?}]` (≤4) | A tool, an app, AI, a platform. Use the client's own mark (`img`) when the app is theirs. |
| `candles` | `zone:{text,cue}`, `confirm?:{text,cue}`, `entry?:{text,cue}`, `wait?:{text,cue}` | Trading talk: zone, waiting in the zone, confirmation candle, entry/setup line. Candles print in story order (into the zone on its cue, the confirmation candle only on its cue). No prices. `zone.text:''` hides the ZONE tag. |
| `channel` | `name`, `sub?`, `avatar?` (brand mark), `post:{text,cue}`, `shared?:{text,cue}` (HTML allowed, `<b>` = amber) | "In the channel / group you see the setup I share": a channel card where the post lands on its cue. |
| `steps` | `items:[{text,cue,dt?}]` (≤4), `y0?`, `gap?` | A process or sequence the speaker lists or refers back to; rows light up on cues (`dt` staggers several rows off one cue). |
| `slots` | `title`, `titleCue`, `total` (12), `free:[i…]`, `pill:{text,cue}` | Scarcity or limited seats, without numbers. |
| `statement` | `big:{text,cue}`, `bigY?`, `sub?:{text,cue}` | One spoken word, date or number the speaker actually says. |
| `title` | Any scene accepts `title` + `titleCue` (tracked caps with ✦). | |
| `collage` | `bg:'paper'|'ink'`, `head:'Lead *Accent rest*'`, `headCue`, `accCue`, `accSize?` (124), `headY?` (290), `swoosh?:true`, `card?:{title,logo?,x,y,rot?,items:[{text,cue,dt?,icon?}]}`, `chart?:{y,h,zone,confirm?,entry?,wait?}`, `tile?:{src,x,y,cue}`, `circle?:{x,y,r,cue}`, `objs?:[{src,cue,x,y,w,rot?,anim?:'pop'|'left'|'right'|'drop',to?:{x,y,cue}}]` | **Current default.** Editorial collage. Lay out the headline at y 290–480, content at y 520–1080, and the narration line at y 1130. Objects come from `assets/objects/` (library `objects/`: plane, magnifier, hourglass, thinking, eyes). Make new ones with `gpt_image_2_5`, `--background transparent --quality medium` (0.5 credits each), then `trim-icons.js`, and add them to the library. `to` glides an object onto a target (for example a magnifier onto the confirmation candle). Cards, charts and tiles render as dark glass with an amber glow; `glass:false` brings back the flat chart. `swoosh:true` animates (draw-on, slow wave, travelling light) and the glass blurs it. Use `swoosh:true` on every paper scene. |

**Transitions** (any part): `tin:'iris'|'pop'|'dip'`, `tout:'flicker'|'iris'|'spin'|'dip'`, `irisAt:[x,y]` (circle origin: the speaker's face [540,520], or the previous scene's accent word, for example [540,414] for a 124 px accent at `headY` 290).
- Default pairing: `tin:'iris'` or `'pop'` with `tout:'flicker'`. Use `iris→iris` to chain two parts.
- `iris` is a 2-frame solid dot, then a feathered circle drawn with a mask gradient that covers the frame by about frame 7, while the scene scales 1.1→1 around the origin.
- `flicker` is the last 4 frames at brightness 0.55 / 0 / 1 / 0.6, then a hard cut.
- When a part ends exactly where an `iris` part starts, set its `tout:'iris'`. It keeps drawing underneath until the circle covers the frame.
- Parts with `tin`/`tout` skip the white flash. `dip` draws black frames from `captions.html` (`#dip`; it is hidden in the behind layer).
- Leave out `headCue` (and the `cue` of the main tile or card) so the scene is never blank after the cut. Cue only the accent word and the objects.
- Timing: start a part on a voice onset (the start of the spoken phrase). End it about 2 frames before the next visible caption card's `seg.start - 0.08`, so captions don't flash over the flicker.

Rejected direction (2026-10-22): the Apvulia "gold on black" explainer look (sans + serif-italic gold headline, perspective grid, gold haze, speed streaks, gold rims, gold toggle). Don't reintroduce it.

- A `cue` is the start of a spoken word (lower-case prefix match) inside the part's window. The element appears on that word.
- B-roll parts get these automatically: whoosh plus the cinematic riser → boom → reverb tail, a narration line (Montserrat Light→Bold) at y 1130, and a white flash at the cuts.
- `type:'video'` with `file` (a generated clip) is still supported. Optional `zoom`, `cx`, `cy` and `shiftY` reframe it.

## popups (graphics over the talking A-roll)
- 3D icon from behind the speaker: `{id, kind:'icon', behind:true, src:'assets/icons/people.png', start, end, cue, lead:0.25–0.45, x, y, size:470–540, rise:560, tilt:±8–14, mouse?:'link'}`
  - `x`/`y`/`size` are the visible icon box (PNG trimmed).
  - Place it beside the head so its lower part starts behind the shoulder.
  - Keep it right of x 900 only above y 840.
- Text popup: `{id, kind:'pills', behind:false, start, end, cue, title, titleY:850, pills:[{text,y:955,cue},{text,y:1095,cue}]}`. Hide the A1 card for that segment.
- Behind popups need masks (`cut-mask-clips.js`, then Higgsfield `remove_background` on each clip, saved as `<id>_rb.mp4`). If there is no mask, set `behind:false`.
