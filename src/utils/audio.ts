/**
 * Web Audio API MythOS Tactical Sound Engine
 * Synthesizes tactile button clicks, telemetry chimes, and alert tones.
 */

class LcarSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playBeep(freq = 880, type: OscillatorType = 'sine', duration = 0.08, gainVal = 0.08) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay restrictions or context error
    }
  }

  public playChime() {
    if (!this.enabled) return;
    this.playBeep(1046.5, 'sine', 0.06, 0.06); // C6
    setTimeout(() => this.playBeep(1318.5, 'sine', 0.08, 0.06), 40); // E6
  }

  public playAlert() {
    if (!this.enabled) return;
    this.playBeep(440, 'triangle', 0.15, 0.1);
    setTimeout(() => this.playBeep(880, 'triangle', 0.15, 0.1), 120);
  }

  public playWarning() {
    if (!this.enabled) return;
    this.playBeep(329.63, 'sawtooth', 0.12, 0.08); // E4
  }

  public playToggle() {
    if (!this.enabled) return;
    this.playBeep(783.99, 'sine', 0.05, 0.05); // G5
  }

  public isMuted(): boolean {
    return !this.enabled;
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    return !this.enabled;
  }
}

export const soundEngine = new LcarSoundEngine();
