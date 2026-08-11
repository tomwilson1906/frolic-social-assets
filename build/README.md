# Frolic reel build system (CI)

Reels used to be built in the growth agent's sandbox and pushed from there. That broke on
7 Aug 2026 when the sandbox stopped being issued a GitHub credential, and it cannot be fixed
from inside the sandbox. This directory moves reel building to GitHub Actions, which is where
it should have lived all along -- the same reason carousels never broke is that they render
server-side on Vercel.

## How it works

1. The agent writes a spec JSON into `build/specs/` (it can do this from Supabase, which has
   network egress the sandbox does not).
2. The push triggers `.github/workflows/build-reel.yml`.
3. CI renders the Confetti Cannon cards with Playwright, asserts the brand fonts actually
   applied (exits non-zero on the serif-fallback defect), encodes the MP4 with ffmpeg, and
   commits it to `reels/`.
4. `raw.githubusercontent.com` serves it. The Supabase `reels-autopost` function ingests it
   into storage and publishes to Instagram, exactly as before.

No step needs a human.

## Adding a reel

Drop a spec in `build/specs/<name>.json`. CI skips any spec that already has
`reels/frolic-reel-<name>.mp4`, so rebuilds are opt-in: delete the MP4 to force one.

## Card kinds

- `hook`  {kicker, h1, sub?}   -- h1 may contain <span class="pk"> for the pink accent
- `point` {lead?, text}        -- text may contain <span class="mk"> for the marigold marker
- `list`  {title, rows[3]}
- `cta`   {title, sub}

Seven cards at 4.3s each, minus transitions, lands at ~28s. Plain text only in card fields.

## The font guard -- do not remove it

An off-brand reel published to Instagram on 6 Aug 2026 because `@fontsource` did not resolve
and every card silently rendered in a serif fallback. Every automated check passed: render 200,
ingest byte count correct, cron succeeded, row flipped to posted. All green, all blind.
`make_reel.js` now measures a probe string against `monospace` and exits non-zero unless both
Shrikhand and Karla actually applied. Probe Karla at weight 800, not 400 -- cards never use
Karla 400, so a 400 probe fails on every card.

The wider lesson: this pipeline verifies that bytes moved, never that the bytes were right.
