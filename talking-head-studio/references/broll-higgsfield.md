# B-roll visual grammar and Higgsfield

## Observed source style

Source B1 is the Bitcoin explainer, not table decor. It uses black negative space, gold surfaces, rim lighting, controlled bloom, simple volumetric figures, occasional reflections and selective red conflict accents. A white-background map sequence provides a deliberate change of scene.

Treat apparent 3D/2.5D appearance as the target. The source does not establish which software or renderer created it. Match form, depth and lighting without inventing its production history.

Approximate scene map:

| Time | Visual/motion evidence |
| --- | --- |
| 0-2 s | Text builds over a person/laptop scene; falling graph line draws on. |
| 2-5 s | Gold portrait enters through a pronounced framing/scale change and settles. |
| 5-10 s | Rising graph, sell button, red rejection symbol, then changing hierarchy/depth. |
| 11-18 s | Gold-rimmed globe, surrounding figures, globe rescaling and unfolding label. |
| 19-22 s | Line graph grows toward an endpoint. |
| 22-26 s | Gold map and location pin on a white background. |
| 26-29 s | Figure on an arrow with speed streaks. |
| 29-37 s | Institutional building, changing symbols, podium and foreground crowd. |
| 38-44 s | Figures on angular platforms against a luminous gold background. |
| 45-50 s | Gap-crossing metaphor and closing CTA. |

Scene detection (threshold 0.3) finds hard cuts only near 21.9, 25.8, 33.6 and 44.8 s; the other scene changes are continuous camera moves, scale changes or morphs inside one shot — reproduce them as motion, not as cuts.

A3/A4 contain a different, lighter "editorial insert" grammar (paper/collage/counters). It is not the default B-roll; see [editorial-inserts.md](editorial-inserts.md).

Inspect [opening scenes](visuals/broll-00-14.jpg), [middle scenes](visuals/broll-15-29.jpg), [later scenes](visuals/broll-30-44.jpg), [ending](visuals/broll-45-49.jpg) and [motion samples](visuals/broll-motion.jpg) as needed. Read original video for exact transitions and timing.

## Default B-roll plan (every talking video)

The user asked on 2026-10-21 for "a few parts" of B1-concept B-roll in every talking video. The first validated build was `TEST 00` (Fira Worldwide): 4 parts in 28 s of speech, about 45% of the runtime.

**How many and where**
- Plan roughly one part per 6–8 s of speech, with a minimum of 3 parts for videos over 20 s. Parts last 1.8–5 s and end on phrase boundaries.
- Keep the speaker's face for the hook's first line, personal or trust moments (dates, invitations, "I'll see you"), and the final CTA line.
- Put B-roll on explanatory phrases: lists, contrasts, "why/how", tools, scarcity, results.

**What each part shows**
- One literal visual metaphor of the spoken phrase, B1 style. Examples:
  - buy/sell: gold buttons crossed by a red X
  - explaining an entry: a gold figure pointing at a line chart with a marker
  - AI together: figures around a holographic AI brain
  - limited slots: a row of seats with only two gold ones left
- Red is only for negatives (X, "limited", scam). Charts are metaphorical, never presented as data.

**Typography inside a part (one caption system at a time; hide A-roll cards)**
- Top word: the single word being spoken, white Inter Regular, about 68 px at 1080 width, y≈330 px, swapped per word with a 3-frame fade.
- Scene phrase: a white Inter Regular line (about 86 px) plus a DM Serif Display Italic accent line (104–128 px), gold `#F6C445`, or red `#E3141E` for negatives. Place it in negative space, left or right aligned, and never over the key object.

**Build method**
- UI-like scenes (buttons, X marks, labels, numbers) are built deterministically in HTML/CSS so the text is always correct.
- Object or figure scenes come from Higgsfield. Generate a key image with `gpt_image_2_5` (9:16, about 0.25 credits), then animate with `kling3_0` (std, 5 s, sound off, start_image, about 7.5 credits). That is about 8 credits per generated part.
  - Prompt template: "Vertical 9:16 premium motion-graphics explainer frame, stylized 2.5D illustration (not photoreal). Deep black background… smooth gold gradient surfaces, bright rim light, soft bloom, subtle floor reflection. The top quarter of the frame is empty black. No text, no numbers, no letters, no logos, no watermark."
  - Motion prompt: a slow push-in plus one specific action, "keep the same objects, no new objects, no text, no camera shake".
  - If Higgsfield returns a preset recommendation instead of a job, resubmit with `declined_preset_id`.
- Reframe in the composite instead of regenerating when possible. Use zoom around (cx, cy) to hide drift or extra objects, and `shiftY` (pad black on top) to make room for the phrase.
- Budget: confirm the per-video credit budget once (the first video used about 39 credits for 2 test shots plus 3 final parts). Use at most two corrective retries per part.

Known model drift: kling may add objects when the camera pulls back (extra seats), and figures may drift toward the frame edge late in a 5 s clip. Use the first 2–4 s and reframe.

## Adapt the grammar, not the Bitcoin subject

Create a visual metaphor tied to the actual narration. Growth may use rising forms; process may use assembling nodes; restriction may use a narrowing space; comparison may use two related objects; opportunity may use an opening path. Choose something more specific when the topic supports it.

Use one main visual idea per shot. Keep consistent material, light direction, object proportions and scene scale. Reuse assets where it improves continuity. Give objects enough hold time to be understood; do not impose one fixed B-roll duration or insertion interval.

Avoid unrelated crypto logos, political figures, stock-footage montage, rainbow neon, arbitrary dashboard cards and decorative charts. Do not fabricate quantitative evidence. A metaphorical chart must not masquerade as factual data.

Typography is separate from the A-roll captions: quieter neutral text with selective serif/italic emphasis, as seen in the source. Measured B1 roles: the top word is a Roboto/Inter-like regular sans at about 0.2 of frame height, and the scene phrase is a regular sans line plus a heavy serif italic accent (red "scam", dark "world"). Preserve readable spacing and negative space. Do not copy the creator watermark or closing brand identity.

## Discover the actual connector

The user reports a Higgsfield connection in Claude. Inspect the tools exposed in the present session and their schemas. Determine supported generation modes, input/reference attachments, aspect ratios, durations, available models, job polling, output retrieval and any cost information actually exposed. Do not assume a web feature exists in the connector or invent API names.

Snapshot seen in a Claude Code desktop session on 2026-10-21 (re-verify every session; names can change): the Higgsfield MCP exposed deferred tools including `generate_image`, `generate_video`, `generate_image_batch`/`generate_video_batch`, `jobs_wait`, `show_generations`, `media_upload` + `media_confirm` (or `media_upload_widget`) for local reference files, `models_explore`, `get_workflow_instructions`, `remove_background`, `upscale_image`/`upscale_video`, `reframe`, `video_analysis_create` and `balance`. Its server instructions say to call `get_workflow_instructions` before multi-step video work. The `higgsfield-generate` skill may also be installed and should be read when present. Load deferred tool schemas before calling them, and check `balance` before a batch.

Use the available tool documentation. If a capability is absent, choose a supported approach and disclose meaningful quality limits. If the connector is unavailable, continue the editable project and captions; do not pretend to generate assets or silently switch to another paid provider.

## Generation brief per shot

Record these fields before submitting:

- Shot ID, narration interval and exact idea to illustrate.
- Subject, action and start/end visual state.
- Composition, camera framing, motion and empty area for later text.
- Black/gold palette, material, light direction and background treatment.
- Target aspect ratio and supported generation duration.
- Asset/reference IDs for visual continuity, when supported.
- Exclusions specific to the shot: extra objects, malformed geometry, random text, watermarks, excessive camera movement or style drift.

Generate a clean key visual first when supported and beneficial; use reference-image or image-to-video controls only if actually available. Prefer individually controllable shots or assets over a long generation that attempts all scene changes and captions.

Keep all exact typography, labels, symbols requiring accuracy, numerical graphics and final timing in deterministic compositing. If generated footage includes inaccurate text or symbols, replace/rebuild the affected asset rather than treating it as acceptable evidence.

Do not assume transparent output. Verify codec/alpha; choose a compatible background/compositing approach if alpha is absent. Check edges, background seams and color matching in the final scene.

Save prompt, tool/model identifier when available, job ID, local output path and usage information. Reuse cached successful assets. Respect the user's existing credit limit. Limit an unsuccessful shot to an initial attempt plus two targeted corrective retries unless the user has set another budget; then finish independent work and report the specific remaining issue. Each retry must address an observed defect. Do not change plans or purchase credits.

## Compose and inspect

Use the existing capable renderer; Remotion/FFmpeg or equivalent are suitable options, not required installed dependencies. Keep animation frame/timeline-driven. Preload fonts/assets and make layer order, masks, anchors and transitions explicit.

Generated video is source material, not a guarantee of smooth or accurate output. Inspect warping, flicker, object continuity, lighting and transitions at playback speed. Adjust the composite or regenerate only the affected shot. Keep the speaker's original narration continuous over B-roll and avoid competing explanatory text plus duplicate captions.
