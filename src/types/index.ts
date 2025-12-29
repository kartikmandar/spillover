export interface Profile {
  id: string;
  phone: string;
  display_name: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface HotTake {
  id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  votes?: HotTakeVote[];
  reactions?: HotTakeReaction[];
}

export interface HotTakeVote {
  id: string;
  hot_take_id: string;
  user_id: string;
  vote: 'agree' | 'disagree';
  created_at: string;
}

export interface HotTakeReaction {
  id: string;
  hot_take_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TwoTruthsSubmission {
  id: string;
  user_id: string;
  statement_1: string;
  statement_2: string;
  statement_3: string;
  lie_index: 1 | 2 | 3;
  is_revealed: boolean;
  reveal_at: string;
  created_at: string;
  profile?: Pick<Profile, 'display_name'>;
  guesses?: TwoTruthsGuess[];
  reactions?: TwoTruthsReaction[];
}

export interface TwoTruthsGuess {
  id: string;
  submission_id: string;
  user_id: string;
  guessed_lie_index: 1 | 2 | 3;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
}

export interface TwoTruthsReaction {
  id: string;
  submission_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}
