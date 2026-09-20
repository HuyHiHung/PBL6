import { useState, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Layers,
  Bookmark,
  Headphones,
  RotateCcw,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";
import { api, mutate, go, date, statusText, type Row } from "./api";
import {
  Title,
  Load,
  Notice,
  Empty,
  Link,
  Pager,
  useLoad,
  useAction,
} from "./ui";
import { useUser } from "./main";
const start = async (id: string) => {
  const r = await mutate("learning", "/v1/attempts", { assessment_id: id });
  go("/attempt/" + r.attempt_id);
};
export function Home() {
  const me = useUser(),
    s = useLoad(
      () => (me ? api("learning", "/v1/today") : Promise.resolve(null)),
      [me?.user_id],
    );
  const p = s.data?.progress;
  return (
    <>
      <Title
        eyebrow="MỖI NGÀY, MỘT BƯỚC TIẾN"
        title={
          me
            ? `Chào ${me.display_name.split(" ").at(-1)}, cùng học nhé.`
            : "Một khởi đầu nhỏ. Một thế giới mới."
        }
        description="Dành một khoảng nhỏ hôm nay cho phiên bản tự tin hơn của bạn."
      />
      <section className="hero">
        <div>
          <span className="tag light">YOUR NEXT CHAPTER</span>
          <h2>
            Tiếng Anh tốt hơn,
            <br />
            từ những điều nhỏ.
          </h2>
          <p>
            Học theo lộ trình. Luyện tập để hiểu.
            <br />
            Ôn lại để nhớ lâu hơn.
          </p>
          <Link
            to={p?.next_lesson_id ? "/lesson/" + p.next_lesson_id : "/catalog"}
            className="button ivory"
          >
            {p?.next_lesson_id ? "Tiếp tục học" : "Khám phá lộ trình"}
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit" />
          <div className="book book-back" />
          <div className="book book-front">
            <span>
              little
              <br />
              by little.
            </span>
            <Sprig />
          </div>
          <div className="floating-tag">
            <Check size={17} /> Một điều mới mỗi ngày
          </div>
          <span className="star">✳</span>
        </div>
      </section>
      {me ? (
        <Load state={s}>
          <div className="section-heading">
            <h2>Hôm nay của bạn</h2>
            <a href="#/progress">
              Xem tiến độ <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="stats-grid">
            <Stat
              value={s.data?.due_cards ?? 0}
              title="Thẻ đến hạn"
              subtitle="Ôn lại để ghi nhớ"
              to="/cards"
              icon={<Layers />}
            />
            <Stat
              value={s.data?.new_cards ?? 0}
              title="Từ vựng mới"
              subtitle="Thêm một chút vốn từ"
              to="/cards"
              icon={<BookOpen />}
            />
            <Stat
              value={s.data?.wrong_questions ?? 0}
              title="Câu cần luyện lại"
              subtitle="Biến lỗi sai thành tiến bộ"
              to="/mistakes"
              icon={<RotateCcw />}
            />
          </div>
          <div className="section-heading">
            <h2>Lộ trình đang học</h2>
            <a href="#/catalog">
              Tất cả lộ trình <ArrowRight size={16} />
            </a>
          </div>
          {p?.course ? (
            <div className="card course-summary">
              <div className="course-icon">
                <GraduationCap size={36} />
              </div>
              <div>
                <span className="eyebrow">TIẾP TỤC HÀNH TRÌNH</span>
                <h3>{p.course.title}</h3>
                <p>
                  {p.completed
                    ? "Bạn đã hoàn thành lộ trình này."
                    : `${p.percent ?? 0}% số bài đã hoàn thành`}
                </p>
                <progress max={100} value={p.percent ?? 0} />
              </div>
              <Link to="/progress" className="button secondary">
                Xem lộ trình
              </Link>
            </div>
          ) : (
            <Empty title="Chọn điểm bắt đầu của bạn">
              <p>Khám phá các lộ trình và chọn nội dung phù hợp.</p>
              <Link to="/catalog">Chọn lộ trình</Link>
            </Empty>
          )}
        </Load>
      ) : (
        <div className="guest-grid">
          <div>
            <span className="step-number">01</span>
            <h3>Học có định hướng</h3>
            <p>
              Từ bài học đầu tiên đến các chủ đề tiếp theo, luôn biết mình nên
              học gì.
            </p>
          </div>
          <div>
            <span className="step-number">02</span>
            <h3>Hiểu qua thực hành</h3>
            <p>Làm bài và nhận giải thích để hiểu vì sao một đáp án đúng.</p>
          </div>
          <div>
            <span className="step-number">03</span>
            <h3>Nhớ bằng cách ôn lại</h3>
            <p>
              Thẻ từ vựng và câu sai giúp bạn tập trung vào điều cần luyện thêm.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
function Sprig() {
  return (
    <svg viewBox="0 0 100 120">
      <path d="M50 110V35" />
      <path d="M50 76C15 80 6 50 8 32c30 1 45 18 42 44Zm0-28C49 16 74 3 92 5c1 28-14 46-42 43Z" />
    </svg>
  );
}
function Stat({
  value,
  title,
  subtitle,
  to,
  icon,
}: {
  value: number;
  title: string;
  subtitle: string;
  to: string;
  icon: React.ReactNode;
}) {
  return (
    <a className="card stat" href={"#" + to}>
      <div className="stat-icon">{icon}</div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <ArrowUpRight className="stat-arrow" size={20} />
    </a>
  );
}
export function Catalog() {
  const s = useLoad(() => api("content", "/v1/catalog")),
    a = useAction(),
    me = useUser();
  const [q, setQ] = useState("");
  return (
    <>
      <Title
        title="Một lộ trình, nhiều khám phá."
        description="Chọn hành trình phù hợp và bắt đầu từ bài học đầu tiên."
      />
      <label className="search">
        Tìm lộ trình
        <input
          placeholder="Bạn muốn học điều gì?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <Notice>{a.error}</Notice>
      <Load state={s}>
        {s.data?.courses
          .filter((c: Row) => c.title.toLowerCase().includes(q.toLowerCase()))
          .map((course: Row, n: number) => (
            <section className="card catalog-course" key={course.id}>
              <div className="course-head">
                <span className="course-number">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="tag">
                    {course.level ?? "Từng bước tiến bộ"}
                  </span>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                </div>
                <button
                  disabled={a.busy}
                  onClick={() =>
                    me
                      ? a.run(async () => {
                          await api("learning", "/v1/enrollment", "PUT", {
                            course_id: course.id,
                          });
                          go("/progress");
                        })
                      : go("/login")
                  }
                >
                  Chọn lộ trình <ArrowRight size={16} />
                </button>
              </div>
              {course.topics.map((topic: Row) => (
                <div className="topic" key={topic.id}>
                  <h3>
                    {topic.title}
                    <span>{topic.lessons.length} bài học</span>
                  </h3>
                  {topic.lessons.map((lesson: Row, i: number) => (
                    <a
                      className="lesson-row"
                      key={lesson.id}
                      href={"#/lesson/" + lesson.id}
                    >
                      <span className="lesson-index">{i + 1}</span>
                      <span>{lesson.title}</span>
                      {lesson.is_preview && (
                        <span className="tag">Học thử</span>
                      )}
                      <ArrowRight size={18} />
                    </a>
                  ))}
                  {topic.assessment_id && (
                    <button
                      className="text-link"
                      disabled={a.busy}
                      onClick={() =>
                        me
                          ? a.run(() => start(topic.assessment_id))
                          : go("/login")
                      }
                    >
                      Làm kiểm tra chủ đề <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))}
        {s.data?.courses.length === 0 && (
          <Empty title="Lộ trình đang được chuẩn bị">
            <p>Hãy quay lại sau để khám phá các bài học mới.</p>
          </Empty>
        )}
      </Load>
    </>
  );
}
export function Lesson({ id }: { id: string }) {
  const me = useUser(),
    s = useLoad(async () => {
      const r = await api("content", "/v1/lessons/" + id);
      if (me) await api("learning", "/v1/lessons/" + id + "/open", "POST");
      return r;
    }, [id, me?.user_id]),
    a = useAction();
  return (
    <Load state={s}>
      {s.data && (
        <>
          <a className="text-link" href="#/catalog">
            ← Trở về lộ trình
          </a>
          <Title
            eyebrow="BÀI HỌC"
            title={s.data.title}
            description={s.data.objectives}
            action={
              <button
                className="secondary"
                disabled={a.busy}
                onClick={() =>
                  me
                    ? a.run(async () => {
                        await api("learning", "/v1/favorites/" + id, "PUT");
                      }, "Đã lưu vào bài yêu thích.")
                    : go("/login")
                }
              >
                <Bookmark size={18} />
                Lưu bài
              </button>
            }
          />
          <Notice>{a.error}</Notice>
          <Notice good>{a.success}</Notice>
          <div className="lesson-content">
            {s.data.blocks.map((b: Row) => (
              <section className={"card block " + b.type} key={b.id}>
                {b.type === "vocabulary" ? (
                  <>
                    <span className="eyebrow">TỪ VỰNG</span>
                    <div className="vocab-grid">
                      {s
                        .data!.vocabulary.filter((v: Row) =>
                          b.vocabulary_ids.includes(v.vocabulary_id),
                        )
                        .map((v: Row) => (
                          <div className="vocab" key={v.vocabulary_id}>
                            <h3>{v.snapshot.word}</h3>
                            <small>{v.snapshot.phonetic}</small>
                            <p>{v.snapshot.meaning}</p>
                            <em>{v.snapshot.example}</em>
                            {v.snapshot.audio_url && (
                              <Audio src={v.snapshot.audio_url} />
                            )}
                            <button
                              className="secondary"
                              disabled={a.busy}
                              onClick={() =>
                                me
                                  ? a.run(async () => {
                                      await mutate(
                                        "learning",
                                        "/v1/flashcards",
                                        {
                                          source_vocabulary_id: v.vocabulary_id,
                                          lesson_id: id,
                                        },
                                      );
                                    }, "Đã lưu thẻ từ vựng.")
                                  : go("/login")
                              }
                            >
                              <Layers size={16} />
                              Lưu từ
                            </button>
                          </div>
                        ))}
                    </div>
                  </>
                ) : b.type === "audio" ? (
                  <>
                    <span className="eyebrow">
                      <Headphones size={16} /> LUYỆN NGHE
                    </span>
                    <Audio src={b.audio_url} />
                    <details>
                      <summary>Xem transcript</summary>
                      <p className="preserve">{b.transcript}</p>
                    </details>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">
                      {b.type === "grammar"
                        ? "NGỮ PHÁP"
                        : b.type === "reading"
                          ? "BÀI ĐỌC"
                          : "KHÁM PHÁ"}
                    </span>
                    {b.title && <h2>{b.title}</h2>}
                    <p className="preserve">{b.body}</p>
                  </>
                )}
              </section>
            ))}
          </div>
          <div className="card cta">
            <div>
              <h2>Sẵn sàng thử sức?</h2>
              <p>Áp dụng những gì bạn vừa học vào bài luyện tập.</p>
            </div>
            {s.data.assessment_id ? (
              <button
                disabled={a.busy}
                onClick={() =>
                  me ? a.run(() => start(s.data!.assessment_id)) : go("/login")
                }
              >
                Làm bài luyện tập <ArrowRight size={18} />
              </button>
            ) : (
              <p>Bài luyện tập đang được chuẩn bị.</p>
            )}
          </div>
        </>
      )}
    </Load>
  );
}
export function Audio({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return !src || failed ? (
    <Notice>Audio chưa tải được. Tải lại trang để lấy đường dẫn mới.</Notice>
  ) : (
    <audio
      aria-label="Nghe audio"
      controls
      preload="none"
      src={src}
      onError={() => setFailed(true)}
    />
  );
}
export function Attempt({ id }: { id: string }) {
  const s = useLoad(() => api("learning", "/v1/attempts/" + id), [id]),
    a = useAction(),
    [answers, setAnswers] = useState<Record<string, Row>>({}),
    [confirm, setConfirm] = useState(false);
  const d = s.data;
  const active = d?.status === "in_progress";
  async function save(item: Row) {
    const answer = answers[item.id] ?? item.answer;
    if (!answer) throw new Error("Hãy chọn hoặc nhập câu trả lời trước.");
    const body = {
      answer,
      expectedVersion: Number(item.answer_version),
      attemptVersion: Number(d!.row_version),
    };
    if (d!.kind === "topic_test") {
      await api("learning", "/v1/items/" + item.id + "/answer", "PUT", body);
      s.setData(await api("learning", "/v1/attempts/" + id));
    } else
      s.setData(
        await mutate("learning", "/v1/items/" + item.id + "/check", body),
      );
    setAnswers((v) => {
      const next = { ...v };
      delete next[item.id];
      return next;
    });
  }
  return (
    <Load state={s}>
      {d && (
        <>
          <Title
            eyebrow={
              d.kind === "topic_test"
                ? "KIỂM TRA CHỦ ĐỀ"
                : d.kind === "mistake_review"
                  ? "ÔN CÂU SAI"
                  : "LUYỆN TẬP"
            }
            title={d.title}
            description={`${d.total_count} câu hỏi · ${statusText(d.status)}`}
            action={
              <span className="tag">
                {d.items.filter((i: Row) => i.answer).length}/{d.total_count} đã
                lưu
              </span>
            }
          />
          <Notice>{a.error}</Notice>
          {d.status === "submitted" && (
            <div className="result card">
              <Check size={32} />
              <h2>
                {d.kind === "mistake_review"
                  ? "Đã hoàn thành lượt ôn"
                  : d.passed
                    ? "Bạn đã vượt qua bài làm!"
                    : "Thêm một lần luyện, thêm một bước tiến."}
              </h2>
              <strong>
                {d.score === null
                  ? `${d.correct_count}/${d.total_count} câu đúng`
                  : `${d.score}%`}
              </strong>
              <p>Kết quả và giải thích đã được lưu vào lịch sử.</p>
              <Link to="/progress" className="button secondary">
                Xem tiến độ
              </Link>
            </div>
          )}
          {d.status === "cancelled" && (
            <Notice>
              Lượt này đã hủy. Bạn có thể mở một lượt mới từ bài học hoặc chủ
              đề.
            </Notice>
          )}
          {d.items.map((item: Row, index: number) => {
            const answer = answers[item.id] ?? item.answer ?? {};
            const locked = !active || item.checked;
            return (
              <section className="card question" key={item.id}>
                <div className="question-top">
                  <span className="tag">Câu {index + 1}</span>
                  {item.checked && (
                    <span className={item.is_correct ? "correct" : "incorrect"}>
                      {item.is_correct ? "Chính xác" : "Cần luyện thêm"}
                    </span>
                  )}
                </div>
                {item.passage && (
                  <p className="passage preserve">{item.passage}</p>
                )}
                {item.audio_url && <Audio src={item.audio_url} />}
                <h3>{item.prompt}</h3>
                {item.type === "single_choice" ? (
                  <fieldset disabled={locked || a.busy}>
                    <legend className="sr-only">
                      Câu trả lời cho câu {index + 1}
                    </legend>
                    {item.options.map((o: Row) => (
                      <label
                        className={
                          "option " +
                          (answer.option_key === o.option_key ? "selected" : "")
                        }
                        key={o.option_key}
                      >
                        <input
                          type="radio"
                          name={item.id}
                          value={o.option_key}
                          checked={answer.option_key === o.option_key}
                          onChange={() =>
                            setAnswers((v) => ({
                              ...v,
                              [item.id]: { option_key: o.option_key },
                            }))
                          }
                        />
                        <span className="option-key">{o.option_key}</span>
                        {o.text}
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <label>
                    Câu trả lời
                    <input
                      disabled={locked || a.busy}
                      value={answer.text ?? ""}
                      placeholder="Nhập đáp án của bạn"
                      onChange={(e) =>
                        setAnswers((v) => ({
                          ...v,
                          [item.id]: { text: e.target.value },
                        }))
                      }
                    />
                  </label>
                )}
                {active && !item.checked && (
                  <button
                    className="secondary"
                    disabled={a.busy}
                    onClick={() => a.run(() => save(item))}
                  >
                    {d.kind === "topic_test"
                      ? "Lưu đáp án"
                      : "Kiểm tra câu trả lời"}
                  </button>
                )}
                {item.answer_key && (
                  <div className="explanation">
                    <b>
                      Đáp án:{" "}
                      {item.answer_key.correct_option_key ??
                        item.answer_key.accepted_answers?.join(" / ")}
                    </b>
                    <p>{item.explanation}</p>
                    {item.transcript && (
                      <details>
                        <summary>Transcript</summary>
                        <p>{item.transcript}</p>
                      </details>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          {active && (
            <div className="card submit-panel">
              <p>
                Lưu hoặc kiểm tra từng câu trước khi nộp. Câu chưa lưu sẽ được
                tính là bỏ trống.
              </p>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                Tôi đồng ý nộp cả khi còn câu bỏ trống.
              </label>
              <div className="actions">
                <button
                  disabled={a.busy || Object.keys(answers).length > 0}
                  onClick={() =>
                    a.run(async () => {
                      s.setData(
                        await mutate(
                          "learning",
                          "/v1/attempts/" + id + "/submit",
                          {
                            expectedVersion: Number(d.row_version),
                            confirmBlank: confirm,
                          },
                        ),
                      );
                      window.scrollTo(0, 0);
                    })
                  }
                >
                  Nộp bài
                </button>
                <button
                  className="secondary"
                  disabled={a.busy}
                  onClick={() => {
                    if (window.confirm("Hủy lượt làm này?"))
                      a.run(async () => {
                        await api(
                          "learning",
                          "/v1/attempts/" + id + "/cancel",
                          "POST",
                          { expectedVersion: Number(d.row_version) },
                        );
                        s.reload();
                      });
                  }}
                >
                  Hủy lượt
                </button>
              </div>
              {Object.keys(answers).length > 0 && (
                <small>Hãy lưu những câu vừa thay đổi trước khi nộp.</small>
              )}
            </div>
          )}
        </>
      )}
    </Load>
  );
}
export function HistoryPage() {
  const [page, setPage] = useState(1),
    s = useLoad(() => api("learning", "/v1/attempts?page=" + page), [page]);
  return (
    <>
      <Title
        title="Nhìn lại để tiến xa hơn."
        description="Các lượt học đã lưu, kể cả bài đang làm dở."
      />
      <Load state={s}>
        {s.data?.items.length ? (
          <div className="card list">
            {s.data.items.map((r: Row) => (
              <a className="list-row" href={"#/attempt/" + r.id} key={r.id}>
                <BookOpen />
                <div>
                  <b>{r.title_snapshot}</b>
                  <small>
                    {date(r.started_at)} · {statusText(r.status)}
                  </small>
                </div>
                <span className="tag">
                  {r.status === "submitted" && r.kind !== "mistake_review"
                    ? `${Math.round((100 * r.correct_count) / r.total_count)}%`
                    : r.kind === "mistake_review"
                      ? "Ôn tập"
                      : "Tiếp tục"}
                </span>
                <ArrowRight size={18} />
              </a>
            ))}
          </div>
        ) : (
          <Empty title="Lịch sử bắt đầu từ bài học đầu tiên">
            <Link to="/catalog">Khám phá lộ trình</Link>
          </Empty>
        )}
        <Pager
          page={page}
          setPage={setPage}
          more={s.data?.items.length === 20}
        />
      </Load>
    </>
  );
}
export function ReviewPage() {
  const [page, setPage] = useState(1),
    s = useLoad(() => api("learning", "/v1/mistakes?page=" + page), [page]),
    a = useAction();
  return (
    <>
      <Title
        title="Một lần sai, một cơ hội hiểu."
        description="Ôn tối đa 10 câu mỗi lượt. Điểm bài cũ luôn được giữ nguyên."
        action={
          <button
            disabled={a.busy || !s.data?.total}
            onClick={() =>
              a.run(async () => {
                const r = await mutate("learning", "/v1/mistake-reviews", {});
                go("/attempt/" + r.attempt_id);
              })
            }
          >
            Bắt đầu ôn <ArrowRight size={18} />
          </button>
        }
      />
      <Notice>{a.error}</Notice>
      <Load state={s}>
        {s.data?.items.length ? (
          s.data.items.map((r: Row) => (
            <div className="card" key={r.question_id}>
              <h3>{r.prompt}</h3>
              <p>{r.explanation}</p>
              <small>Lần sai gần nhất: {date(r.last_failed_at)}</small>
            </div>
          ))
        ) : (
          <Empty title="Không còn câu sai cần ôn">
            <p>Tiếp tục học để khám phá những điều mới nhé.</p>
          </Empty>
        )}
        <Pager
          page={page}
          setPage={setPage}
          more={page * 20 < (s.data?.total ?? 0)}
        />
      </Load>
    </>
  );
}
export function Favorites() {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    s = useLoad(
      () =>
        api(
          "learning",
          `/v1/favorites?page=${page}&q=${encodeURIComponent(q)}`,
        ),
      [page, q],
    ),
    a = useAction();
  return (
    <>
      <Title title="Những bài học muốn giữ lại." />
      <label>
        Tìm bài đã lưu
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <Notice>{a.error}</Notice>
      <Load state={s}>
        {s.data?.items.length ? (
          s.data.items.map((r: Row) => (
            <div className="card list-row" key={r.lesson_id}>
              <Bookmark />
              <div>
                <b>{r.title}</b>
                <small>
                  {r.available ? "Sẵn sàng để học" : "Nội dung đang ẩn"}
                </small>
              </div>
              {r.available && (
                <Link to={"/lesson/" + r.lesson_id} className="text-link">
                  Mở bài
                </Link>
              )}
              <button
                className="secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(async () => {
                    await api(
                      "learning",
                      "/v1/favorites/" + r.lesson_id,
                      "DELETE",
                    );
                    s.reload();
                  })
                }
              >
                Bỏ lưu
              </button>
            </div>
          ))
        ) : (
          <Empty title="Chưa có bài yêu thích phù hợp" />
        )}
        <Pager
          page={page}
          setPage={setPage}
          more={page * 20 < (s.data?.total ?? 0)}
        />
      </Load>
    </>
  );
}
export function Progress() {
  const s = useLoad(() => api("learning", "/v1/progress")),
    a = useAction();
  return (
    <>
      <Title
        title="Mỗi bước đều đáng ghi nhận."
        description="Bài học hoàn thành khi đạt quiz; chủ đề hoàn thành khi đạt cả bài kiểm tra."
      />
      <Notice>{a.error}</Notice>
      <Load state={s}>
        {s.data?.course ? (
          <>
            <div className="card">
              <span className="eyebrow">LỘ TRÌNH ĐANG HỌC</span>
              <h2>{s.data.course.title}</h2>
              <h3>{s.data.percent ?? 0}% bài hoàn thành</h3>
              <progress value={s.data.percent ?? 0} max={100} />
              {s.data.catalog_changed && (
                <div className="notice good">
                  Lộ trình có nội dung mới hoặc thay đổi.{" "}
                  <button
                    className="text-link"
                    disabled={a.busy}
                    onClick={() =>
                      a.run(async () => {
                        await api("learning", "/v1/catalog-seen", "POST", {
                          course_id: s.data!.course.id,
                          catalog_version: Number(
                            s.data!.course.catalog_version,
                          ),
                        });
                        s.reload();
                      })
                    }
                  >
                    Đã xem cập nhật
                  </button>
                </div>
              )}
            </div>
            {s.data.topics.map((t: Row) => (
              <div className="card topic" key={t.id}>
                <h3>
                  {t.title}
                  <span>
                    {t.completed_count}/{t.total_count} bài
                  </span>
                </h3>
                {t.lessons.map((l: Row) => (
                  <a
                    className="lesson-row"
                    href={"#/lesson/" + l.id}
                    key={l.id}
                  >
                    {l.status === "completed" ? (
                      <Check size={18} />
                    ) : (
                      <BookOpen size={18} />
                    )}
                    <span>{l.title}</span>
                    <small>{statusText(l.status)}</small>
                    <ArrowRight size={16} />
                  </a>
                ))}
                {t.assessment_id && (
                  <button
                    className="secondary"
                    disabled={a.busy}
                    onClick={() => a.run(() => start(t.assessment_id))}
                  >
                    {t.test_passed ? "Làm lại kiểm tra" : "Kiểm tra chủ đề"}
                  </button>
                )}
              </div>
            ))}
          </>
        ) : (
          <Empty title="Chọn lộ trình để bắt đầu">
            <Link to="/catalog">Xem lộ trình</Link>
          </Empty>
        )}
      </Load>
    </>
  );
}
export function Cards() {
  const [page, setPage] = useState(1),
    [filter, setFilter] = useState("all"),
    [edit, setEdit] = useState<Row | null>(null),
    [show, setShow] = useState(false),
    s = useLoad(
      () => api("learning", `/v1/flashcards?page=${page}&filter=${filter}`),
      [page, filter],
    ),
    a = useAction();
  return (
    <>
      <Title
        title="Từ mới hôm nay. Vốn từ ngày mai."
        description="Tạo thẻ của riêng bạn, hoặc lưu từ ngay trong bài học."
        action={
          <button
            disabled={a.busy}
            onClick={() =>
              a.run(async () => {
                const r = await mutate(
                  "learning",
                  "/v1/flashcard-sessions",
                  {},
                );
                go("/card-session/" + r.session_id);
              })
            }
          >
            Bắt đầu ôn <ArrowRight size={18} />
          </button>
        }
      />
      <div className="toolbar">
        <div className="tabs">
          {[
            ["all", "Tất cả"],
            ["new", "Thẻ mới"],
            ["due", "Đến hạn"],
          ].map(([v, t]) => (
            <button
              className={filter === v ? "selected" : ""}
              key={v}
              onClick={() => {
                setFilter(v);
                setPage(1);
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className="secondary"
          onClick={() => {
            setEdit({ word: "", meaning: "", example: "" });
            setShow(true);
          }}
        >
          + Tạo thẻ
        </button>
      </div>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      {show && edit && (
        <div className="card">
          <h2>{edit.id ? "Sửa thẻ" : "Thẻ từ vựng mới"}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
                const body = {
                  word: edit.word,
                  meaning: edit.meaning,
                  example: edit.example,
                };
                if (edit.id)
                  await api("learning", "/v1/flashcards/" + edit.id, "PATCH", {
                    ...body,
                    expectedVersion: Number(edit.row_version),
                  });
                else await mutate("learning", "/v1/flashcards", body);
                setShow(false);
                s.reload();
              }, "Đã lưu thẻ.");
            }}
          >
            {[
              ["word", "Từ / cụm từ"],
              ["meaning", "Nghĩa"],
              ["example", "Ví dụ"],
            ].map(([k, l]) => (
              <label key={k}>
                {l}
                <input
                  required={k !== "example"}
                  maxLength={10000}
                  value={edit[k]}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                />
              </label>
            ))}
            <div className="actions">
              <button disabled={a.busy}>Lưu thẻ</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShow(false)}
              >
                Đóng
              </button>
            </div>
          </form>
        </div>
      )}
      <Load state={s}>
        <div className="flashcards-grid">
          {s.data?.items.map((r: Row) => (
            <article className="card vocab" key={r.id}>
              <span className="eyebrow">
                {r.last_reviewed_at ? `BẬC ${r.stage}` : "THẺ MỚI"}
              </span>
              <h2>{r.word}</h2>
              <p>{r.meaning}</p>
              <em>{r.example}</em>
              <small>Lịch ôn: {date(r.due_at)}</small>
              <div className="actions">
                <button
                  className="text-link"
                  onClick={() => {
                    setEdit(r);
                    setShow(true);
                    window.scrollTo(0, 0);
                  }}
                >
                  Sửa
                </button>
                <button
                  className="text-link danger"
                  disabled={a.busy}
                  onClick={() => {
                    if (confirm("Xóa thẻ này khỏi bộ từ vựng?"))
                      a.run(async () => {
                        await api(
                          "learning",
                          "/v1/flashcards/" + r.id,
                          "DELETE",
                          { expectedVersion: Number(r.row_version) },
                        );
                        s.reload();
                      });
                  }}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
        {s.data?.items.length === 0 && (
          <Empty title="Chưa có thẻ trong mục này">
            <p>Lưu một từ trong bài học hoặc tạo thẻ mới.</p>
          </Empty>
        )}
        <Pager
          page={page}
          setPage={setPage}
          more={s.data?.items.length === 20}
        />
      </Load>
    </>
  );
}
export function CardSession({ id }: { id: string }) {
  const s = useLoad(
      () => api("learning", "/v1/flashcard-sessions/" + id),
      [id],
    ),
    [flipped, setFlipped] = useState(false),
    a = useAction();
  const item = s.data?.items.find((r: Row) => r.status === "pending");
  useEffect(() => setFlipped(false), [item?.id]);
  async function rate(rating: string) {
    await mutate("learning", "/v1/flashcard-items/" + item.id + "/rate", {
      rating,
    });
    s.reload();
  }
  return (
    <>
      <Title
        eyebrow="KHOẢNG NHỎ ĐỂ GHI NHỚ"
        title="Chậm lại. Nhớ thêm một từ."
        description="Lật thẻ, tự kiểm tra và chọn mức độ ghi nhớ của bạn."
      />
      <Notice>{a.error}</Notice>
      <Load state={s}>
        {item ? (
          <>
            <div className="review-count">
              {s.data!.items.filter((r: Row) => r.status !== "pending").length}{" "}
              / {s.data!.items.length} thẻ đã xử lý
            </div>
            <button
              className={"review-card " + (flipped ? "flipped" : "")}
              onClick={() => setFlipped(!flipped)}
              aria-label={flipped ? "Xem mặt trước" : "Lật thẻ"}
            >
              <span className="eyebrow">
                {flipped ? "NGHĨA & VÍ DỤ" : "BẠN CÓ NHỚ TỪ NÀY?"}
              </span>
              <strong>
                {flipped ? item.card_snapshot.meaning : item.card_snapshot.word}
              </strong>
              <p>
                {flipped
                  ? item.card_snapshot.example
                  : item.card_snapshot.phonetic}
              </p>
              <small>
                <RotateCcw size={15} />
                Nhấn để lật thẻ
              </small>
            </button>
            {flipped && (
              <div className="review-actions">
                <button
                  className="secondary"
                  disabled={a.busy}
                  onClick={() => a.run(() => rate("again"))}
                >
                  Chưa nhớ
                </button>
                <button
                  disabled={a.busy}
                  onClick={() => a.run(() => rate("remember"))}
                >
                  Đã nhớ <Check size={18} />
                </button>
              </div>
            )}
            <button
              className="text-link"
              disabled={a.busy}
              onClick={() =>
                a.run(async () => {
                  await api(
                    "learning",
                    "/v1/flashcard-sessions/" + id + "/cancel",
                    "POST",
                    { expectedVersion: Number(s.data!.row_version) },
                  );
                  go("/cards");
                })
              }
            >
              Kết thúc lượt ôn
            </button>
          </>
        ) : (
          <Empty title="Đã xong lượt ôn này!">
            <p>
              Thẻ bị xóa hoặc thay đổi được tự bỏ qua. Hẹn bạn ở lần ôn tới.
            </p>
            <Link to="/cards">Về bộ từ vựng</Link>
          </Empty>
        )}
      </Load>
    </>
  );
}
