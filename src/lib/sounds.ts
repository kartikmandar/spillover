import { Howl, Howler } from 'howler';

type SoundName = 'vote' | 'submit' | 'reveal' | 'reaction' | 'countdown';

const sounds: Partial<Record<SoundName, Howl>> = {};

export const loadSounds = (): void => {
  sounds.vote = new Howl({ src: ['/sounds/vote.mp3'], volume: 0.5 });
  sounds.submit = new Howl({ src: ['/sounds/submit.mp3'], volume: 0.5 });
  sounds.reveal = new Howl({ src: ['/sounds/reveal.mp3'], volume: 0.7 });
  sounds.reaction = new Howl({ src: ['/sounds/reaction.mp3'], volume: 0.3 });
  sounds.countdown = new Howl({ src: ['/sounds/countdown.mp3'], volume: 0.6 });
};

export const playSound = (name: SoundName): void => {
  if (sounds[name]) {
    sounds[name].play();
  }
};

export const setMuted = (muted: boolean): void => {
  Howler.mute(muted);
};
