"use client";

// Web Audio API sound synthesizer for instant zero-dependency sound effects
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("Could not create audio context:", e);
    return null;
  }
}

/**
 * Rich restaurant service desk bell sound ("Ding-Ding!")
 * Played when someone places an order / new ticket arrives at the kitchen
 */
export function playOrderBellSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const strikeBell = (delayMs: number, pitchMultiplier = 1.0) => {
      setTimeout(() => {
        try {
          const c = getAudioContext();
          if (!c) return;
          const now = c.currentTime;

          // Metallic harmonics for genuine brass bell sound
          const baseFreq = 1180 * pitchMultiplier;
          const harmonics = [
            { freq: baseFreq, gain: 0.45, type: "sine" as OscillatorType, duration: 1.6 },
            { freq: baseFreq * 1.85, gain: 0.28, type: "triangle" as OscillatorType, duration: 1.2 },
            { freq: baseFreq * 2.76, gain: 0.18, type: "sine" as OscillatorType, duration: 0.9 },
            { freq: baseFreq * 4.12, gain: 0.08, type: "sine" as OscillatorType, duration: 0.5 },
          ];

          harmonics.forEach(({ freq, gain, type, duration }) => {
            const osc = c.createOscillator();
            const gainNode = c.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            gainNode.gain.setValueAtTime(gain, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gainNode);
            gainNode.connect(c.destination);

            osc.start(now);
            osc.stop(now + duration);
          });
        } catch {}
      }, delayMs);
    };

    // First strike
    strikeBell(0, 1.0);
    // Second energetic strike slightly higher
    strikeBell(140, 1.12);
  } catch (err) {
    console.warn("Failed to play order bell sound:", err);
  }
}

/**
 * Crisp satisfying "Tick" confirmation sound
 * Played when an order is paid and verified
 */
export function playPaidTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Crisp mechanical tick transient (ultra-short click)
    const tickOsc = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tickOsc.type = "sine";
    tickOsc.frequency.setValueAtTime(2600, now);
    tickGain.gain.setValueAtTime(0.35, now);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    tickOsc.connect(tickGain);
    tickGain.connect(ctx.destination);
    tickOsc.start(now);
    tickOsc.stop(now + 0.04);

    // 2. High positive chime chords (Apple Pay / Stripe verification style tick-ping)
    const tones = [
      { delay: 0.03, freq: 1174.66, gain: 0.3, dur: 0.5 }, // D6
      { delay: 0.12, freq: 1760.0, gain: 0.38, dur: 0.8 }, // A6
    ];

    tones.forEach(({ delay, freq, gain, dur }) => {
      const startTime = now + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  } catch (err) {
    console.warn("Failed to play paid tick sound:", err);
  }
}
