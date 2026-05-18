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
    }
  }

  public setVolume(value: number): void {
    this.mainGain.gain.value = value;
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
  }
}
