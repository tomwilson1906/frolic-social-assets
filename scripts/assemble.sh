#!/bin/bash
# Assemble card PNGs -> reel MP4 (zoompan + xfade + audio bed). Usage: assemble.sh <cards_dir> <n_cards> <audio.m4a> <out.mp4>
set -e
DIR="$1"; N="$2"; AUDIO="$3"; OUT="$4"
DUR=4.3; FADE=0.33; FPS=30
FRAMES=$(python3 -c "print(int($DUR*$FPS))")
TOTAL=$(python3 -c "print($N*$DUR-($N-1)*$FADE)")

INPUTS=(); FC=""
for i in $(seq 1 $N); do INPUTS+=(-loop 1 -t $DUR -i "$DIR/card_$i.png"); done
TR=(fade slideup fade slideleft fade slideup fade slideleft)
for i in $(seq 0 $((N-1))); do
  if [ $((i % 2)) -eq 0 ]; then Z="min(1.0+0.00050*on,1.064)"; else Z="max(1.064-0.00050*on,1.0)"; fi
  FC+="[$i:v]scale=2160:3840:flags=lanczos,zoompan=z='$Z':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$FRAMES:fps=$FPS:s=1080x1920,format=yuv420p,settb=AVTB[v$i];"
done
PREV="v0"
for i in $(seq 1 $((N-1))); do
  OFF=$(python3 -c "print(round($i*($DUR-$FADE),3))")
  T=${TR[$(( (i-1) % 8 ))]}
  NEXT="x$i"; [ $i -eq $((N-1)) ] && NEXT="vout"
  FC+="[$PREV][v$i]xfade=transition=$T:duration=$FADE:offset=$OFF[$NEXT];"
  PREV="$NEXT"
done
FC="${FC%;}"

ffmpeg -y "${INPUTS[@]}" -i "$AUDIO" -filter_complex "$FC" -map "[vout]" -map "$N:a" \
  -t $TOTAL -af "atrim=0:$TOTAL,afade=t=out:st=$(python3 -c "print($TOTAL-1.2)"):d=1.2" \
  -c:v libx264 -crf 25 -preset slow -r $FPS -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -movflags +faststart "$OUT" 2>&1 | tail -2
ffmpeg -y -i "$OUT" -an -c:v copy "${OUT%.mp4}_silent.mp4" 2>&1 | tail -1
echo "done: $OUT ($TOTAL s)"
