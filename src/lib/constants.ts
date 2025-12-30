export const COOLDOWNS = {
  HOT_TAKE_SUBMIT: 5 * 60 * 1000, // 5 minutes cooldown
  TWO_TRUTHS_SUBMIT: 5 * 60 * 1000, // 5 minutes cooldown after reveal
  TWO_TRUTHS_REVEAL: 5 * 60 * 1000, // 5 minutes to reveal
} as const;

export const REACTION_EMOJIS = ['🔥', '💀', '📠', '🤡', '💯', '😂', '🙄', '👀'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
