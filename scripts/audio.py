#!/usr/bin/env python3
"""Original upbeat audio bed for Frolic reels — no licensing risk (fully synthesised).
118 BPM, C major pentatonic marimba plucks + four-on-floor kick, clap, offbeat hats, bass."""
import numpy as np, sys

SR = 44100
BPM = 118.0
BEAT = 60.0 / BPM
BARS = 20
total = BARS * 4 * BEAT
N = int(total * SR)
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

def add(sig, start, pan=0.0):
    i0 = int(start * SR)
    n = min(len(sig), N - i0)
    if n <= 0: return
    gl = np.sqrt(0.5 * (1 - pan)); gr = np.sqrt(0.5 * (1 + pan))
    L[i0:i0+n] += sig[:n] * gl; R[i0:i0+n] += sig[:n] * gr

def env(n, a, d, sustain=0.0):
    e = np.zeros(n); ai = max(1, int(a * SR)); di = max(1, int(d * SR))
    e[:ai] = np.linspace(0, 1, ai)
    rest = n - ai
    if rest > 0:
        dec = np.exp(-np.linspace(0, 5, min(di, rest)))
        e[ai:ai+len(dec)] = dec * (1 - sustain) + sustain
    return e

def kick(vel=1.0):
    n = int(0.28 * SR); tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 26) + 48
    return vel * 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.24)

def clap(vel=1.0):
    n = int(0.22 * SR)
    noise = np.random.default_rng(7).standard_normal(n)
    b = np.fft.rfft(noise); freqs = np.fft.rfftfreq(n, 1/SR)
    b[(freqs < 900) | (freqs > 4200)] *= 0.05
    noise = np.fft.irfft(b, n)
    e = env(n, 0.001, 0.16) * (1 + 0.5 * np.sin(2 * np.pi * 55 * np.arange(n)/SR))
    return vel * 0.32 * noise * e

def hat(vel=1.0):
    n = int(0.07 * SR)
    noise = np.random.default_rng(11).standard_normal(n)
    b = np.fft.rfft(noise); freqs = np.fft.rfftfreq(n, 1/SR)
    b[freqs < 6500] *= 0.03
    noise = np.fft.irfft(b, n)
    return vel * 0.16 * noise * env(n, 0.001, 0.05)

def marimba(freq, dur, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = np.sin(2*np.pi*freq*tt) + 0.35*np.sin(2*np.pi*freq*3.9*tt)*np.exp(-tt*18) + 0.15*np.sin(2*np.pi*freq*9.2*tt)*np.exp(-tt*30)
    return vel * 0.34 * s * env(n, 0.002, dur * 0.9)

def bass(freq, dur, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = np.sin(2*np.pi*freq*tt) + 0.4*np.sin(2*np.pi*freq*2*tt)
    return vel * 0.4 * s * env(n, 0.005, dur, sustain=0.3) * np.exp(-tt*3)

C, D, E, G, A = 261.63, 293.66, 329.63, 392.0, 440.0
PENT = [C, D, E, G, A, 2*C, 2*D, 2*E]
rng = np.random.default_rng(2026)
phrase1 = [0, 2, 4, 3, 5, 4, 2, 3]; phrase2 = [5, 4, 3, 4, 2, 3, 1, 2]
for bar in range(BARS):
    bt = bar * 4 * BEAT
    fade = 1.0 if bar < BARS - 2 else max(0.0, 1 - (bar - (BARS - 2)) / 2)
    for b in range(4):
        add(kick(0.95 * fade), bt + b * BEAT)
        if b in (1, 3): add(clap(0.9 * fade), bt + b * BEAT)
        add(hat(0.8 * fade), bt + b * BEAT + BEAT / 2, pan=0.3)
        if bar >= 2 and b in (0, 2):
            root = C / 2 if bar % 4 < 2 else A / 4 * 2
            add(bass(root / 2, BEAT * 0.9, 0.85 * fade), bt + b * BEAT)
    if bar >= 1:
        ph = phrase1 if bar % 2 == 0 else phrase2
        for k, idx in enumerate(ph):
            when = bt + k * BEAT / 2
            add(marimba(PENT[idx], 0.5, (0.75 + 0.2 * rng.random()) * fade), when, pan=(-0.25 if k % 2 else 0.25))
            add(marimba(PENT[idx] * 2, 0.4, 0.12 * fade), when + 0.18, pan=0.4)

mix = np.stack([L, R])
mix = np.tanh(mix * 1.15)
mix = mix / np.max(np.abs(mix)) * 0.89
audio = (mix.T * 32767).astype(np.int16)
import wave
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(audio.tobytes())
print(f'wrote {total:.1f}s audio bed')
