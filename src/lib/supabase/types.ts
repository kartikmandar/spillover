export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          display_name: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          display_name: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          display_name?: string;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      hot_takes: {
        Row: {
          id: string;
          user_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      hot_take_votes: {
        Row: {
          id: string;
          hot_take_id: string;
          user_id: string;
          vote: 'agree' | 'disagree';
          created_at: string;
        };
        Insert: {
          id?: string;
          hot_take_id: string;
          user_id: string;
          vote: 'agree' | 'disagree';
          created_at?: string;
        };
        Update: {
          id?: string;
          hot_take_id?: string;
          user_id?: string;
          vote?: 'agree' | 'disagree';
          created_at?: string;
        };
      };
      hot_take_reactions: {
        Row: {
          id: string;
          hot_take_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hot_take_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hot_take_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
      two_truths_submissions: {
        Row: {
          id: string;
          user_id: string;
          statement_1: string;
          statement_2: string;
          statement_3: string;
          lie_index: number;
          is_revealed: boolean;
          reveal_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          statement_1: string;
          statement_2: string;
          statement_3: string;
          lie_index: number;
          is_revealed?: boolean;
          reveal_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          statement_1?: string;
          statement_2?: string;
          statement_3?: string;
          lie_index?: number;
          is_revealed?: boolean;
          reveal_at?: string;
          created_at?: string;
        };
      };
      two_truths_guesses: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string;
          guessed_lie_index: number;
          is_correct: boolean | null;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          user_id: string;
          guessed_lie_index: number;
          is_correct?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          user_id?: string;
          guessed_lie_index?: number;
          is_correct?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
      };
      two_truths_reactions: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
    };
  };
}
