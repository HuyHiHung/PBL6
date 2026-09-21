import { useState } from "react";
import { ArrowLeft, Play, Trophy } from "lucide-react";
import { go } from "../../api";
import { Notice } from "../../ui";
import type {
  TypingSession,
  TypingSource,
} from "../../../../../packages/api-client/src/typing";
import { startGame } from "./client";
const root = "/games/typing";
export const difficultyLabel = { easy: "Dễ", normal: "Vừa", hard: "Khó" };
export function Result({
  session,
  user,
  local = false,
}: {
  session: TypingSession;
  user: string;
  local?: boolean;
}) {
  const result = session.result;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function again(missed = false) {
    setBusy(true);
    setError("");
    try {
      const source: TypingSource = missed
        ? { kind: "retry_missed", session_id: session.id }
        : session.source;
      const next = await startGame(user, {
        source,
        difficulty: session.config.difficulty,
        limit: 30,
      });
      go(`${root}/play/${next.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!result)
    return (
      <div className="card empty">
        <h1>
          {session.status === "expired"
            ? "Lượt chơi đã hết hạn"
            : session.status === "abandoned"
              ? "Bạn đã kết thúc lượt chơi"
              : "Lượt chơi chưa hoàn tất"}
        </h1>
        <p>Kết quả chỉ được lưu khi lượt chơi kết thúc.</p>
        <a className="button" href={`#${root}`}>
          Chọn bộ từ
        </a>
      </div>
    );
  const missed = session.items.filter((i) => result.missed_ids.includes(i.id));
  return (
    <>
      <div className="typing-result-hero">
        <span className="typing-trophy">
          <Trophy size={34} />
        </span>
        <span className="typing-kicker">
          {local ? "KẾT QUẢ TRÊN THIẾT BỊ" : "LƯỢT CHƠI ĐÃ LƯU"}
        </span>
        <h1>
          {result.outcome === "won"
            ? "Bạn đã đón trọn vườn từ!"
            : "Mỗi lượt chơi, một bước tiến."}
        </h1>
        <p>
          {session.title} · {difficultyLabel[session.config.difficulty]}
        </p>
        <div className="typing-big-score">
          {result.score.toLocaleString("vi-VN")}
          <small>ĐIỂM</small>
        </div>
      </div>
      <div className="typing-stats">
        <div>
          <b>
            {result.destroyed_ids.length}/{result.total}
          </b>
          <span>Từ hoàn thành</span>
        </div>
        <div>
          <b>{result.accuracy === null ? "—" : `${result.accuracy}%`}</b>
          <span>Độ chính xác</span>
        </div>
        <div>
          <b>{result.wpm}</b>
          <span>WPM trong game</span>
        </div>
        <div>
          <b>×{result.max_combo}</b>
          <span>Combo cao nhất</span>
        </div>
      </div>
      <Notice>{error}</Notice>
      <section className="card typing-review">
        <h2>Từ cần thêm một chút luyện tập</h2>
        {missed.length ? (
          <div className="typing-word-list">
            {missed.map((item) => (
              <div key={item.id}>
                <b>{item.word}</b>
                <span>{item.meaning}</span>
                {item.example && <small>{item.example}</small>}
              </div>
            ))}
          </div>
        ) : (
          <p>
            {result.outcome === "won"
              ? "Không có từ nào chạm đất. Làm tốt lắm!"
              : "Chưa có từ chạm đất trong lượt này."}
          </p>
        )}
        {result.unseen_ids.length + result.unfinished_ids.length > 0 && (
          <p>
            {result.unseen_ids.length} từ chưa xuất hiện ·{" "}
            {result.unfinished_ids.length} từ còn trên sân khi kết thúc. Các từ
            này không tính là từ gõ sai.
          </p>
        )}
        <div className="typing-actions">
          <button disabled={busy || local} onClick={() => again()}>
            <Play size={16} />
            Chơi lại
          </button>
          {missed.length > 0 && (
            <button
              disabled={busy || local}
              className="secondary"
              onClick={() => again(true)}
            >
              Luyện lại {missed.length} từ bỏ lỡ
            </button>
          )}
          <a className="button secondary" href={`#${root}`}>
            <ArrowLeft size={16} />
            Đổi bộ từ
          </a>
        </div>
      </section>
      <p className="typing-disclaimer">
        Luyện gõ giúp bạn quen mặt chữ. Điểm này không thay đổi điểm bài học
        hoặc lịch ôn tập.
      </p>
    </>
  );
}
