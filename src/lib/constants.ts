export const COOLDOWNS = {
  HOT_TAKE_SUBMIT: 10 * 60 * 1000, // 10 minutes in ms
  TWO_TRUTHS_SUBMIT: 5 * 60 * 1000, // 5 minutes after reveal
  TWO_TRUTHS_REVEAL: 10 * 60 * 1000, // 10 minutes to reveal
} as const;

export const REACTION_EMOJIS = ['🔥', '💀', '📠', '🤡', '💯', '😂', '🙄', '👀'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
