# timeline.json schema (engine contract)

`init-project.js` drafts this file. You then design `cards`, `broll`, `popups`, zooms and `endcard`. Times are in seconds of the source; there are no cuts, so source time and edit time are the same. Full validated example: [../examples/test00-timeline.json](../examples/test00-timeline.json).

## Top level
| Key | Meaning |
| --- | --- |
| `source` | Absolute path of the source video. |
| `output` | `{width:1080,height:1920,fps:30,duration}` |
| `accent` | Footage-derived accent for the Iman layer (`#FF9A3C`, warm amber, for warm interiors). |
| `broll_layer` | `broll-iman.js` (default) or `broll-layer.js` (B1 black-gold). |
| `segments` | `[{id:'S1',start,end,text}]` from whisper. Fix wording in `text`. Splitting or merging is allowed; keep ids unique. |
| `endcard` | `{start, captions:false}` when the video ends on a logo card (no captions after `start`). `null` if none. |
| `sfx` | `{dir:'sfx/pro',bus_gain:0.42,cinematic:true,peak_align:[…],gains:{}}`. Leave the defaults. |
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
- `fitRows` shrinks any row wider than 780 px.
- Cards sit in the safe area (x 120–900, centre y≈1066).

## broll (Iman Dark Luxury full-screen parts; `type:'html'` draws in the caption layer)
`{id, type:'html', scene, start, end, p:{…}, sparks?:[[x,y,phase]], purpose}`

Every scene must show what is literally said. Scenes:

| Scene | `p` params | Use for |
| --- | --- | --- |
| `pills` | `title`, `titleY?`, `items:[{text,cue}]` (≤3), `y0?`, `gap?`, `strike?:{cue}` | Lists, options, "not just X or Y" (strike). |
| `chart` | `title`, `titleCue`, `marks:[{text,cue}]` (≤2: first is the ring, second is the zone) | Explaining a setup, trend, entry, growth. Metaphorical, never real data. |
| `app-icon` | `label` ('AI', 'IG', '1:1'…), `glowCue`, `items:[{text,cue,accent?}]` (≤4) | A tool, an app, AI, a platform. |
| `slots` | `title`, `titleCue`, `total` (12), `free:[i…]`, `pill:{text,cue}` | Scarcity or limited seats, without numbers. |
| `statement` | `big:{text,cue}`, `bigY?`, `sub?:{text,cue}` | One spoken word, date or number the speaker actually says. |
| `title` | Any scene accepts `title` + `titleCue` (tracked caps with ✦). | |

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
