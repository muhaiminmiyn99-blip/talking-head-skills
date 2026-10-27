# Talking Head Skills

Two Claude Code skills for editing vertical talking-head videos (1080x1920, 30 fps).

| Skill | Style |
|---|---|
| `talking-head-studio` | A1 kinetic captions, Iman Gadzhi Dark Luxury UI motion graphics, 3D icons rising behind the speaker, cinematic SFX |
| `talking-head-studio-v2` | R3 lime kinetic captions, R4 HyperFrames B-roll, red-glow 3D glass icons, typing/drone/deep-hit SFX, Final Cut-style local editor |

## Install

Copy each skill folder into `~/.claude/skills/`, then install the engine dependencies:

```bash
cd ~/.claude/skills/talking-head-studio/engine && npm install
cd ~/.claude/skills/talking-head-studio-v2/engine && npm install
```

Both skills share the asset library at `Documents/talking-head-studio-library`, which is not part of this repo.
