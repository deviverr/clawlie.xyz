import { EventManager } from './EventManager';

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext;
  private mainGain: GainNode;
  private bgmGain: GainNode;
  private sfxGain: GainNode;

  private isMuted: boolean = false;

  private constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.mainGain = this.audioContext.createGain();
    this.bgmGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    this.bgmGain.connect(this.mainGain);
    this.sfxGain.connect(this.mainGain);
    this.mainGain.connect(this.audioContext.destination);

    this.setupListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupListeners(): void {
     const events = EventManager.getInstance();
     events.on('CROP_PLANTED', () => this.playSound('plant'));
     events.on('CROP_HARVESTED', () => this.playSound('harvest'));
     events.on('MONEY_CHANGED', (amount: number) => { if (amount > 0) this.playSound('coins'); });
     events.on('FISHING_CAST', () => this.playSound('splash'));
     events.on('FISHING_BITE', () => this.playSound('bite'));
     events.on('FISHING_CAUGHT', () => this.playSound('success'));
  }

  private currentBgmOsc: OscillatorNode | null = null;
  private currentBgmGain: GainNode | null = null;

  public async playMusic(): Promise<void> {
      if (this.isMuted) return;
      if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
      }
      
      if (this.currentBgmOsc) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.bgmGain);
      
      this.bgmGain.gain.value = 0.05; 
      osc.start();

      let noteIndex = 0;
      // Improved melody: C Major with variations
      const melody = [
          { freq: 261.63, dur: 500 }, { freq: 329.63, dur: 500 }, { freq: 392.00, dur: 500 }, { freq: 523.25, dur: 500 },
          { freq: 440.00, dur: 500 }, { freq: 349.23, dur: 500 }, { freq: 392.00, dur: 1000 },
          { freq: 261.63, dur: 500 }, { freq: 329.63, dur: 500 }, { freq: 392.00, dur: 500 }, { freq: 440.00, dur: 500 },
          { freq: 392.00, dur: 500 }, { freq: 293.66, dur: 500 }, { freq: 261.63, dur: 1000 }
      ];
      
      const playNextNote = () => {
          if (!this.currentBgmOsc) return;
          const note = melody[noteIndex];
          osc.frequency.setTargetAtTime(note.freq, this.audioContext.currentTime, 0.1);
          noteIndex = (noteIndex + 1) % melody.length;
          setTimeout(playNextNote, note.dur);
      };
      playNextNote();

      this.currentBgmOsc = osc;
      this.currentBgmGain = gain;
  }

  public stopMusic(): void {
      if (this.currentBgmOsc) {
          this.currentBgmOsc.stop();
          this.currentBgmOsc.disconnect();
          this.currentBgmOsc = null;
      }
      if (this.currentBgmGain) {
          this.currentBgmGain.disconnect();
          this.currentBgmGain = null;
      }
  }

  public async playSound(type: string): Promise<void> {
    if (this.isMuted) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Mock sound generation since we don't have files
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);

    if (type === 'plant') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'harvest') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'coins') {
       osc.type = 'sine';
       osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
       osc.frequency.setValueAtTime(1500, this.audioContext.currentTime + 0.05);
       gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
       osc.start();
       osc.stop(this.audioContext.currentTime + 0.2);
    } else if (type === 'splash') {
       osc.type = 'noise' as any; // Noise approximation
       osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
       gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
       osc.start();
       osc.stop(this.audioContext.currentTime + 0.3);
    } else if (type === 'bite') {
       osc.type = 'sine';
       osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
       osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.05);
       gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
       osc.start();
       osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'success') {
       osc.type = 'sine';
       osc.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
       osc.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
       osc.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
       gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
       osc.start();
       osc.stop(this.audioContext.currentTime + 0.4);
    }
  }

  public setVolume(value: number): void {
    this.mainGain.gain.value = value;
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
        this.stopMusic();
    } else {
        this.playMusic();
    }
  }
}
