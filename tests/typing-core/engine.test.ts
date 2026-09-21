import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceToTick,
  applyInput,
  configuration,
  createGame,
  eligibleWord,
  fallTicks,
  getResult,
  normalizeWord,
  replay,
  selectWords,
  type GameEvent,
  type GameItem,
  type GameState,
} from "../../packages/typing-core/src/index.js";

const words = [
  "apple",
  "apricot",
  "cloud",
  "don't",
  "operating system",
  "well-known",
  "flower",
  "garden",
  "learn",
  "planet",
  "rocket",
  "sprout",
];
function manifest(names = words): GameItem[] {
  return names.map((word, n) => ({
    id: `word-${n}`,
    source_kind: "personal_cards",
    source_item_id: `source-${n}`,
    word,
    meaning: word,
    example: "",
    answer: normalizeWord(word),
    wave: Math.floor(n / 10) + 1,
    lane: n % 3,
    position: n + 1,
    fall_ticks: fallTicks("easy", Math.floor(n / 10) + 1, word.length),
  }));
}
function player(s: GameState) {
  const events: GameEvent[] = [];
  return {
    events,
    type(value: string) {
      for (const char of value) {
        const event: GameEvent = {
          seq: events.length + 1,
          tick: s.tick,
          type: "char",
          value: char,
        };
        applyInput(s, event);
        events.push(event);
      }
    },
    action(type: "unlock" | "backspace") {
      const event: GameEvent = { seq: events.length + 1, tick: s.tick, type };
      applyInput(s, event);
      events.push(event);
    },
  };
}
test("normalization is conservative, filters unsupported words and removes duplicates", () => {
  assert.equal(normalizeWord("  DON’T   stop  "), "don't stop");
  for (const value of ["hello", "mother-in-law", "don't", "operating system"])
    assert.equal(eligibleWord(value), true, value);
  for (const value of [
    "a",
    "C++",
    "hello!",
    "2026",
    "café",
    "a--b",
    "x".repeat(41),
  ])
    assert.equal(eligibleWord(value), false, value);
  const selected = selectWords([
    { word: "Hello" },
    { word: " HELLO " },
    { word: "c++" },
    { word: "world" },
  ]);
  assert.equal(selected.count, 2);
  assert.equal(selected.invalid, 1);
  assert.equal(selected.duplicates, 1);
});
test("nearest deadline wins matching prefix; a wrong key does not change the buffer", () => {
  const s = createGame(manifest(), configuration("easy")),
    p = player(s);
  advanceToTick(s, 150);
  p.type("ax");
  assert.equal(s.locked, 0);
  assert.equal(s.buffer, "a");
  assert.equal(s.typed_keys, 2);
  assert.equal(s.correct_keys, 1);
  p.type("pple");
  assert.equal(s.destroyed.length, 1);
  assert.equal(s.score, 50);
  assert.equal(s.combo, 1);
  p.type("apricot");
  assert.equal(s.destroyed.length, 2);
  assert.equal(s.score, 125);
});
test("backspace/unlock never erase previous errors or grant points", () => {
  const s = createGame(manifest(), configuration("easy")),
    p = player(s);
  p.type("ax");
  p.action("backspace");
  assert.equal(s.locked, null);
  p.type("ap");
  p.action("unlock");
  assert.equal(s.score, 0);
  assert.equal(s.buffer, "");
  assert.equal(s.typed_keys, 4);
  p.type("apple");
  assert.equal(s.score, 50);
  assert.equal(s.correct_keys, 8);
  assert.equal(s.typed_keys, 9);
});
test("a missed locked word loses one life, clears lock and resets combo", () => {
  const s = createGame(manifest(), configuration("easy")),
    p = player(s);
  p.type("ap");
  advanceToTick(s, 700);
  assert.equal(s.lives, 2);
  assert.equal(s.locked, null);
  assert.deepEqual(s.missed, ["word-0"]);
  advanceToTick(s, 701);
  assert.equal(s.lives, 2);
});
test("deadline is resolved before a keystroke at the same tick", () => {
  const s = createGame(manifest(["apple"]), configuration("easy")),
    p = player(s);
  p.type("appl");
  assert.throws(
    () => applyInput(s, { seq: 5, tick: 700, type: "char", value: "e" }),
    /INPUT_AFTER_FINISH/,
  );
  assert.equal(s.score, 0);
  assert.deepEqual(s.missed, ["word-0"]);
});
test("spaces and punctuation must be typed; completion moves to the next wave", () => {
  const s = createGame(manifest(), configuration("easy")),
    p = player(s);
  while (!s.outcome) {
    if (s.active.length) {
      const item = s.items[s.active[0]!.index]!;
      p.type(item.answer);
    } else advanceToTick(s, s.tick + 1);
  }
  const result = getResult(s);
  assert.equal(result.outcome, "won");
  assert.equal(result.total, 12);
  assert.equal(result.destroyed_ids.length, 12);
  assert.equal(result.accuracy, 100);
  assert.equal(s.wave, 2);
  assert.ok(s.active_ticks < s.tick);
  assert.deepEqual(replay(s.items, s.config, p.events, s.tick), result);
});
test("losing ends immediately with exactly three misses; unseen words are not mistakes", () => {
  const s = createGame(manifest(), configuration("easy"));
  advanceToTick(s, 30000);
  const result = getResult(s);
  assert.equal(result.outcome, "lost");
  assert.equal(s.lives, 0);
  assert.equal(result.missed_ids.length, 3);
  assert.equal(result.accuracy, null);
  assert.ok(result.unseen_ids.length > 0);
  assert.equal(
    result.missed_ids.length +
      result.unseen_ids.length +
      result.unfinished_ids.length,
    12,
  );
  assert.deepEqual(replay(s.items, s.config, [], s.tick), result);
});
test("frame cadence does not change simulation or replay results", () => {
  const items = manifest(),
    cfg = configuration("hard");
  const a = createGame(items, cfg),
    b = createGame(items, cfg);
  advanceToTick(a, 1000);
  while (!b.outcome && b.tick < 1000)
    advanceToTick(b, Math.min(1000, b.tick + 7));
  assert.deepEqual(a, b);
});
test("malformed logs, non-terminal submissions, ordering and excessive time are rejected", () => {
  const items = manifest(),
    cfg = configuration("easy");
  assert.throws(() => replay(items, cfg, [], 1), /INVALID_FINAL_TICK/);
  assert.throws(
    () =>
      replay(items, cfg, [{ seq: 2, tick: 0, type: "char", value: "a" }], 1000),
    /INVALID_EVENT_SEQUENCE/,
  );
  assert.throws(
    () =>
      replay(
        items,
        cfg,
        [
          { seq: 1, tick: 4, type: "char", value: "a" },
          { seq: 2, tick: 3, type: "char", value: "p" },
        ],
        1000,
      ),
    /INVALID_TICK/,
  );
  assert.throws(() => replay(items, cfg, [], 30001), /INVALID_GAME_LOG/);
  assert.throws(() => replay(items, cfg, [], 30000), /INVALID_FINAL_TICK/);
});
test("long phrases have more time, difficulty is bounded, simultaneous expiry cannot underflow lives", () => {
  assert.ok(fallTicks("easy", 1, 30) > fallTicks("easy", 1, 5));
  assert.ok(fallTicks("hard", 30, 5) >= 250);
  const s = createGame(manifest(), configuration("hard"));
  advanceToTick(s, 200);
  for (const t of s.active) t.deadline = 201;
  s.lives = 2;
  advanceToTick(s, 201);
  assert.equal(s.outcome, "lost");
  assert.equal(s.lives, 0);
  assert.equal(s.missed.length, 2);
});
