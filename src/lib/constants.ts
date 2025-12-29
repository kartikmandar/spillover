export const COOLDOWNS = {
  HOT_TAKE_SUBMIT: 15 * 60 * 1000, // 15 minutes in ms
  TWO_TRUTHS_SUBMIT: 15 * 60 * 1000,
  TWO_TRUTHS_REVEAL: 30 * 60 * 1000, // 30 minutes
} as const;

export const REACTION_EMOJIS = ['🔥', '💀', '📠', '🤡', '💯', '😂', '🙄', '👀'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
