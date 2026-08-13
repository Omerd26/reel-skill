# Background music library

The auto-editor and chat editor pick a background music bed by **mood** and play
it under the speech (low volume). Files live here, organized by mood folder:

```
public/music/
  upbeat/      *.mp3   — energetic / hype / fast
  calm/        *.mp3   — chill / relaxed / soft
  inspiring/   *.mp3   — uplifting / emotional
  corporate/   *.mp3   — professional / balanced / serious
```

`music_library.py` scans these folders and selects a track from the mood that
matches the edit brief's `overallFeel`. Drop `.mp3` files into the right folder
and they are picked up automatically — no code change.

## ⚠️ LICENSING — READ BEFORE ADDING TRACKS

This is a **commercial SaaS**: the music ends up burned into **end-users'**
videos that they publish. That is a *redistribution / sync* use, which many
"free" or "royalty-free" licenses do **not** cover (they permit *your own*
content, not a tool that puts the track into other people's published videos).

Only add tracks whose license clearly permits this, e.g.:
- **CC0 / public domain** (safest — no restrictions, no attribution), or
- a **library/API license bought for the SaaS** (e.g. Uppbeat for teams,
  Soundstripe/Epidemic API, Artlist for platforms), or
- **owner-owned / commissioned** music.

Do NOT drop in tracks scraped from YouTube, Spotify, or a "free download" blog
without confirming the license covers user-generated-content redistribution.
When in doubt, leave it out.

## Curation log

**2026-07-30 — 10 of 15 tracks deleted after objective measurement.** The auto-fetched CC0 batch was
legally clean but mostly unusable as a bed. Measured with `ffmpeg loudnorm` + `volumedetect`:

| Deleted | Measured reason |
|---|---|
| `upbeat/wah_wah_wah_wah.mp3` | true peak +0.51 dB (clipping), range 0.3 dB, and it is a novelty sound |
| `upbeat/fun_dancetrack.mp3` | true peak +0.76 dB (clipping), −11.6 LUFS (far too hot for a bed) |
| `corporate/perspire_loop_...mp3` | true peak +1.20 dB (clipping) |
| `inspiring/piano_song_loop_1_...mp3` | −31.1 LUFS / peak −18.1 dB — inaudible at our 0.10 bed gain |
| `inspiring/listen.mp3` | −27.4 LUFS / peak −11.7 dB — same |
| `calm/calm_happy_rpgtownbackground.mp3` | −28.8 LUFS, and it is RPG-town game music |
| `corporate/gamemusic.mp3` | game music filed as "corporate"; 9.8 dB range |
| `calm/fuzzy_lofi_synth_song.mp3` | 19.5 dB dynamic range — pumps badly under a ducked bed |
| `corporate/lake_night_wav.mp3` | 13.3 dB range |
| `upbeat/tropicorp_advertisement.mp3` | exact duplicate of the `corporate/` copy |

**Bed criteria to apply to any future track** (why the survivors survived): integrated loudness roughly
−15 to −19 LUFS, true peak **below 0 dB** (never clipping), loudness range **under ~6 dB** so the bed
sits still under ducked speech, and ideally ≥60s so a 60-90s reel does not expose a loop seam.

**Known gap:** free CC0 libraries are archives of clips, not reel music. The honest upgrade is a bought
library whose licence covers SaaS/end-user redistribution (see the licensing section above). Lofi is the
genre worth paying for — it is the default sound of short-form and the free pool has nothing usable.
