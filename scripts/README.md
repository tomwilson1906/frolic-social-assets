# Frolic reel build scripts

Canonical copies of the sandbox reel generator (mirrors `claude/frolic-reels-automation.md`).

    npm install playwright @fontsource/shrikhand @fontsource/karla
    python3 audio.py bed.wav && ffmpeg -y -i bed.wav -c:a aac -b:a 160k bed.m4a
    node make_reel.js <spec>.json cards/<name>
    ./assemble.sh cards/<name> 7 bed.m4a out/<name>.mp4

## Gotchas (both cost time on 31 Jul 2026)

1. **Run everything from the directory npm actually installed into.** `make_reel.js` resolves fonts from
   `__dirname/node_modules`. In the cloud sandbox `HOME=/root`, so `~/frolic-reels` is `/root/frolic-reels`
   while the Write tool defaults to `/home/claude`. Split them and the cards render silently in a serif
   fallback — no error, just off-brand. **Always eyeball a rendered card PNG before assembling.**
2. **`reels-autopost` must write `ig_media_id`, not just notes.** `ig-metrics-collect` selects on that column;
   before v3 (31 Jul 2026) every published reel collected zero insight snapshots.
