import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Gamepad2,
  Heart,
  History,
  Keyboard,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";
import { api, date, go } from "../../api";
import { Load, Notice, Title, useLoad } from "../../ui";
import { useUser } from "../../main";
import type {
  Difficulty,
  GameResult,
} from "../../../../../packages/typing-core/src/index";
import type {
  TypingSession,
  TypingSource,
  TypingSourceList,
} from "../../../../../packages/api-client/src/typing";
import { freshGames, gameApi, readPending, startGame } from "./client";
import { PlayGame } from "./play";
import { Result, difficultyLabel } from "./result";
import "./typing.css";

const root = "/games/typing";

type HistoryData = {
  items: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    difficulty: Difficulty;
    result: GameResult | null;
  }[];
  has_more: boolean;
  active_id: string | null;
  enabled: boolean;
};
export default function TypingGame({ path }: { path: string[] }) {
  const user = useUser()!.user_id as string;
  if (import.meta.env.VITE_TYPING_GAME_ENABLED === "false")
    return <Notice>Mini game đang tạm đóng. Hãy quay lại sau.</Notice>;
  return (
    <div className="typing-feature">
      {path[0] === "play" && path[1] ? (
        <GameRoute key={path[1]} user={user} id={path[1]} />
      ) : path[0] === "result" && path[1] ? (
        <ResultRoute key={path[1]} user={user} id={path[1]} />
      ) : path[0] === "history" ? (
        <HistoryPage user={user} />
      ) : (
        <Setup user={user} />
      )}
    </div>
  );
}
function Setup({ user }: { user: string }) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState<TypingSource>({
      kind: "personal_cards",
    }),
    [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const state = useLoad(async () => {
    const [lessons, personal, history] = await Promise.all([
      api<TypingSourceList>(
        "content",
        `/v1/typing-sources?page=${page}`,
        "GET",
        undefined,
        undefined,
        undefined,
        user,
      ),
      gameApi<{
        count: number;
        invalid: number;
        duplicates: number;
        truncated: boolean;
        enabled: boolean;
      }>(user, "/v1/typing-sources/personal"),
      gameApi<HistoryData>(user, "/v1/typing-sessions"),
    ]);
    return { lessons, personal, history };
  }, [user, page]);
  const data = state.data;
  const count =
    selected.kind === "personal_cards"
      ? data?.personal.count
      : data?.lessons.items.find(
          (i) => selected.kind === "lesson" && i.id === selected.lesson_id,
        )?.count;
  async function start() {
    setBusy(true);
    setError("");
    try {
      const s = await startGame(user, {
        source: selected,
        difficulty,
        limit: 30,
      });
      go(`${root}/${s.status === "in_progress" ? "play" : "result"}/${s.id}`);
    } catch (e) {
      setError((e as Error).message);
      state.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Title
        eyebrow="CHƠI MỘT CHÚT, NHỚ THÊM MỘT CHÚT"
        title="Vườn từ vựng"
        description="Bắt nhịp bàn phím. Đón những từ đang rơi."
        action={
          <a className="button secondary" href={`#${root}/history`}>
            <History size={17} />
            Lịch sử chơi
          </a>
        }
      />
      <section className="typing-hero">
        <div>
          <span className="typing-kicker">
            <Gamepad2 size={16} /> TYPING GAME
          </span>
          <h2>
            Những từ quen.
            <br />
            Một thử thách mới.
          </h2>
          <p>
            Nhìn từ tiếng Anh và gõ lại trước khi từ chạm đất. Mỗi lượt là một
            cơ hội luyện phản xạ và chính tả.
          </p>
          <div className="typing-chips">
            <span>
              <Heart size={15} />3 mạng
            </span>
            <span>
              <Keyboard size={15} />
              Gõ để ghi điểm
            </span>
            <span>
              <Sparkles size={15} />
              Tăng dần thử thách
            </span>
          </div>
        </div>
        <div className="typing-preview" aria-hidden="true">
          <span className="preview-orbit" />
          <span className="preview-word word-one">
            grow<span className="preview-caret">|</span>
          </span>
          <span className="preview-word word-two">discover</span>
          <span className="preview-word word-three">learn</span>
          <div className="preview-ground">✦</div>
          <span className="preview-score">
            +40 <Sparkles size={14} />
          </span>
        </div>
      </section>
      <div className="typing-small-screen">
        <Keyboard size={18} /> Game dành cho máy tính có bàn phím vật lý. Bạn
        vẫn có thể chọn bộ từ và xem lịch sử ở đây.
      </div>
      <Notice>{error}</Notice>
      <Load state={state}>
        {data && (
          <>
            {data.history.active_id && (
              <div className="typing-resume">
                <span>Bạn có một lượt chơi chưa kết thúc.</span>
                <a
                  className="button secondary"
                  href={`#${root}/play/${data.history.active_id}`}
                >
                  Mở lượt trước <ArrowRight size={16} />
                </a>
              </div>
            )}
            {!data.history.enabled && (
              <Notice>
                Mini game đang tạm đóng lượt chơi mới. Bạn vẫn xem được kết quả
                cũ.
              </Notice>
            )}
            <div className="typing-setup-grid">
              <section className="card typing-sources">
                <div className="typing-section-title">
                  <span className="typing-step">01</span>
                  <div>
                    <h2>Chọn vườn từ của bạn</h2>
                    <p>Dùng các từ đã học hoặc bộ thẻ riêng.</p>
                  </div>
                </div>
                <button
                  className={`typing-source ${selected.kind === "personal_cards" ? "selected" : ""}`}
                  aria-pressed={selected.kind === "personal_cards"}
                  onClick={() => setSelected({ kind: "personal_cards" })}
                >
                  <span className="typing-source-icon">
                    <Layers size={22} />
                  </span>
                  <span>
                    <b>Thẻ của tôi</b>
                    <small>
                      {data.personal.count} từ có thể chơi
                      {data.personal.truncated
                        ? " · xét 1.000 thẻ gần đến hạn"
                        : ""}
                    </small>
                  </span>
                  <span className="typing-radio" />
                </button>
                {data.personal.invalid + data.personal.duplicates > 0 && (
                  <p className="typing-filter-note">
                    Đã bỏ {data.personal.invalid} thẻ có ký tự chưa hỗ trợ và{" "}
                    {data.personal.duplicates} từ trùng.
                  </p>
                )}
                <div className="typing-source-caption">TỪ TRONG BÀI HỌC</div>
                {!data.lessons.items.length && (
                  <p>
                    Chưa có bài học chứa từ vựng. Bạn có thể thêm ít nhất 5 từ
                    vào{" "}
                    <a href="#/cards">
                      <u>Thẻ của tôi</u>
                    </a>
                    .
                  </p>
                )}
                {data.lessons.items.map((item) => (
                  <button
                    key={item.id}
                    className={`typing-source ${selected.kind === "lesson" && selected.lesson_id === item.id ? "selected" : ""}`}
                    aria-pressed={
                      selected.kind === "lesson" &&
                      selected.lesson_id === item.id
                    }
                    onClick={() =>
                      setSelected({ kind: "lesson", lesson_id: item.id })
                    }
                  >
                    <span className="typing-source-icon">
                      <BookOpen size={21} />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>
                        {item.course_title} · {item.count} từ hợp lệ
                        {item.count < 5 ? " · cần thêm từ" : ""}
                      </small>
                    </span>
                    <span className="typing-radio" />
                  </button>
                ))}
                {(page > 1 || data.lessons.has_more) && (
                  <div className="typing-actions">
                    <button
                      className="secondary"
                      disabled={page === 1}
                      onClick={() => {
                        setSelected({ kind: "personal_cards" });
                        setPage(page - 1);
                      }}
                    >
                      Trước
                    </button>
                    <span>Trang {page}</span>
                    <button
                      className="secondary"
                      disabled={!data.lessons.has_more}
                      onClick={() => {
                        setSelected({ kind: "personal_cards" });
                        setPage(page + 1);
                      }}
                    >
                      Tiếp
                    </button>
                  </div>
                )}
              </section>
              <section className="card typing-settings">
                <div className="typing-section-title">
                  <span className="typing-step">02</span>
                  <div>
                    <h2>Tìm nhịp của bạn</h2>
                    <p>Bắt đầu chậm, tiến bộ từng chút.</p>
                  </div>
                </div>
                <div className="typing-difficulties">
                  {(["easy", "normal", "hard"] as const).map((level, n) => (
                    <button
                      key={level}
                      className={difficulty === level ? "selected" : ""}
                      aria-pressed={difficulty === level}
                      onClick={() => setDifficulty(level)}
                    >
                      <span>{["🌱", "🌿", "🌳"][n]}</span>
                      <b>{difficultyLabel[level]}</b>
                      <small>{["Làm quen", "Bắt nhịp", "Thử thách"][n]}</small>
                    </button>
                  ))}
                </div>
                <div className="typing-summary">
                  <span>Từ trong lượt này</span>
                  <b>{Math.min(count ?? 0, 30)} từ</b>
                </div>
                <div className="typing-summary">
                  <span>Mỗi đợt</span>
                  <b>Tối đa 10 từ</b>
                </div>
                <button
                  className="wide typing-start"
                  disabled={
                    busy ||
                    !count ||
                    count < 5 ||
                    !!data.history.active_id ||
                    !data.history.enabled
                  }
                  onClick={start}
                >
                  <Play size={18} />
                  {busy ? "Đang chuẩn bị…" : "Bắt đầu chơi"}
                </button>
                {(count ?? 0) < 5 && (
                  <p className="typing-filter-note">
                    Cần ít nhất 5 từ hợp lệ để bắt đầu. Chọn bài khác hoặc thêm
                    thẻ tiếng Anh.
                  </p>
                )}
                <div className="typing-how">
                  <b>Chơi như thế nào?</b>
                  <ol>
                    <li>Gõ chữ đầu để khóa một từ.</li>
                    <li>Gõ hết từ để ghi điểm. Sai thì thử tiếp.</li>
                    <li>
                      <kbd>Tab</kbd> đổi mục tiêu · <kbd>Esc</kbd> tạm dừng.
                    </li>
                  </ol>
                  <small>
                    Khoảng trắng, dấu nối và dấu nháy cũng là một phần của từ.
                    Hãy dùng bộ gõ English.
                  </small>
                </div>
              </section>
            </div>
          </>
        )}
      </Load>
    </>
  );
}
function GameRoute({ user, id }: { user: string; id: string }) {
  const [fresh] = useState(() => {
    const ready = freshGames.has(id);
    freshGames.delete(id);
    return ready;
  });
  const state = useLoad(async () => {
    const session = await gameApi<TypingSession>(
      user,
      `/v1/typing-sessions/${id}`,
    );
    const pending = await readPending(user, id).catch(() => undefined);
    return { session, pending };
  }, [user, id]);
  return (
    <Load state={state}>
      {state.data && (
        <PlayGame
          key={id}
          user={user}
          session={state.data.session}
          pending={state.data.pending}
          fresh={fresh}
        />
      )}
    </Load>
  );
}
function ResultRoute({ user, id }: { user: string; id: string }) {
  const state = useLoad(
    () => gameApi<TypingSession>(user, `/v1/typing-sessions/${id}`),
    [user, id],
  );
  return (
    <Load state={state}>
      {state.data && <Result session={state.data} user={user} />}
    </Load>
  );
}
function HistoryPage({ user }: { user: string }) {
  const [page, setPage] = useState(1);
  const state = useLoad(
    () => gameApi<HistoryData>(user, `/v1/typing-sessions?page=${page}`),
    [user, page],
  );
  return (
    <>
      <Title
        title="Những lượt chơi của bạn"
        description="Nhìn lại từng bước tiến, rồi thử thêm một lượt."
        action={
          <a href={`#${root}`} className="button">
            <Gamepad2 size={17} />
            Chơi lượt mới
          </a>
        }
      />
      <Load state={state}>
        {state.data && (
          <section className="card typing-history">
            {!state.data.items.length && (
              <div className="empty">
                <Keyboard size={36} />
                <h2>Vườn từ đang chờ bạn</h2>
                <p>Hoàn thành lượt đầu tiên để xem kết quả ở đây.</p>
              </div>
            )}
            {state.data.items.map((item) => (
              <a
                key={item.id}
                className="typing-history-row"
                href={`#${root}/${item.status === "in_progress" ? "play" : "result"}/${item.id}`}
              >
                <span className="typing-source-icon">
                  <Gamepad2 size={22} />
                </span>
                <span>
                  <b>{item.title}</b>
                  <small>
                    {date(item.created_at)} · {difficultyLabel[item.difficulty]}
                  </small>
                </span>
                <span className="typing-history-score">
                  {item.result
                    ? `${item.result.score} điểm`
                    : item.status === "in_progress"
                      ? "Chưa kết thúc"
                      : item.status === "expired"
                        ? "Hết hạn"
                        : "Đã thoát"}
                </span>
                <ArrowRight size={18} />
              </a>
            ))}
            <div className="typing-actions">
              <button
                className="secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </button>
              <span>Trang {page}</span>
              <button
                className="secondary"
                disabled={!state.data.has_more}
                onClick={() => setPage(page + 1)}
              >
                Tiếp
              </button>
            </div>
          </section>
        )}
      </Load>
    </>
  );
}
