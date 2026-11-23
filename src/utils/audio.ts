// Web Audio API Synthesizer for Industrial Logistics Workstation
// Generates loud alarm siren on mismatch, positive match chime, and batch completion fanfare

let audioCtx: AudioContext | null = null;
let currentAlarmSource: { stop: () => void } | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Stop any active loud alarm siren
 */
export function stopAlarm(): void {
  if (currentAlarmSource) {
    try {
      currentAlarmSource.stop();
    } catch {
      // ignore if already stopped
    }
    currentAlarmSource = null;
  }
}

/**
 * Loud Alarm Siren for Material Mismatch Alert
 * Generates an unmistakable, high-urgency alternating two-tone siren
 * (880 Hz to 440 Hz oscillation with harsh sawtooth harmonics)
 */
export function playLoudAlarm(): void {
  stopAlarm();
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 2.4; // 2.4 seconds siren burst

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';

  // Urgency LFO siren pitch warble between 900Hz and 480Hz
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(4.5, now); // 4.5 pulses per second
  lfoGain.gain.setValueAtTime(220, now);

  lfo.connect(osc1.frequency);
  lfo.connect(osc2.frequency);

  osc1.frequency.setValueAtTime(750, now);
  osc2.frequency.setValueAtTime(750, now);

  // High gain output for warehouse floor audibility
  gainNode.gain.setValueAtTime(0.01, now);
  gainNode.gain.linearRampToValueAtTime(0.85, now + 0.05);
  gainNode.gain.setValueAtTime(0.85, now + duration - 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  lfo.start(now);
  osc1.start(now);
  osc2.start(now);

  lfo.stop(now + duration);
  osc1.stop(now + duration);
  osc2.stop(now + duration);

  currentAlarmSource = {
    stop: () => {
      try {
        gainNode.gain.cancelScheduledValues(ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            lfo.stop();
            osc1.stop();
            osc2.stop();
          } catch {
            // Already stopped
          }
        }, 60);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Pleasant positive dual-tone chime for successful material match
 */
export function playMatchBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1046.5, now); // C6
  osc.frequency.setValueAtTime(1318.5, now + 0.08); // E6

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

/**
 * Celebratory fanfare when all 50 items reach completion
 */
export function playSuccessFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
    { freq: 659.25, time: 0.15, dur: 0.15 }, // E5
    { freq: 783.99, time: 0.3, dur: 0.15 }, // G5
    { freq: 1046.5, time: 0.45, dur: 0.5 }, // C6
  ];

  const now = ctx.currentTime;

  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0.01, now + n.time);
    gain.gain.linearRampToValueAtTime(0.5, now + n.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.dur);
  });
}
