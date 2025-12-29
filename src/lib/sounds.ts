import { Howl, Howler } from 'howler';

type SoundName = 'vote' | 'submit' | 'reveal' | 'reaction' | 'countdown';

const sounds: Partial<Record<SoundName, Howl>> = {};
let soundsLoaded = false;

export const loadSounds = (): void => {
  // Skip loading if already loaded or if sounds fail to load
  if (soundsLoaded) return;

  try {
    const soundConfig: Record<SoundName, { src: string; volume: number }> = {
      vote: { src: '/sounds/vote.mp3', volume: 0.5 },
      submit: { src: '/sounds/submit.mp3', volume: 0.5 },
      reveal: { src: '/sounds/reveal.mp3', volume: 0.7 },
      reaction: { src: '/sounds/reaction.mp3', volume: 0.3 },
      countdown: { src: '/sounds/countdown.mp3', volume: 0.6 },
    };

    (Object.keys(soundConfig) as SoundName[]).forEach((name) => {
      const config = soundConfig[name];
      sounds[name] = new Howl({
        src: [config.src],
        volume: config.volume,
        onloaderror: () => {
          // Silently ignore missing sound files
          delete sounds[name];
        },
      });
    });

    soundsLoaded = true;
  } catch {
    // Silently fail if Howler isn't available
  }
};

export const playSound = (name: SoundName): void => {
  try {
    if (sounds[name]) {
      sounds[name].play();
    }
  } catch {
    // Silently ignore playback errors
  }
};

export const setMuted = (muted: boolean): void => {
  try {
    Howler.mute(muted);
  } catch {
    // Silently ignore mute errors
  }
};
