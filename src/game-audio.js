let audioContext;
let ambientMusic;

const SOUND_PATTERNS = {
  tap: [[392, 0, 0.065]],
  select: [[523.25, 0, 0.085]],
  found: [[659.25, 0, 0.11], [783.99, 0.075, 0.12]],
  hint: [[440, 0, 0.1], [587.33, 0.08, 0.12]],
  complete: [[523.25, 0, 0.16], [659.25, 0.12, 0.16], [783.99, 0.24, 0.22]],
  error: [[220, 0, 0.13]],
  toggle: [[587.33, 0, 0.08]]
};

const MUSIC_CHORDS = [
  [130.81, 164.81, 196, 261.63],
  [110, 130.81, 164.81, 220],
  [87.31, 130.81, 174.61, 220],
  [98, 146.83, 196, 246.94]
];

function getAudioContext() {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
}

export function playUiSound(kind = "found") {
  const pattern = SOUND_PATTERNS[kind];
  if (!pattern) return false;

  const context = getAudioContext();
  if (!context) return false;
  if (context.state === "suspended") {
    void context.resume().catch((error) => console.error("Audio could not resume.", error));
  }

  const peak = kind === "complete" ? 0.026 : 0.019;
  for (const [frequency, offset, duration] of pattern) {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    const start = context.currentTime + offset;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  return true;
}

function playNextChord(music) {
  if (ambientMusic !== music) return;
  const context = music.context;
  const chord = MUSIC_CHORDS[music.chordIndex];
  const start = context.currentTime;

  music.oscillators.forEach((oscillator, index) => {
    oscillator.frequency.setTargetAtTime(chord[index], start, 1.8);
  });
  music.chordIndex = (music.chordIndex + 1) % MUSIC_CHORDS.length;
}

export async function setAmbience(enabled) {
  if (!enabled) {
    if (!ambientMusic || ambientMusic.stopTimer) return;
    const music = ambientMusic;
    music.volume.gain.setTargetAtTime(0.0001, music.context.currentTime, 0.3);
    music.stopTimer = window.setTimeout(() => {
      if (ambientMusic !== music) return;
      window.clearInterval(music.chordTimer);
      music.oscillators.forEach((oscillator) => oscillator.stop());
      ambientMusic = null;
    }, 1000);
    return;
  }

  const context = getAudioContext();
  if (!context) throw new Error("Web Audio is not supported in this browser.");
  if (context.state === "suspended") await context.resume();

  if (ambientMusic) {
    if (ambientMusic.stopTimer) {
      window.clearTimeout(ambientMusic.stopTimer);
      ambientMusic.stopTimer = null;
    }
    ambientMusic.volume.gain.setTargetAtTime(0.012, context.currentTime, 0.45);
    return;
  }

  const volume = context.createGain();
  const filter = context.createBiquadFilter();
  const oscillators = MUSIC_CHORDS[0].map((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(volume);
    oscillator.start();
    return oscillator;
  });
  volume.gain.value = 0.0001;
  volume.gain.setTargetAtTime(0.012, context.currentTime, 0.8);
  filter.type = "lowpass";
  filter.frequency.value = 720;
  filter.Q.value = 0.25;
  volume.connect(filter);
  filter.connect(context.destination);

  ambientMusic = {
    context,
    volume,
    oscillators,
    chordIndex: 1,
    chordTimer: null,
    stopTimer: null
  };
  const music = ambientMusic;
  music.chordTimer = window.setInterval(() => playNextChord(music), 8500);
}
