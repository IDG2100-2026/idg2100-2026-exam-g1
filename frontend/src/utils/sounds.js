function ctx() {
  if (!window._sfxCtx) {
    window._sfxCtx = new (window.AudioContext || window.webkitAudioContext)() // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
  }
  return window._sfxCtx
}

function tone(freq, duration, type = 'sine', vol = 0.25, delay = 0) {
  try {
    const c = ctx()
    const osc  = c.createOscillator() // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
    const gain = c.createGain() // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + delay)
    gain.gain.setValueAtTime(vol, c.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration) // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + duration + 0.01)
  } catch { /* AudioContext may be blocked until user interaction */ }
}

// Short dice-rattle burst
export function playRoll() {
  tone(180, 0.06, 'sawtooth', 0.18, 0)
  tone(160, 0.06, 'sawtooth', 0.18, 0.06)
  tone(140, 0.08, 'sawtooth', 0.18, 0.12)
}

// Satisfying click when holding a die
export function playHold() {
  tone(300, 0.05, 'sine', 0.25, 0)
  tone(220, 0.1,  'sine', 0.15, 0.04)
}

// Ascending chime — round / game starts
export function playRoundStart() {
  tone(440, 0.18, 'sine', 0.25, 0)
  tone(550, 0.25, 'sine', 0.25, 0.18)
}

// Descending resolution — showdown
export function playRoundEnd() {
  tone(550, 0.18, 'sine', 0.25, 0)
  tone(440, 0.25, 'sine', 0.25, 0.18)
}

// Victory fanfare — game over
export function playGameEnd() {
  tone(440, 0.12, 'sine', 0.28, 0)
  tone(550, 0.12, 'sine', 0.28, 0.13)
  tone(660, 0.12, 'sine', 0.28, 0.26)
  tone(880, 0.4,  'sine', 0.32, 0.39)
}
