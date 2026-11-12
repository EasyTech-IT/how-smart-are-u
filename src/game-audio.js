let audioContext;
let ambient;
let ambientGeneration = 0;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext ||= new AudioContext();
  return audioContext;
}

export function playUiSound(kind) {
  const context = getAudioContext();
  if (!context) return false;
  if (context.state === "suspended") {
    void context.resume().catch((error) => console.error("Audio could not resume.", error));
  }

  const notes = { found: 660, hint: 440, complete: 880 };
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(notes[kind] || notes.found, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(kind === "complete" ? 0.045 : 0.025, now + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.17);
  return true;
}

export async function setAmbience(enabled) {
  if (!enabled) {
    const stopping = ambient;
    if (!stopping) return;
    const generation = ++ambientGeneration;
    const context = audioContext;
    stopping.volume.gain.setTargetAtTime(0.0001, context.currentTime, 0.12);
    window.setTimeout(() => {
      if (generation !== ambientGeneration || ambient !== stopping) return;
      stopping.oscillators.forEach((oscillator) => oscillator.stop());
      ambient = null;
    }, 500);
    return;
  }

  const context = getAudioContext();
  if (!context) throw new Error("Audio is not available on this device.");
  await context.resume();
  if (ambient) {
    ambient.volume.gain.setTargetAtTime(0.012, context.currentTime, 0.12);
    ambientGeneration += 1;
    return;
  }

  const volume = context.createGain();
  volume.gain.setValueAtTime(0.0001, context.currentTime);
  volume.gain.setTargetAtTime(0.012, context.currentTime, 0.35);
  volume.connect(context.destination);
  const oscillators = [110, 164.81].map((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(volume);
    oscillator.start();
    return oscillator;
  });
  ambient = { oscillators, volume };
}
