import test from "node:test";
import assert from "node:assert/strict";
import { playUiSound, setAmbience } from "../src/game-audio.js";

class FakeParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  setTargetAtTime() {}
}

class FakeNode {
  constructor() {
    this.gain = new FakeParam();
    this.frequency = new FakeParam();
    this.Q = new FakeParam();
    this.started = false;
    this.stopped = false;
  }

  connect() {}
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  state = "running";
  currentTime = 1;
  destination = {};
  nodes = [];

  createOscillator() {
    const node = new FakeNode();
    this.nodes.push(node);
    return node;
  }

  createGain() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
}

test("UI tones and the original ambient progression use Web Audio without media files", async () => {
  const previousWindow = globalThis.window;
  const context = new FakeAudioContext();
  globalThis.window = {
    AudioContext: class {
      constructor() { return context; }
    },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: (callback) => {
      callback();
      return 2;
    },
    clearTimeout() {}
  };

  try {
    assert.equal(playUiSound("tap"), true);
    assert.equal(playUiSound("not-a-sound"), false);
    await setAmbience(true);
    assert.ok(context.nodes.length >= 5);
    assert.ok(context.nodes.every((node) => node.started));
    await setAmbience(false);
    assert.ok(context.nodes.slice(-4).every((node) => node.stopped));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
