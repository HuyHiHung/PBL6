/** Deterministic, environment-independent rules shared by web and server. */
export const RULES_VERSION = 1;
export const TICK_MS = 20;
export const MAX_TICKS = 30_000;
export const MAX_EVENTS = 10_000;
export type Difficulty = "easy" | "normal" | "hard";
export type WordSource = {
  source_kind: "lesson" | "personal_cards";
  source_item_id: string;
  source_lesson_id?: string | null;
  source_revision_id?: string | null;
  word: string;
  meaning: string;
  example: string;
};
export type GameItem = WordSource & {
  id: string;
  position: number;
  wave: number;
  lane: number;
  answer: string;
  fall_ticks: number;
};
export type GameConfig = {
  rules_version: 1;
  normalization_version: 1;
  difficulty: Difficulty;
  lives: 3;
  max_active: number;
  spawn_ticks: number;
  rest_ticks: number;
  max_ticks: number;
};
export type GameEvent = {
  seq: number;
  tick: number;
} & ({ type: "char"; value: string } | { type: "backspace" | "unlock" });
export type Target = { index: number; spawned: number; deadline: number };
export type Outcome = "won" | "lost" | "time_limit";
export type GameState = {
  items: GameItem[];
  config: GameConfig;
  tick: number;
  wave: number;
  next: number;
  next_spawn: number;
  rest_until: number | null;
  active: Target[];
  locked: number | null;
  buffer: string;
  lives: number;
  score: number;
  combo: number;
  max_combo: number;
  typed_keys: number;
  correct_keys: number;
  active_ticks: number;
  completed_chars: number;
  destroyed: string[];
  missed: string[];
  outcome: Outcome | null;
  revision: number;
};
export type GameResult = {
  outcome: Outcome;
  score: number;
  accuracy: number | null;
  wpm: number;
  typed_keys: number;
  correct_keys: number;
  active_ms: number;
  max_combo: number;
  destroyed_ids: string[];
  missed_ids: string[];
  unfinished_ids: string[];
  unseen_ids: string[];
  total: number;
};
export function normalizeWord(value: string) {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
}
export function eligibleWord(value: string) {
  const word = normalizeWord(value);
  return (
    word.length >= 2 &&
    word.length <= 40 &&
    /^[a-z]+(?:[ '-][a-z]+)*$/.test(word)
  );
}
export function selectWords<T extends { word: string }>(words: T[]) {
  const seen = new Set<string>();
  const items: T[] = [];
  let invalid = 0,
    duplicates = 0;
  for (const word of words) {
    const answer = normalizeWord(word.word);
    if (!eligibleWord(answer)) {
      invalid++;
      continue;
    }
    if (seen.has(answer)) {
      duplicates++;
      continue;
    }
    seen.add(answer);
    items.push(word);
  }
  return { items, invalid, duplicates, count: items.length };
}
export function configuration(difficulty: Difficulty): GameConfig {
  const rules = { easy: [3, 150], normal: [4, 120], hard: [6, 90] }[difficulty];
  return {
    rules_version: 1,
    normalization_version: 1,
    difficulty,
    lives: 3,
    max_active: rules[0]!,
    spawn_ticks: rules[1]!,
    rest_ticks: 100,
    max_ticks: MAX_TICKS,
  };
}
export function fallTicks(
  difficulty: Difficulty,
  wave: number,
  length: number,
) {
  const base = { easy: 14000, normal: 11000, hard: 8000 }[difficulty];
  return Math.ceil(
    (Math.max(5000, base * 0.9 ** (wave - 1)) +
      Math.min(4000, Math.max(0, length - 8) * 150)) /
      TICK_MS,
  );
}
export function createGame(items: GameItem[], config: GameConfig): GameState {
  if (
    !items.length ||
    items.length > 30 ||
    config.rules_version !== RULES_VERSION
  )
    throw new Error("INVALID_MANIFEST");
  const state: GameState = {
    items,
    config,
    tick: 0,
    wave: 1,
    next: 0,
    next_spawn: 0,
    rest_until: null,
    active: [],
    locked: null,
    buffer: "",
    lives: config.lives,
    score: 0,
    combo: 0,
    max_combo: 0,
    typed_keys: 0,
    correct_keys: 0,
    active_ticks: 0,
    completed_chars: 0,
    destroyed: [],
    missed: [],
    outcome: null,
    revision: 0,
  };
  settle(state);
  return state;
}
function unlock(s: GameState) {
  s.locked = null;
  s.buffer = "";
}
function settle(s: GameState) {
  for (const target of [...s.active].sort(
    (a, b) => a.deadline - b.deadline || a.index - b.index,
  )) {
    if (target.deadline > s.tick) continue;
    s.active = s.active.filter((t) => t.index !== target.index);
    s.missed.push(s.items[target.index]!.id);
    s.lives--;
    s.combo = 0;
    s.revision++;
    if (s.locked === target.index) unlock(s);
    if (s.lives === 0) {
      s.outcome = "lost";
      return;
    }
  }
  if (s.rest_until !== null) {
    if (s.tick < s.rest_until) return;
    s.rest_until = null;
    s.wave++;
    s.next_spawn = s.tick;
    s.revision++;
  }
  const item = s.items[s.next];
  if (!s.active.length && (!item || item.wave > s.wave)) {
    if (!item) {
      s.outcome = "won";
      s.revision++;
      return;
    }
    s.rest_until = s.tick + s.config.rest_ticks;
    s.revision++;
    return;
  }
  if (
    s.tick >= s.next_spawn &&
    item?.wave === s.wave &&
    s.active.length < s.config.max_active
  ) {
    s.active.push({
      index: s.next++,
      spawned: s.tick,
      deadline: s.tick + item.fall_ticks,
    });
    s.next_spawn =
      s.tick +
      Math.max(50, Math.ceil(s.config.spawn_ticks * 0.9 ** (s.wave - 1)));
    s.revision++;
  }
}
export function advanceToTick(s: GameState, target: number) {
  if (
    !Number.isSafeInteger(target) ||
    target < s.tick ||
    target > s.config.max_ticks
  )
    throw new Error("INVALID_TICK");
  while (s.tick < target && !s.outcome) {
    if (s.rest_until === null) s.active_ticks++;
    s.tick++;
    settle(s);
    if (!s.outcome && s.tick === s.config.max_ticks) {
      s.outcome = "time_limit";
      s.revision++;
    }
  }
  return s;
}
export function applyInput(s: GameState, event: GameEvent) {
  advanceToTick(s, event.tick);
  if (s.outcome) throw new Error("INPUT_AFTER_FINISH");
  s.revision++;
  if (event.type === "unlock") {
    unlock(s);
    return;
  }
  if (event.type === "backspace") {
    s.buffer = s.buffer.slice(0, -1);
    if (!s.buffer) unlock(s);
    return;
  }
  if (event.type !== "char") throw new Error("INVALID_EVENT");
  if (!/^[a-z '-]$/.test(event.value)) throw new Error("INVALID_CHAR");
  s.typed_keys++;
  if (s.locked === null) {
    const target = [...s.active]
      .sort((a, b) => a.deadline - b.deadline || a.index - b.index)
      .find((t) => s.items[t.index]!.answer.startsWith(event.value));
    if (target) s.locked = target.index;
  }
  const item = s.locked === null ? null : s.items[s.locked]!;
  if (!item || item.answer[s.buffer.length] !== event.value) {
    s.combo = 0;
    return;
  }
  s.correct_keys++;
  s.buffer += event.value;
  if (s.buffer !== item.answer) return;
  s.score += 10 * item.answer.length + 5 * Math.min(s.combo, 10);
  s.combo++;
  s.max_combo = Math.max(s.combo, s.max_combo);
  s.completed_chars += item.answer.length;
  s.destroyed.push(item.id);
  s.active = s.active.filter((t) => t.index !== s.locked);
  unlock(s);
  // Completion transitions at the same tick on client and during replay.
  if (
    !s.active.length &&
    (!s.items[s.next] || s.items[s.next]!.wave > s.wave)
  ) {
    if (!s.items[s.next]) s.outcome = "won";
    else s.rest_until = s.tick + s.config.rest_ticks;
  }
}
export function getResult(s: GameState): GameResult {
  if (!s.outcome) throw new Error("GAME_NOT_FINISHED");
  return {
    outcome: s.outcome,
    score: s.score,
    accuracy: s.typed_keys
      ? Math.round((s.correct_keys / s.typed_keys) * 1000) / 10
      : null,
    wpm: s.active_ticks
      ? Math.round(
          (s.completed_chars / 5 / ((s.active_ticks * TICK_MS) / 60000)) * 10,
        ) / 10
      : 0,
    typed_keys: s.typed_keys,
    correct_keys: s.correct_keys,
    active_ms: s.active_ticks * TICK_MS,
    max_combo: s.max_combo,
    destroyed_ids: [...s.destroyed],
    missed_ids: [...s.missed],
    unfinished_ids: s.active.map((t) => s.items[t.index]!.id),
    unseen_ids: s.items.slice(s.next).map((i) => i.id),
    total: s.items.length,
  };
}
export function replay(
  items: GameItem[],
  config: GameConfig,
  events: GameEvent[],
  finalTick: number,
) {
  if (
    events.length > MAX_EVENTS ||
    !Number.isSafeInteger(finalTick) ||
    finalTick < 0 ||
    finalTick > config.max_ticks
  )
    throw new Error("INVALID_GAME_LOG");
  const state = createGame(items, config);
  for (const [i, event] of events.entries()) {
    if (event.seq !== i + 1 || event.tick > finalTick)
      throw new Error("INVALID_EVENT_SEQUENCE");
    applyInput(state, event);
  }
  advanceToTick(state, finalTick);
  if (!state.outcome || state.tick !== finalTick)
    throw new Error("INVALID_FINAL_TICK");
  return getResult(state);
}
