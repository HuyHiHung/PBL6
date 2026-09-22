import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Keyboard,
  Pause,
  Play,
  Sprout,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ApiError, go } from "../../api";
import { Notice } from "../../ui";
import { useUnsaved } from "../../navigation";
import {
  advanceToTick,
  applyInput,
  createGame,
  getResult,
  MAX_EVENTS,
  TICK_MS,
  type GameEvent,
  type GameState,
} from "../../../../../packages/typing-core/src/index";
import type { TypingSession } from "../../../../../packages/api-client/src/typing";
import {
  deletePending,
  gameApi,
  savePending,
  type PendingResult,
} from "./client";
import { Result, difficultyLabel } from "./result";
import { WORD_MEANING_DISPLAY_SECONDS } from "./config";

type CompletedWord = {
  id: string;
  answer: string;
  meaning: string;
  lane: number;
  top: number;
};

type Phase =
  | "ready"
  | "interrupted"
  | "countdown"
  | "playing"
  | "paused"
  | "finished"
  | "saved";
function view(state: GameState) {
  return { ...state, active: [...state.active] };
}
export function PlayGame({
  user,
  session,
  pending,
  fresh,
}: {
  user: string;
  session: TypingSession;
  pending?: PendingResult;
  fresh: boolean;
}) {
  const game = useRef(createGame(session.items, session.config));
  const events = useRef<GameEvent[]>([]),
    pendingRef = useRef(pending);
  const phaseRef = useRef<Phase>(
    session.result
      ? "saved"
      : pending
        ? "finished"
        : fresh
          ? "ready"
          : "interrupted",
  );
  const [phase, setPhase] = useState(phaseRef.current),
    [ui, setUi] = useState(() => view(game.current));
  const [saved, setSaved] = useState<TypingSession | null>(
    session.result ? session : null,
  );
  const [error, setError] = useState(""),
    [warning, setWarning] = useState(""),
    [saving, setSaving] = useState(false),
    [discarding, setDiscarding] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [completedWords, setCompletedWords] = useState<CompletedWord[]>([]);
  const meaningTimers = useRef(new Set<number>());
  const abandonKey = useRef(crypto.randomUUID());
  const [countdown, setCountdown] = useState(3),
    [sound, setSound] = useState(false),
    [lease, setLease] = useState<"waiting" | "owned" | "blocked">("waiting");
  const alive = useRef(true),
    sending = useRef(false),
    stage = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, HTMLDivElement>()),
    audio = useRef<AudioContext | null>(null),
    soundRef = useRef(false);
  const clock = useRef({ last: 0, remainder: 0, countdown: 3000 });
  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const dirty =
    !saved &&
    (["playing", "paused", "countdown"].includes(phase) ||
      !!pendingRef.current);
  useUnsaved(dirty && !discarding);
  const sync = () => setUi(view(game.current));
  function beep(wrong = false) {
    if (!soundRef.current || !audio.current) return;
    try {
      const osc = audio.current.createOscillator(),
        gain = audio.current.createGain();
      osc.type = "sine";
      osc.frequency.value = wrong ? 180 : 660;
      gain.gain.setValueAtTime(0.035, audio.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.current.currentTime + 0.1,
      );
      osc.connect(gain);
      gain.connect(audio.current.destination);
      osc.start();
      osc.stop(audio.current.currentTime + 0.12);
    } catch {
      /* Sound is optional. */
    }
  }
  async function send(item: PendingResult) {
    if (sending.current || !alive.current) return;
    sending.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await gameApi<TypingSession>(
        user,
        `/v1/typing-sessions/${session.id}/finish`,
        "POST",
        item.payload,
        item.key,
      );
      if (!alive.current) return;
      await deletePending(session.id).catch(() => {});
      pendingRef.current = undefined;
      setSaved(result);
      changePhase("saved");
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof ApiError && e.code === "SESSION_ALREADY_FINISHED") {
        const current = await gameApi<TypingSession>(
          user,
          `/v1/typing-sessions/${session.id}`,
        ).catch(() => null);
        if (current?.result && alive.current) {
          await deletePending(session.id).catch(() => {});
          pendingRef.current = undefined;
          setSaved(current);
          changePhase("saved");
        } else setError((e as Error).message);
      } else setError((e as Error).message);
    } finally {
      sending.current = false;
      if (alive.current) setSaving(false);
    }
  }
  async function finish() {
    changePhase("finished");
    sync();
    const item: PendingResult = {
      id: session.id,
      user,
      key: crypto.randomUUID(),
      payload: {
        manifest_hash: session.manifest_hash,
        final_tick: game.current.tick,
        events: [...events.current],
      },
    };
    pendingRef.current = item;
    try {
      await savePending(item);
    } catch {
      if (alive.current)
        setWarning(
          "Bộ nhớ thiết bị không khả dụng. Giữ trang này mở cho đến khi lưu thành công.",
        );
    }
    if (alive.current) await send(item);
  }
  const finishRef = useRef(finish);
  finishRef.current = finish;
  function pause() {
    if (["playing", "countdown"].includes(phaseRef.current)) {
      changePhase("paused");
      clock.current.last = 0;
    }
  }
  useEffect(() => {
    alive.current = true;
    let release: (() => void) | undefined,
      cancelled = false;
    if (navigator.locks) {
      void navigator.locks
        .request(
          `sprout-typing:${user}:${session.id}`,
          { ifAvailable: true },
          async (lock) => {
            if (cancelled) return;
            if (!lock) {
              setLease("blocked");
              return;
            }
            setLease("owned");
            await new Promise<void>((resolve) => {
              release = resolve;
            });
          },
        )
        .catch(() => {
          if (!cancelled) setLease("blocked");
        });
    } else setLease("blocked");
    const hidden = () => {
      if (document.hidden) pause();
    };
    addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      alive.current = false;
      cancelled = true;
      for (const timer of meaningTimers.current) clearTimeout(timer);
      meaningTimers.current.clear();
      release?.();
      removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
      void audio.current?.close().catch(() => {});
    };
  }, [session.id, user]);
  useEffect(() => {
    if (pending && session.status === "in_progress") void send(pending);
  }, []);
  useEffect(() => {
    let frame: number;
    const loop = (now: number) => {
      const timer = clock.current;
      if (phaseRef.current === "countdown" || phaseRef.current === "playing") {
        const dt = timer.last ? now - timer.last : 0;
        timer.last = now;
        if (dt > 500) {
          pause();
        } else if (phaseRef.current === "countdown") {
          timer.countdown -= dt;
          setCountdown(Math.max(1, Math.ceil(timer.countdown / 1000)));
          if (timer.countdown <= 0) {
            changePhase("playing");
            stage.current?.focus();
          }
        } else {
          timer.remainder += dt;
          const ticks = Math.floor(timer.remainder / TICK_MS);
          timer.remainder -= ticks * TICK_MS;
          const s = game.current,
            revision = s.revision,
            lives = s.lives;
          if (ticks)
            advanceToTick(s, Math.min(s.config.max_ticks, s.tick + ticks));
          if (s.lives < lives) beep(true);
          if (s.revision !== revision) sync();
          const floor = (stage.current?.clientHeight ?? 480) - 63;
          for (const target of s.active) {
            const progress =
              (s.tick + timer.remainder / TICK_MS - target.spawned) /
              (target.deadline - target.spawned);
            const node = nodes.current.get(target.index);
            if (node)
              node.style.transform = `translate(-50%, ${Math.max(0, progress) * Math.max(100, floor - node.offsetHeight - 18)}px)`;
          }
          if (s.outcome) void finishRef.current();
        }
      } else timer.last = 0;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  async function begin() {
    if (lease !== "owned") return;
    setError("");
    if (Date.now() >= Date.parse(session.expires_at)) {
      setError("Lượt này đã hết hạn. Hãy quay về chọn bộ từ để chơi lượt mới.");
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
    } catch {
      /* Optional audio. */
    }
    clock.current.last = 0;
    clock.current.countdown = 3000;
    setCountdown(3);
    changePhase("countdown");
    stage.current?.focus();
  }
  function input(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      pause();
      return;
    }
    if (
      phaseRef.current !== "playing" ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (
      event.nativeEvent.isComposing ||
      event.key === "Process" ||
      event.key === "Dead"
    ) {
      setWarning("Hãy chuyển bộ gõ sang English để gõ từ chính xác.");
      return;
    }
    let action: GameEvent;
    const base = { seq: events.current.length + 1, tick: game.current.tick };
    if (event.key === "Tab") action = { ...base, type: "unlock" };
    else if (event.key === "Backspace") action = { ...base, type: "backspace" };
    else if (/^[a-zA-Z '-]$/.test(event.key))
      action = { ...base, type: "char", value: event.key.toLowerCase() };
    else return;
    event.preventDefault();
    if (events.current.length >= MAX_EVENTS) {
      pause();
      setError(
        "Lượt chơi đã đạt giới hạn thao tác. Hãy kết thúc và bắt đầu lượt mới.",
      );
      return;
    }
    const before = game.current.correct_keys;
    const destroyedBefore = game.current.destroyed.length;
    applyInput(game.current, action);
    if (
      game.current.destroyed.length > destroyedBefore &&
      WORD_MEANING_DISPLAY_SECONDS > 0
    ) {
      const id = game.current.destroyed.at(-1)!;
      const index = game.current.items.findIndex((item) => item.id === id);
      const item = game.current.items[index]!;
      const node = nodes.current.get(index);
      const bounds = stage.current?.getBoundingClientRect();
      const top = Math.max(
        18,
        Math.min(
          (node?.getBoundingClientRect().top ?? 18) - (bounds?.top ?? 0),
          (stage.current?.clientHeight ?? 470) - 210,
        ),
      );
      setCompletedWords((words) => [...words, { ...item, top }]);
      const timer = window.setTimeout(() => {
        meaningTimers.current.delete(timer);
        setCompletedWords((words) => words.filter((word) => word.id !== id));
      }, WORD_MEANING_DISPLAY_SECONDS * 1000);
      meaningTimers.current.add(timer);
    }
    events.current.push(action);
    sync();
    if (action.type === "char") beep(game.current.correct_keys === before);
    if (game.current.outcome) void finishRef.current();
  }
  async function abandon() {
    if (!window.confirm("Kết thúc lượt này? Kết quả chưa lưu sẽ bị bỏ."))
      return;
    setDiscarding(true);
    setError("");
    try {
      await gameApi(
        user,
        `/v1/typing-sessions/${session.id}/abandon`,
        "POST",
        {},
        abandonKey.current,
      );
    } catch (e) {
      if (alive.current) setError((e as Error).message);
      setDiscarding(false);
      return;
    }
    await deletePending(session.id).catch(() => {});
    pendingRef.current = undefined;
    if (!alive.current) return;
    // Let navigation protection observe the explicit discard before changing route.
    changePhase("interrupted");
    setLeaving(true);
  }
  useEffect(() => {
    if (leaving) go("/games/typing");
  }, [leaving]);
  // Save immediately, but let the last word's meaning finish displaying.
  if (saved && completedWords.length === 0)
    return <Result session={saved} user={user} />;
  if (phase === "finished" && completedWords.length === 0) {
    let result = game.current.outcome ? getResult(game.current) : null;
    if (!result && pending) {
      // Restore local result from the same deterministic replay after a failed save/reload.
      const restored = createGame(session.items, session.config);
      try {
        for (const e of pending.payload.events) applyInput(restored, e);
        advanceToTick(restored, pending.payload.final_tick);
        result = getResult(restored);
      } catch {
        /* Corrupt local cache never becomes a saved score. */
      }
    }
    return (
      <>
        <div className="typing-save-state" role="status">
          {saving ? "Đang lưu kết quả…" : "Kết quả chưa được lưu lên máy chủ."}
        </div>
        <Notice>{warning}</Notice>
        <Notice>{error}</Notice>
        <div className="typing-actions">
          <button
            disabled={saving || !pendingRef.current}
            onClick={() => pendingRef.current && void send(pendingRef.current)}
          >
            Thử lưu lại
          </button>
          <button
            disabled={saving || discarding}
            className="secondary"
            onClick={abandon}
          >
            Bỏ kết quả và về chọn từ
          </button>
        </div>
        {result && (
          <Result session={{ ...session, result }} user={user} local />
        )}
      </>
    );
  }
  if (!fresh || session.status !== "in_progress")
    return (
      <section className="card empty">
        <Keyboard size={38} />
        <h1>
          {session.status === "expired"
            ? "Lượt chơi đã hết hạn"
            : "Lượt trước đã bị gián đoạn"}
        </h1>
        <p>
          Vị trí từ đang rơi không được khôi phục sau khi tải lại trang. Bạn có
          thể kết thúc lượt cũ và bắt đầu lại.
        </p>
        <Notice>{error}</Notice>
        {session.status === "in_progress" ? (
          <button disabled={discarding} onClick={abandon}>
            Kết thúc lượt cũ
          </button>
        ) : (
          <a href="#/games/typing" className="button">
            Chọn bộ từ
          </a>
        )}
      </section>
    );
  const locked = ui.locked === null ? null : ui.items[ui.locked];
  return (
    <>
      <div className="typing-play-heading">
        <div>
          <a href="#/games/typing">
            <ArrowLeft size={15} />
            Chọn bộ từ
          </a>
          <h1>{session.title}</h1>
          <p>
            {difficultyLabel[session.config.difficulty]} ·{" "}
            {session.items.length} từ
          </p>
        </div>
        <button className="secondary" onClick={abandon} disabled={!!ui.outcome}>
          <X size={16} />
          Kết thúc
        </button>
      </div>
      <Notice>{error}</Notice>
      <Notice>{warning}</Notice>
      <div className="typing-game-shell">
        <div className="typing-hud">
          <div>
            <small>ĐIỂM</small>
            <b>{ui.score.toLocaleString("vi-VN")}</b>
          </div>
          <div className="typing-wave">
            <small>
              ĐỢT {ui.wave} / {Math.ceil(session.items.length / 10)}
            </small>
            <span>
              {ui.destroyed.length} / {session.items.length} từ
            </span>
          </div>
          <div className="typing-lives" aria-label={`${ui.lives} mạng`}>
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={21}
                fill={i < ui.lives ? "currentColor" : "none"}
                className={i < ui.lives ? "" : "lost"}
              />
            ))}
          </div>
          <button
            className="typing-tool"
            aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
            onClick={() => {
              soundRef.current = !sound;
              setSound(!sound);
            }}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="typing-tool"
            aria-label="Tạm dừng"
            disabled={phase !== "playing" && phase !== "countdown"}
            onClick={pause}
          >
            <Pause size={20} />
          </button>
        </div>
        <div
          className="typing-stage"
          ref={stage}
          tabIndex={0}
          role="region"
          aria-label="Sân chơi gõ từ"
          onKeyDown={input}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) pause();
          }}
        >
          <div className="typing-stars" aria-hidden="true" />
          {ui.active.map((target) => {
            const item = ui.items[target.index]!;
            const focused = ui.locked === target.index;
            return (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) nodes.current.set(target.index, node);
                  else nodes.current.delete(target.index);
                }}
                className={`typing-falling ${focused ? "locked" : ""}`}
                style={{ left: `${((item.lane + 0.5) / 3) * 100}%` }}
                data-testid="falling-word"
                data-word={item.answer}
              >
                <span>
                  <mark>{focused ? ui.buffer : ""}</mark>
                  {item.answer.slice(focused ? ui.buffer.length : 0)}
                </span>
              </div>
            );
          })}
          {completedWords.map((word) => (
            <div
              key={word.id}
              className="typing-completed"
              style={{
                left: `${((word.lane + 0.5) / 3) * 100}%`,
                top: word.top,
              }}
              data-testid="completed-word"
              data-word={word.answer}
              role="status"
            >
              <small>{word.answer}</small>
              <span>{word.meaning}</span>
            </div>
          ))}
          {ui.rest_until !== null && phase === "playing" && (
            <div className="typing-wave-message">
              <Sprout size={35} />
              <b>Đợt tiếp theo đang đến…</b>
            </div>
          )}
          <div className="typing-ground">
            <Sprout size={40} />
            <span>Gõ để đón từ trước vạch này</span>
          </div>
          {(phase === "ready" ||
            phase === "paused" ||
            phase === "countdown") && (
            <div className="typing-overlay">
              {phase === "countdown" ? (
                <div className="typing-countdown" role="status">
                  {countdown}
                </div>
              ) : (
                <div className="typing-pause-card">
                  <span className="typing-overlay-icon">
                    <Keyboard size={34} />
                  </span>
                  <h2>
                    {phase === "paused"
                      ? "Nghỉ một nhịp nhé."
                      : "Sẵn sàng đón từ?"}
                  </h2>
                  <p>
                    {phase === "paused"
                      ? "Các từ sẽ chờ bạn. Nhấn tiếp tục khi sẵn sàng."
                      : "Gõ đúng từ đang rơi. Bạn có 3 mạng cho lượt này."}
                  </p>
                  {lease === "blocked" ? (
                    <Notice>
                      Lượt này đang mở ở tab khác, hoặc trình duyệt chưa hỗ trợ
                      khóa lượt chơi. Đóng tab kia rồi tải lại bằng Chrome/Edge.
                    </Notice>
                  ) : (
                    <button disabled={lease !== "owned"} onClick={begin}>
                      <Play size={17} />
                      {phase === "paused" ? "Tiếp tục" : "Sẵn sàng, bắt đầu!"}
                    </button>
                  )}
                  <small>
                    <kbd>Esc</kbd> tạm dừng · <kbd>Tab</kbd> đổi mục tiêu
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="typing-input-bar">
          <Keyboard size={21} />
          <span>
            {locked ? (
              <>
                <mark>{ui.buffer}</mark>
                {locked.answer.slice(ui.buffer.length)}
              </>
            ) : (
              "Gõ chữ đầu để chọn một từ…"
            )}
          </span>
          <b className={ui.combo > 1 ? "combo-on" : ""}>COMBO ×{ui.combo}</b>
        </div>
      </div>
      <p className="typing-disclaimer">
        Dùng bộ gõ English · Gõ cả khoảng trắng và dấu nối · Tự tạm dừng khi bạn
        rời sân chơi
      </p>
    </>
  );
}
