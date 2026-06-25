let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // Standard audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Low E, A, D, G, B, High E standard frequencies
const STANDARD_STRING_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

export function playChordStrum(frets: (number | 'x')[], capo: number = 0) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create a master volume control
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(ctx.destination);
    
    let playCount = 0;
    
    // Strum from low string to high string
    // Delay each string by 45ms to simulate a natural strum
    frets.forEach((fret, stringIdx) => {
      if (fret === 'x') return;
      
      const parsedFret = Number(fret);
      if (isNaN(parsedFret)) return;
      
      const delay = playCount * 0.045; // 45ms delay per string
      playCount++;
      
      const stringBaseFreq = STANDARD_STRING_FREQS[stringIdx];
      // Formula for frequency with fret and capo: f = base * 2 ^ ((fret + capo) / 12)
      const frequency = stringBaseFreq * Math.pow(2, (parsedFret + capo) / 12);
      
      // Plucked string synthesis
      const oscTriangle = ctx.createOscillator();
      const oscSine = ctx.createOscillator();
      const stringGain = ctx.createGain();
      
      oscTriangle.type = 'triangle';
      oscSine.type = 'sine';
      
      oscTriangle.frequency.setValueAtTime(frequency, now + delay);
      oscSine.frequency.setValueAtTime(frequency * 2, now + delay); // First overtone
      
      // ADSR-like pluck envelope
      stringGain.gain.setValueAtTime(0, now + delay);
      // Fast attack
      stringGain.gain.linearRampToValueAtTime(0.6, now + delay + 0.008);
      // Decay to near zero
      stringGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.2);
      // Stop completely
      stringGain.gain.setValueAtTime(0, now + delay + 1.25);
      
      // Connect components
      oscTriangle.connect(stringGain);
      oscSine.connect(stringGain);
      
      // Let's damp high overtones slightly as they decay
      const biquad = ctx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(frequency * 5, now + delay);
      biquad.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + delay + 0.6);
      
      stringGain.connect(biquad);
      biquad.connect(masterGain);
      
      // Start and stop oscillators
      oscTriangle.start(now + delay);
      oscSine.start(now + delay);
      
      oscTriangle.stop(now + delay + 1.3);
      oscSine.stop(now + delay + 1.3);
    });
  } catch (err) {
    console.error("Web Audio API failed to play chord:", err);
  }
}
