import type {
  Difficulty,
  GameConfig,
  GameItem,
  GameEvent,
  GameResult,
  WordSource,
} from "../../typing-core/src/index.js";
export type TypingSource =
  | { kind: "lesson"; lesson_id: string }
  | { kind: "personal_cards"; topic_id?: string }
  | { kind: "retry_missed"; session_id: string };
export type TypingSnapshot = {
  title: string;
  items: WordSource[];
  count: number;
  invalid: number;
  duplicates: number;
};
export type TypingStart = {
  source: TypingSource;
  difficulty: Difficulty;
  limit: number;
};
export type TypingFinish = {
  manifest_hash: string;
  events: GameEvent[];
  final_tick: number;
};
export type TypingSession = {
  id: string;
  user_id: string;
  source: TypingSource;
  title: string;
  status: "in_progress" | "completed" | "abandoned" | "expired";
  created_at: string;
  expires_at: string;
  finished_at: string | null;
  config: GameConfig;
  manifest_hash: string;
  result: GameResult | null;
  items: GameItem[];
};
export type TypingSourceList = {
  items: {
    id: string;
    title: string;
    course_title: string;
    topic_title: string;
    count: number;
    invalid: number;
    duplicates: number;
  }[];
  page: number;
  has_more: boolean;
  enabled: boolean;
};
