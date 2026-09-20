import { useState, useEffect, useRef } from "react";
import { Search, Headphones, StickyNote, ArrowRight } from "lucide-react";
import { api, mutate, go, date, statusText, type Row } from "./api";
import {
  Title,
  Notice,
  Load,
  Empty,
  Pager,
  Link,
  useAction,
  useLoad,
} from "./ui";
import { useUnsaved } from "./navigation";

export function SearchBox() {
  const [q, setQ] = useState("");
  return (
    <form
      className="global-search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim().length >= 2)
          go("/search?q=" + encodeURIComponent(q.trim()));
      }}
    >
      <label className="sr-only" htmlFor="global-search">
        Tìm kiếm học liệu
      </label>
      <input
        id="global-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        minLength={2}
        maxLength={100}
        placeholder="Tìm bài học, từ vựng…"
      />
      <button aria-label="Tìm kiếm" type="submit">
        <Search size={17} />
      </button>
    </form>
  );
}
export function SearchPage({ query }: { query: string }) {
  const params = new URLSearchParams(query),
    q = params.get("q") ?? "",
    type = params.get("type") ?? "all",
    course = params.get("course_id") ?? "",
    p = Math.max(1, Number(params.get("page")) || 1);
  const [draft, setDraft] = useState(q),
    [data, setData] = useState<Row>(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  const catalog = useLoad(() => api("content", "/v1/catalog"));
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    next.set("page", "1");
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    go("/search?" + next.toString());
  }
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setData(undefined);
    if (q.trim().length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api(
        "content",
        `/v1/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&page=${p}${course ? "&course_id=" + encodeURIComponent(course) : ""}`,
        "GET",
        undefined,
        undefined,
        controller.signal,
      )
        .then((r) => {
          if (!controller.signal.aborted) setData(r);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tick]);
  return (
    <>
      <Title
        title="Tìm điều bạn muốn học."
        description="Tìm lộ trình, chủ đề, bài học và từ vựng."
      />
      <label>
        Từ khóa
        <input
          autoFocus
          value={draft}
          minLength={2}
          maxLength={100}
          onChange={(e) => {
            setDraft(e.target.value);
            update({ q: e.target.value });
          }}
        />
      </label>
      <div className="toolbar">
        <div className="tabs">
          {[
            ["all", "Tất cả"],
            ["course", "Lộ trình"],
            ["topic", "Chủ đề"],
            ["lesson", "Bài học"],
            ["vocabulary", "Từ vựng"],
          ].map(([v, label]) => (
            <button
              key={v}
              className={type === v ? "selected" : ""}
              onClick={() => update({ type: v })}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          Lộ trình
          <select
            value={course}
            onChange={(e) => update({ course_id: e.target.value })}
          >
            <option value="">Tất cả lộ trình</option>
            {catalog.data?.courses.map((c: Row) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {q.trim().length < 2 ? (
        <Empty title="Nhập ít nhất 2 ký tự để tìm kiếm" />
      ) : (
        <Load state={{ loading, error, reload: () => setTick((t) => t + 1) }}>
          <p>{data?.total ?? 0} kết quả</p>
          {data?.items.map((r: Row) => (
            <a
              className="card list-row"
              key={r.type + r.id}
              href={
                "#" +
                (r.lesson_id
                  ? "/lesson/" + r.lesson_id
                  : "/catalog?course_id=" +
                    r.course_id +
                    (r.topic_id ? "&topic_id=" + r.topic_id : ""))
              }
            >
              <Search size={19} />
              <div>
                <b>{r.title}</b>
                {r.meaning && <p>{r.meaning}</p>}
                <small>
                  {
                    (
                      {
                        course: "Lộ trình",
                        topic: "Chủ đề",
                        lesson: "Bài học",
                        vocabulary: "Từ vựng",
                      } as Row
                    )[r.type]
                  }
                </small>
              </div>
              {r.lesson_id && (
                <span className="tag">
                  {r.is_preview ? "Học thử" : "Cần đăng nhập"}
                </span>
              )}
              <ArrowRight size={16} />
            </a>
          ))}
          {data?.total === 0 && (
            <Empty title="Chưa tìm thấy nội dung phù hợp">
              <p>Thử từ khóa khác hoặc bỏ bộ lọc.</p>
            </Empty>
          )}
          <Pager
            page={p}
            setPage={(n) => update({ page: String(n) })}
            more={p * 20 < (data?.total ?? 0)}
          />
        </Load>
      )}
    </>
  );
}
export function NoteEditor({ lessonId }: { lessonId: string }) {
  const s = useLoad(
      () => api("learning", `/v1/lessons/${lessonId}/note`),
      [lessonId],
    ),
    a = useAction(),
    [value, setValue] = useState(""),
    [saved, setSaved] = useState("");
  useEffect(() => {
    if (s.data) {
      setValue(s.data.note?.content ?? "");
      setSaved(s.data.note?.content ?? "");
    }
  }, [s.data]);
  const dirty = value !== saved;
  useUnsaved(dirty);
  return (
    <section className="card" id="my-note">
      <h2>
        <StickyNote size={20} /> Ghi chú của tôi
      </h2>
      <Load state={s}>
        <Notice>{a.error}</Notice>
        <Notice good>{a.success}</Notice>
        {s.data?.revision_changed && (
          <Notice good>
            Bài học có phiên bản mới kể từ lần bạn lưu ghi chú.
          </Notice>
        )}
        {s.data && !s.data.available && (
          <Notice>
            Bài học hiện không khả dụng. Ghi chú của bạn vẫn được giữ.
          </Notice>
        )}
        <label>
          Nội dung ghi chú
          <textarea
            aria-label="Nội dung ghi chú"
            rows={7}
            maxLength={5000}
            disabled={a.busy || (!s.data?.available && !s.data?.note)}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <div className="toolbar">
          <small aria-live="polite">
            {a.busy
              ? "Đang lưu…"
              : a.error
                ? "Lưu thất bại"
                : dirty
                  ? "Chưa lưu"
                  : s.data?.note
                    ? "Đã lưu"
                    : "Chưa có ghi chú"}{" "}
            · {value.length}/5000
          </small>
          <div className="actions">
            <button
              disabled={
                a.busy ||
                !value.trim() ||
                !dirty ||
                (!s.data?.available && !s.data?.note)
              }
              onClick={() =>
                a.run(async () => {
                  const note = await api(
                    "learning",
                    `/v1/lessons/${lessonId}/note`,
                    "PUT",
                    {
                      content: value,
                      expectedVersion: Number(s.data?.note?.row_version ?? 0),
                    },
                  );
                  setSaved(note.content);
                  setValue(note.content);
                  s.setData({ ...s.data, note, revision_changed: false });
                }, "Đã lưu ghi chú.")
              }
            >
              Lưu ghi chú
            </button>
            {s.data?.note && (
              <button
                className="secondary danger"
                disabled={a.busy}
                onClick={() => {
                  if (confirm("Xóa ghi chú của bài này?"))
                    a.run(async () => {
                      await api(
                        "learning",
                        `/v1/lessons/${lessonId}/note`,
                        "DELETE",
                        { expectedVersion: Number(s.data!.note.row_version) },
                      );
                      setValue("");
                      setSaved("");
                      s.setData({ ...s.data, note: null });
                    }, "Đã xóa ghi chú.");
                }}
              >
                Xóa ghi chú
              </button>
            )}
          </div>
        </div>
        {a.error && (
          <button
            className="text-link"
            onClick={() => {
              if (
                !dirty ||
                confirm("Tải bản ghi chú mới nhất và bỏ nội dung đang sửa?")
              )
                s.reload();
            }}
          >
            Tải lại dữ liệu
          </button>
        )}
      </Load>
    </section>
  );
}
export function NotesPage() {
  const [page, setPage] = useState(1),
    s = useLoad(() => api("learning", "/v1/notes?page=" + page), [page]),
    [editing, setEditing] = useState("");
  return (
    <>
      <Title
        title="Những điều muốn ghi nhớ."
        description="Ghi chú riêng của bạn, được giữ lại cùng hành trình học."
      />
      {editing && (
        <div>
          <button
            className="text-link"
            onClick={() => {
              if (
                confirm("Đóng phần sửa ghi chú? Thay đổi chưa lưu sẽ bị bỏ.")
              ) {
                setEditing("");
                s.reload();
              }
            }}
          >
            Đóng phần sửa
          </button>
          <NoteEditor key={editing} lessonId={editing} />
        </div>
      )}
      <Load state={s}>
        {s.data?.items.map((r: Row) => (
          <article className="card" key={r.id}>
            <h3>{r.current_title ?? r.title_snapshot}</h3>
            <p className="preserve">
              {r.content.slice(0, 220)}
              {r.content.length > 220 ? "…" : ""}
            </p>
            <small>
              {date(r.updated_at)}
              {!r.available
                ? " · Bài không khả dụng"
                : r.revision_changed
                  ? " · Bài có phiên bản mới"
                  : ""}
            </small>
            <div className="actions">
              <button
                className="secondary"
                onClick={() => {
                  if (
                    !editing ||
                    editing === r.lesson_id ||
                    confirm("Chuyển ghi chú? Thay đổi chưa lưu sẽ bị bỏ.")
                  )
                    setEditing(r.lesson_id);
                }}
              >
                Xem / sửa ghi chú
              </button>
              {r.available && (
                <Link className="text-link" to={"/lesson/" + r.lesson_id}>
                  Mở bài
                </Link>
              )}
            </div>
          </article>
        ))}
        {s.data?.items.length === 0 && (
          <Empty title="Bạn chưa lưu ghi chú nào">
            <Link to="/catalog">Khám phá bài học</Link>
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
export function LessonDictations({ lessonId }: { lessonId: string }) {
  const s = useLoad(
    () => api("content", "/v1/dictations?lesson_id=" + lessonId),
    [lessonId],
  );
  return (
    <section className="card">
      <h2>
        <Headphones size={20} /> Nghe và chép lại
      </h2>
      <Load state={s}>
        {s.data?.items.length ? (
          s.data.items.map((r: Row) => <DictationRow key={r.id} row={r} />)
        ) : (
          <p>Bài luyện nghe đang được chuẩn bị.</p>
        )}
        <Link className="text-link" to="/dictation">
          Thư viện luyện nghe
        </Link>
      </Load>
    </section>
  );
}
function DictationRow({ row }: { row: Row }) {
  const a = useAction();
  return (
    <div>
      <div className="list-row">
        <div>
          <b>{row.title}</b>
          <small>{row.lesson_title ?? row.instructions}</small>
        </div>
        <button
          className="secondary"
          disabled={a.busy}
          onClick={() =>
            a.run(async () => {
              const r = await mutate("learning", "/v1/dictation-attempts", {
                dictation_id: row.id,
              });
              go("/dictation-attempt/" + r.attempt_id);
            })
          }
        >
          Luyện nghe <ArrowRight size={16} />
        </button>
      </div>
      <Notice>{a.error}</Notice>
    </div>
  );
}
export function DictationPage() {
  const [tab, setTab] = useState("practice"),
    [course, setCourse] = useState(""),
    [topic, setTopic] = useState(""),
    [page, setPage] = useState(1);
  const catalog = useLoad(() => api("content", "/v1/catalog"));
  const s = useLoad(
    () =>
      tab === "history"
        ? api("learning", "/v1/dictation-attempts?page=" + page)
        : api(
            "content",
            `/v1/dictations?page=${page}${course ? "&course_id=" + course : ""}${topic ? "&topic_id=" + topic : ""}`,
          ),
    [tab, course, topic, page],
  );
  return (
    <>
      <Title
        title="Nghe kỹ hơn. Hiểu nhiều hơn."
        description="Nghe một đoạn ngắn, chép lại và khám phá những từ bạn còn bỏ lỡ."
      />
      <div className="tabs">
        {[
          ["practice", "Luyện nghe"],
          ["history", "Lịch sử Dictation"],
        ].map(([v, t]) => (
          <button
            className={tab === v ? "selected" : ""}
            key={v}
            onClick={() => {
              setTab(v);
              setPage(1);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "practice" && (
        <div className="form-grid">
          <label>
            Lộ trình
            <select
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setTopic("");
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {catalog.data?.courses.map((c: Row) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chủ đề
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {catalog.data?.courses
                .filter((c: Row) => !course || c.id === course)
                .flatMap((c: Row) => c.topics)
                .map((t: Row) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      <Load state={s}>
        <div className="card">
          {s.data?.items.map((r: Row) =>
            tab === "practice" ? (
              <DictationRow key={r.id} row={r} />
            ) : (
              <a
                className="list-row"
                key={r.id}
                href={"#/dictation-attempt/" + r.id}
              >
                <div>
                  <b>{r.title_snapshot}</b>
                  <small>
                    {date(r.created_at)} · {statusText(r.status)}
                  </small>
                </div>
                {r.score !== null && <span className="tag">{r.score}%</span>}
                <ArrowRight size={16} />
              </a>
            ),
          )}
          {s.data?.items.length === 0 && (
            <Empty
              title={
                tab === "practice"
                  ? "Chưa có bài luyện phù hợp"
                  : "Chưa có lịch sử luyện nghe"
              }
            />
          )}
        </div>
        <Pager
          page={page}
          setPage={setPage}
          more={s.data?.items.length === 20}
        />
      </Load>
    </>
  );
}
export function DictationAttempt({ id }: { id: string }) {
  const s = useLoad(
      () => api("learning", "/v1/dictation-attempts/" + id),
      [id],
    ),
    a = useAction(),
    [answer, setAnswer] = useState(""),
    [saved, setSaved] = useState(""),
    [rate, setRate] = useState("1"),
    [audioError, setAudioError] = useState(false),
    audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (s.data) {
      setAnswer(s.data.answer);
      setSaved(s.data.answer);
      setAudioError(false);
    }
  }, [s.data]);
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = Number(rate);
  }, [rate, s.data]);
  const d = s.data,
    active = d?.status === "in_progress";
  useUnsaved(!!active && answer !== saved);
  return (
    <Load state={s}>
      {d && (
        <>
          <Title
            eyebrow="DICTATION · LUYỆN NGHE"
            title={d.title}
            description={d.instructions}
          />
          <Notice>{a.error}</Notice>
          <Notice good>{a.success}</Notice>
          <div className="card">
            <p>Nghe lại tùy ý. Kết quả luyện tập không ảnh hưởng điểm quiz.</p>
            {d.audio_url && !audioError ? (
              <audio
                ref={audio}
                controls
                src={d.audio_url}
                onError={() => setAudioError(true)}
                aria-label="Audio Dictation"
              />
            ) : (
              <Notice>
                Không tải được audio. Lưu bản chép rồi tải lại trang để lấy
                đường dẫn mới.
              </Notice>
            )}
            <label>
              Tốc độ nghe
              <select
                aria-label="Tốc độ nghe"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              >
                <option value="0.75">0,75×</option>
                <option value="1">1×</option>
                <option value="1.25">1,25×</option>
              </select>
            </label>
            <label>
              Bản chép của bạn
              <textarea
                aria-label="Bản chép của bạn"
                rows={7}
                maxLength={10000}
                value={answer}
                disabled={!active || a.busy}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </label>
            <small aria-live="polite">
              {a.busy
                ? "Đang xử lý…"
                : a.error
                  ? "Thao tác chưa hoàn tất"
                  : answer !== saved
                    ? "Chưa lưu"
                    : "Đã đồng bộ"}
            </small>
            {active && (
              <div className="actions">
                <button
                  className="secondary"
                  disabled={a.busy || answer === saved}
                  onClick={() =>
                    a.run(async () => {
                      const r = await api(
                        "learning",
                        `/v1/dictation-attempts/${id}/answer`,
                        "PUT",
                        { answer, expectedVersion: Number(d.row_version) },
                      );
                      setSaved(answer);
                      s.setData({ ...d, ...r });
                    }, "Đã lưu bản chép.")
                  }
                >
                  Lưu bản chép
                </button>
                <button
                  disabled={a.busy || !answer.trim()}
                  onClick={() =>
                    a.run(async () => {
                      const r = await mutate(
                        "learning",
                        `/v1/dictation-attempts/${id}/submit`,
                        { answer, expectedVersion: Number(d.row_version) },
                      );
                      setSaved(answer);
                      s.setData(r);
                    }, "Đã nộp bài luyện.")
                  }
                >
                  Nộp bài Dictation
                </button>
                <button
                  className="text-link danger"
                  disabled={a.busy}
                  onClick={() => {
                    if (confirm("Hủy lượt luyện này?"))
                      a.run(async () => {
                        await api(
                          "learning",
                          `/v1/dictation-attempts/${id}/cancel`,
                          "POST",
                          { expectedVersion: Number(d.row_version) },
                        );
                        setSaved(answer);
                        s.reload();
                      });
                  }}
                >
                  Hủy lượt
                </button>
              </div>
            )}
            {a.error && (
              <button
                className="text-link"
                onClick={() => {
                  if (
                    answer === saved ||
                    confirm("Tải dữ liệu mới và bỏ bản chép chưa lưu?")
                  )
                    s.reload();
                }}
              >
                Tải lại trạng thái từ máy chủ
              </button>
            )}
          </div>
          {d.status === "cancelled" && (
            <Notice>
              Lượt luyện đã hủy. Bản đã lưu vẫn được giữ trong lịch sử.
            </Notice>
          )}
          {d.status === "submitted" && (
            <section className="card">
              <span className="eyebrow">KẾT QUẢ LUYỆN TẬP</span>
              <h2>
                {Number(d.result.score).toFixed(1)}% · {d.result.correct}/
                {d.result.reference_count} từ đúng
              </h2>
              <p>
                {d.result.substitutions} sai · {d.result.missing} thiếu ·{" "}
                {d.result.extra} thừa. Điểm trừ cả từ thừa, không có ngưỡng đỗ.
              </p>
              <h3>Transcript chuẩn</h3>
              <p className="preserve">{d.transcript}</p>
              <h3>So sánh từng từ</h3>
              <div className="word-diff">
                {d.result.alignment.map((x: Row, n: number) => (
                  <span className={"diff-" + x.type} key={n}>
                    <small>
                      {
                        (
                          {
                            correct: "Đúng",
                            substitution: "Sai",
                            missing: "Thiếu",
                            extra: "Thừa",
                          } as Row
                        )[x.type]
                      }
                    </small>
                    {x.type === "correct" ? (
                      x.actual
                    ) : x.type === "substitution" ? (
                      <>
                        <del>{x.actual}</del> → {x.expected}
                      </>
                    ) : (
                      (x.expected ?? <del>{x.actual}</del>)
                    )}
                  </span>
                ))}
              </div>
              <button
                disabled={a.busy}
                onClick={() =>
                  a.run(async () => {
                    const r = await mutate(
                      "learning",
                      "/v1/dictation-attempts",
                      { dictation_id: d.dictation_id },
                    );
                    go("/dictation-attempt/" + r.attempt_id);
                  })
                }
              >
                Luyện lại
              </button>
            </section>
          )}
          <Link to="/dictation" className="text-link">
            Về thư viện luyện nghe
          </Link>
        </>
      )}
    </Load>
  );
}
