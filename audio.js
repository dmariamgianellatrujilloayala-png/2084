// ===========================
// SISTEMA DE AUDIO - 2084
// ===========================

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.masterGain = null;
        
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.isMuted = false;
        
        this.currentMusic = null;
        this.musicOscillators = [];
        
        this.init();
    }

    init() {
        // Crear contexto de audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Crear nodos de ganancia
        this.masterGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();
        
        // Conectar nodos
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
        
        // Configurar volúmenes iniciales
        this.musicGain.gain.value = this.musicVolume;
        this.sfxGain.gain.value = this.sfxVolume;
        this.masterGain.gain.value = 1;
        
        console.log('🎵 Sistema de audio inicializado');
    }

    // ===========================
    // MÚSICA DE FONDO
    // ===========================

    playBackgroundMusic() {
        this.stopMusic();
        
        // Crear música ambiente distópica
        const now = this.audioContext.currentTime;
        
        // Bajo profundo (drone)
        const bass = this.audioContext.createOscillator();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(55, now); // A1
        
        const bassGain = this.audioContext.createGain();
        bassGain.gain.setValueAtTime(0.3, now);
        
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        bass.start(now);
        
        // Pad atmosférico
        const pad = this.audioContext.createOscillator();
        pad.type = 'triangle';
        pad.frequency.setValueAtTime(220, now); // A3
        
        const padGain = this.audioContext.createGain();
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.15, now + 2);
        
        const padFilter = this.audioContext.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(800, now);
        
        pad.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);
        pad.start(now);
        
        // Ruido blanco (ambiente)
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(300, now);
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.05, now);
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.musicGain);
        whiteNoise.start(now);
        
        // Pulso rítmico (heartbeat)
        const pulse = this.audioContext.createOscillator();
        pulse.type = 'sine';
        pulse.frequency.setValueAtTime(110, now); // A2
        
        const pulseGain = this.audioContext.createGain();
        pulseGain.gain.setValueAtTime(0, now);
        
        // Crear patrón de pulso
        for (let i = 0; i < 100; i++) {
            const time = now + i * 2;
            pulseGain.gain.setValueAtTime(0, time);
            pulseGain.gain.linearRampToValueAtTime(0.2, time + 0.1);
            pulseGain.gain.linearRampToValueAtTime(0, time + 0.3);
        }
        
        pulse.connect(pulseGain);
        pulseGain.connect(this.musicGain);
        pulse.start(now);
        
        // Guardar osciladores
        this.musicOscillators = [bass, pad, whiteNoise, pulse];
        
        console.log('🎵 Música de fondo iniciada');
    }

    stopMusic() {
        if (this.musicOscillators.length > 0) {
            this.musicOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Ignorar errores si ya está detenido
                }
            });
            this.musicOscillators = [];
        }
    }

    // ===========================
    // EFECTOS DE SONIDO
    // ===========================

    playSound(type) {
        const now = this.audioContext.currentTime;
        
        switch(type) {
            case 'interact':
                this.playSoundInteract(now);
                break;
            case 'unlock':
                this.playSoundUnlock(now);
                break;
            case 'drone':
                this.playSoundDrone(now);
                break;
            case 'notification':
                this.playSoundNotification(now);
                break;
            case 'dialogue':
                this.playSoundDialogue(now);
                break;
            case 'mission':
                this.playSoundMission(now);
                break;
            case 'victory':
                this.playSoundVictory(now);
                break;
            case 'error':
                this.playSoundError(now);
                break;
            default:
                console.warn(`Sonido desconocido: ${type}`);
        }
    }

    playSoundInteract(now) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playSoundUnlock(now) {
        // Sonido de desbloqueo (ascendente)
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            const freq = 400 + (i * 200);
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        }
    }

    playSoundDrone(now) {
        // Sonido de alerta de dron
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        osc.frequency.linearRampToValueAtTime(600, now + 0.2);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playSoundNotification(now) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, now);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playSoundDialogue(now) {
        // Sonido de diálogo (blip)
        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playSoundMission(now) {
        // Sonido épico de misión
        const frequencies = [262, 330, 392, 523]; // C, E, G, C (acorde mayor)
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.15, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.3);
        });
    }

    playSoundVictory(now) {
        // Sonido de victoria (fanfarria)
        const melody = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.2);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.3, now + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.5);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.5);
        });
    }

    playSoundError(now) {
        // Sonido de error (descendente)
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // ===========================
    // CONTROLES
    // ===========================

    setMusicVolume(volume) {
        this.musicVolume = volume;
        this.musicGain.gain.value = volume;
    }

    setSFXVolume(volume) {
        this.sfxVolume = volume;
        this.sfxGain.gain.value = volume;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.value = this.isMuted ? 0 : 1;
        return this.isMuted;
    }

    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Exportar instancia global
const audioSystem = new AudioSystem();
