import { useState } from "react";
import { DictationAdmin } from "./dictation-admin";
import { api, statusText, type Row } from "./api";
import { Title, Load, Notice, Empty, Pager, useLoad, useAction } from "./ui";
const can = (me: Row, p: string) =>
  me.role === "admin" || me.permissions.includes(p);
const labels: Record<string, string> = {
  content: "Học liệu",
  users: "Tài khoản",
  reports: "Báo cáo",
};
export default function Admin({ me }: { me: Row }) {
  const choices = [
    ...(can(me, "content.write") || can(me, "content.publish")
      ? ["content"]
      : []),
    ...(can(me, "learners.manage") ? ["users"] : []),
    ...(can(me, "reports.view") ? ["reports"] : []),
  ];
  const [tab, setTab] = useState(choices[0] ?? "");
  return (
    <>
      <Title
        eyebrow="KHÔNG GIAN QUẢN TRỊ"
        title="Chăm chút từng trải nghiệm học."
        description="Biên soạn, xuất bản và theo dõi hoạt động của người học."
      />
      <div className="tabs admin-tabs">
        {choices.map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {labels[t]}
          </button>
        ))}
      </div>
      {tab === "content" ? (
        <Content me={me} />
      ) : tab === "users" ? (
        <Users me={me} />
      ) : tab === "reports" ? (
        <Reports />
      ) : (
        <Empty title="Tài khoản chưa được cấp quyền quản trị" />
      )}
    </>
  );
}
function Users({ me }: { me: Row }) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState<Row | null>(null),
    s = useLoad(
      () =>
        api(
          "identity",
          `/v1/admin/users?page=${page}&q=${encodeURIComponent(q)}`,
        ),
      [page, q],
    ),
    a = useAction();
  const permissions = [
    ["content.write", "Biên soạn nội dung"],
    ["content.publish", "Xuất bản nội dung"],
    ["learners.manage", "Quản lý người học"],
    ["reports.view", "Xem báo cáo"],
  ];
  return (
    <>
      <label>
        Tìm tài khoản
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tên hoặc email"
        />
      </label>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      {editing && (
        <div className="card">
          <h2>{editing.display_name || editing.email_cached}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
                if (editing.mode === "permissions")
                  await api(
                    "identity",
                    "/v1/admin/users/" + editing.user_id + "/editor",
                    "PUT",
                    {
                      enabled: editing.enabled,
                      permissions: editing.permissions,
                      expectedVersion: Number(editing.row_version),
                    },
                  );
                else
                  await api(
                    "identity",
                    "/v1/admin/users/" + editing.user_id,
                    "PATCH",
                    {
                      status: editing.newStatus,
                      reason: editing.reason || undefined,
                      expectedVersion: Number(editing.row_version),
                    },
                  );
                setEditing(null);
                s.reload();
              }, "Đã cập nhật tài khoản.");
            }}
          >
            {editing.mode === "permissions" ? (
              <>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={editing.enabled}
                    onChange={(e) =>
                      setEditing({ ...editing, enabled: e.target.checked })
                    }
                  />
                  Cấp vai trò Editor
                </label>
                {permissions.map(([v, l]) => (
                  <label key={v} className="check-label">
                    <input
                      type="checkbox"
                      disabled={!editing.enabled}
                      checked={editing.permissions.includes(v)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          permissions: e.target.checked
                            ? [...editing.permissions, v]
                            : editing.permissions.filter(
                                (p: string) => p !== v,
                              ),
                        })
                      }
                    />
                    {l}
                  </label>
                ))}
                <small>
                  Lưu sẽ thay thế bộ quyền hiện tại bằng các quyền đã chọn.
                </small>
              </>
            ) : (
              <>
                <label>
                  Trạng thái
                  <select
                    value={editing.newStatus}
                    onChange={(e) =>
                      setEditing({ ...editing, newStatus: e.target.value })
                    }
                  >
                    <option value="active">Hoạt động</option>
                    <option value="locked">Khóa</option>
                    <option value="disabled">Vô hiệu hóa</option>
                  </select>
                </label>
                <label>
                  Lý do
                  <input
                    required={editing.newStatus !== "active"}
                    value={editing.reason}
                    onChange={(e) =>
                      setEditing({ ...editing, reason: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <div className="actions">
              <button disabled={a.busy}>Lưu thay đổi</button>
              <button
                className="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                Đóng
              </button>
            </div>
          </form>
        </div>
      )}
      <Load state={s}>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {s.data?.items.map((r: Row) => (
                <tr key={r.user_id}>
                  <td>
                    <b>{r.display_name}</b>
                    <small>{r.email_cached}</small>
                  </td>
                  <td>{r.role}</td>
                  <td>
                    <span className="tag">{statusText(r.status)}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="text-link"
                        onClick={() =>
                          setEditing({
                            ...r,
                            mode: "status",
                            newStatus: r.status,
                            reason: "",
                          })
                        }
                      >
                        Trạng thái
                      </button>
                      {me.role === "admin" && r.role !== "admin" && (
                        <button
                          className="text-link"
                          onClick={() =>
                            setEditing({
                              ...r,
                              mode: "permissions",
                              enabled: r.role === "editor",
                              permissions: [],
                            })
                          }
                        >
                          Phân quyền
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
function Reports() {
  const today = new Date().toLocaleDateString("en-CA"),
    [from, setFrom] = useState(today.slice(0, 8) + "01"),
    [to, setTo] = useState(today),
    s = useLoad(
      () => api("learning", `/v1/admin/reports?from=${from}&to=${to}`),
      [from, to],
    );
  return (
    <>
      <div className="form-grid">
        <label>
          Từ ngày
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <Load state={s}>
        <div className="stats-grid">
          <div className="card stat">
            <strong>{s.data?.active_users ?? 0}</strong>
            <h3>Người học hoạt động</h3>
            <p>Nộp bài hoặc ôn thẻ trong kỳ</p>
          </div>
          {s.data?.attempts.map((r: Row) => (
            <div className="card stat" key={r.kind}>
              <strong>{r.attempt_count}</strong>
              <h3>{r.kind === "quiz" ? "Lượt quiz" : "Lượt kiểm tra"}</h3>
              <p>Điểm trung bình: {r.average_score}%</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>Hoạt động theo ngày</h2>
          <p>Ngày được tính theo giờ Việt Nam.</p>
          {s.data?.daily_activity.length ? (
            s.data.daily_activity.map((r: Row) => (
              <div className="report-row" key={r.day}>
                <span>{r.day}</span>
                <meter
                  min={0}
                  max={Math.max(
                    ...s.data!.daily_activity.map((x: Row) => x.active_users),
                  )}
                  value={r.active_users}
                />
                <b>{r.active_users} người</b>
              </div>
            ))
          ) : (
            <p>Chưa có hoạt động trong khoảng ngày này.</p>
          )}
        </div>
      </Load>
    </>
  );
}
function Content({ me }: { me: Row }) {
  const s = useLoad(() => api("content", "/v1/admin/catalog")),
    a = useAction(),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("structure"),
    [form, setForm] = useState<Row | null>(null);
  const write = can(me, "content.write"),
    publish = can(me, "content.publish");
  const data = s.data;
  async function changeStatus(entity: string, r: Row) {
    await api("content", `/v1/admin/${entity}/${r.id}/status`, "PATCH", {
      status: r.status === "published" ? "hidden" : "published",
      expectedVersion: Number(r.row_version),
    });
    s.reload();
  }
  return (
    <>
      <div className="tabs">
        {[
          ["structure", "Cấu trúc"],
          ["lessons", "Soạn bài & đề"],
          ["vocabulary", "Từ vựng & audio"],
        ].map(([v, t]) => (
          <button
            key={v}
            className={tab === v ? "selected" : ""}
            onClick={() => setTab(v)}
          >
            {t}
          </button>
        ))}
      </div>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <Load state={s}>
        {data && (
          <>
            {tab === "structure" ? (
              <>
                {write && (
                  <div className="actions">
                    <button
                      onClick={() =>
                        setForm({
                          entity: "courses",
                          title: "",
                          description: "",
                          objectives: "",
                          level: "A1",
                          position: data.courses.length + 1,
                        })
                      }
                    >
                      + Lộ trình
                    </button>
                    <button
                      className="secondary"
                      disabled={!data.courses.length}
                      onClick={() =>
                        setForm({
                          entity: "topics",
                          title: "",
                          description: "",
                          objectives: "",
                          course_id: data.courses[0].id,
                          position: 1,
                        })
                      }
                    >
                      + Chủ đề
                    </button>
                    <button
                      className="secondary"
                      disabled={!data.topics.length}
                      onClick={() =>
                        setForm({
                          entity: "lessons",
                          topic_id: data.topics[0].id,
                          position: 1,
                          is_preview: false,
                        })
                      }
                    >
                      + Bài học
                    </button>
                  </div>
                )}
                {form && (
                  <div className="card">
                    <h3>{form.id ? "Sửa thông tin" : "Thêm nội dung"}</h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        a.run(async () => {
                          const {
                            entity,
                            id,
                            row_version,
                            status,
                            published_revision_id,
                            catalog_version,
                            created_at,
                            updated_at,
                            first_published_at,
                            ...body
                          } = form;
                          const fields =
                            entity === "courses"
                              ? {
                                  title: body.title,
                                  description: body.description,
                                  objectives: body.objectives,
                                  level: body.level,
                                  position: Number(body.position),
                                }
                              : entity === "topics"
                                ? {
                                    title: body.title,
                                    description: body.description,
                                    objectives: body.objectives,
                                    position: Number(body.position),
                                    ...(!id
                                      ? { course_id: body.course_id }
                                      : {}),
                                  }
                                : {
                                    position: Number(body.position),
                                    is_preview: body.is_preview,
                                    ...(!id ? { topic_id: body.topic_id } : {}),
                                  };
                          await api(
                            "content",
                            `/v1/admin/${entity}${id ? "/" + id + "/metadata" : ""}`,
                            id ? "PATCH" : "POST",
                            {
                              ...fields,
                              ...(id
                                ? { expectedVersion: Number(row_version) }
                                : {}),
                            },
                          );
                          setForm(null);
                          s.reload();
                        }, "Đã lưu nội dung.");
                      }}
                    >
                      {!form.id && form.entity === "topics" && (
                        <Pick
                          label="Lộ trình"
                          value={form.course_id}
                          rows={data.courses}
                          onChange={(v) => setForm({ ...form, course_id: v })}
                        />
                      )}
                      {!form.id && form.entity === "lessons" && (
                        <Pick
                          label="Chủ đề"
                          value={form.topic_id}
                          rows={data.topics}
                          onChange={(v) => setForm({ ...form, topic_id: v })}
                        />
                      )}
                      {form.entity !== "lessons" && (
                        <>
                          {[
                            ["title", "Tên"],
                            ["description", "Mô tả"],
                            ["objectives", "Mục tiêu"],
                            ...(form.entity === "courses"
                              ? [["level", "Trình độ"]]
                              : []),
                          ].map(([k, l]) => (
                            <label key={k}>
                              {l}
                              <input
                                required={k === "title" || k === "level"}
                                value={form[k] ?? ""}
                                onChange={(e) =>
                                  setForm({ ...form, [k]: e.target.value })
                                }
                              />
                            </label>
                          ))}
                        </>
                      )}
                      <label>
                        Thứ tự
                        <input
                          type="number"
                          min={1}
                          required
                          value={form.position}
                          onChange={(e) =>
                            setForm({ ...form, position: e.target.value })
                          }
                        />
                      </label>
                      {form.entity === "lessons" && (
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={form.is_preview}
                            onChange={(e) =>
                              setForm({ ...form, is_preview: e.target.checked })
                            }
                          />
                          Cho phép học thử
                        </label>
                      )}
                      <div className="actions">
                        <button disabled={a.busy}>Lưu</button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setForm(null)}
                        >
                          Đóng
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {data.courses.map((c: Row) => (
                  <div className="card" key={c.id}>
                    <div className="section-heading">
                      <h2>{c.title}</h2>
                      <div className="actions">
                        <span className="tag">{statusText(c.status)}</span>
                        {write && (
                          <button
                            className="text-link"
                            onClick={() => setForm({ ...c, entity: "courses" })}
                          >
                            Sửa
                          </button>
                        )}
                        {publish && (
                          <button
                            className="text-link"
                            disabled={a.busy}
                            onClick={() =>
                              a.run(() => changeStatus("courses", c))
                            }
                          >
                            {c.status === "published" ? "Ẩn" : "Xuất bản"}
                          </button>
                        )}
                      </div>
                    </div>
                    {data.topics
                      .filter((t: Row) => t.course_id === c.id)
                      .map((t: Row) => (
                        <div className="topic" key={t.id}>
                          <div className="section-heading">
                            <h3>{t.title}</h3>
                            <div className="actions">
                              <span className="tag">
                                {statusText(t.status)}
                              </span>
                              {write && (
                                <button
                                  className="text-link"
                                  onClick={() =>
                                    setForm({ ...t, entity: "topics" })
                                  }
                                >
                                  Sửa
                                </button>
                              )}
                              {publish && (
                                <button
                                  className="text-link"
                                  disabled={a.busy}
                                  onClick={() =>
                                    a.run(() => changeStatus("topics", t))
                                  }
                                >
                                  {t.status === "published" ? "Ẩn" : "Xuất bản"}
                                </button>
                              )}
                            </div>
                          </div>
                          {data.lessons
                            .filter((l: Row) => l.topic_id === t.id)
                            .map((l: Row) => (
                              <div className="lesson-row" key={l.id}>
                                <span>Bài {l.position}</span>
                                <span className="tag">
                                  {statusText(l.status)}
                                </span>
                                <button
                                  className="text-link"
                                  onClick={() => {
                                    setSelected(l.id);
                                    setTab("lessons");
                                  }}
                                >
                                  Mở biên soạn
                                </button>
                                {write && (
                                  <button
                                    className="text-link"
                                    onClick={() =>
                                      setForm({ ...l, entity: "lessons" })
                                    }
                                  >
                                    Sửa
                                  </button>
                                )}
                                {publish && l.status === "published" && (
                                  <button
                                    className="text-link"
                                    onClick={() =>
                                      a.run(() => changeStatus("lessons", l))
                                    }
                                  >
                                    Ẩn
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
              </>
            ) : tab === "vocabulary" ? (
              <Vocabulary write={write} />
            ) : (
              <>
                <Pick
                  label="Chọn bài học để biên soạn"
                  value={selected}
                  rows={data.lessons.map((l: Row) => ({
                    ...l,
                    title: `${data.topics.find((t: Row) => t.id === l.topic_id)?.title} — Bài ${l.position} (${statusText(l.status)})`,
                  }))}
                  onChange={setSelected}
                />
                {selected && (
                  <LessonEditor
                    key={selected}
                    lesson={data.lessons.find((l: Row) => l.id === selected)}
                    catalog={data}
                    write={write}
                    publish={publish}
                    refresh={s.reload}
                  />
                )}
              </>
            )}
          </>
        )}
      </Load>
    </>
  );
}
function Pick({
  label,
  value,
  rows,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  rows: Row[];
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <label>
      {label}
      <select
        required={!optional}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{optional ? "Không chọn" : "Chọn…"}</option>
        {rows.map((r) => (
          <option value={r.id} key={r.id}>
            {r.title ?? r.word ?? r.object_key ?? r.id}
          </option>
        ))}
      </select>
    </label>
  );
}
function Vocabulary({ write }: { write: boolean }) {
  const s = useLoad(() => api("content", "/v1/admin/vocabulary")),
    a = useAction(),
    [v, setV] = useState<Row>({
      word: "",
      meaning: "",
      example: "",
      phonetic: "",
      audio_asset_id: null,
    }),
    [file, setFile] = useState<File | null>(null),
    media = useLoad(() => api("content", "/v1/admin/media"));
  return (
    <>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      {write && (
        <div className="two-col">
          <div className="card">
            <h2>{v.id ? "Sửa từ vựng" : "Thêm từ vựng"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.run(async () => {
                  const b = {
                    word: v.word,
                    meaning: v.meaning,
                    example: v.example,
                    phonetic: v.phonetic || null,
                    audio_asset_id: v.audio_asset_id || null,
                  };
                  await api(
                    "content",
                    v.id
                      ? `/v1/admin/vocabulary_entries/${v.id}/metadata`
                      : "/v1/admin/vocabulary",
                    v.id ? "PATCH" : "POST",
                    v.id
                      ? {
                          ...b,
                          status: v.status,
                          expectedVersion: Number(v.row_version),
                        }
                      : b,
                  );
                  setV({
                    word: "",
                    meaning: "",
                    example: "",
                    phonetic: "",
                    audio_asset_id: null,
                  });
                  s.reload();
                }, "Đã lưu từ vựng.");
              }}
            >
              {[
                ["word", "Từ"],
                ["meaning", "Nghĩa"],
                ["example", "Ví dụ"],
                ["phonetic", "Phiên âm"],
              ].map(([k, l]) => (
                <label key={k}>
                  {l}
                  <input
                    required={k === "word" || k === "meaning"}
                    value={v[k] ?? ""}
                    onChange={(e) => setV({ ...v, [k]: e.target.value })}
                  />
                </label>
              ))}
              <Pick
                label="Audio"
                value={v.audio_asset_id}
                rows={media.data?.items ?? []}
                optional
                onChange={(x) => setV({ ...v, audio_asset_id: x })}
              />
              <button disabled={a.busy}>Lưu từ vựng</button>
            </form>
          </div>
          <div className="card">
            <h2>Thư viện audio</h2>
            <p>MP3 hoặc M4A, tối đa 10 MB.</p>
            <label>
              Chọn tệp
              <input
                type="file"
                accept="audio/mpeg,audio/mp4,.mp3,.m4a"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              disabled={a.busy || !file}
              onClick={() =>
                a.run(async () => {
                  if (!file || file.size > 10485760)
                    throw new Error("Tệp phải nhỏ hơn 10 MB.");
                  const mime = file.name.toLowerCase().endsWith(".mp3")
                    ? "audio/mpeg"
                    : "audio/mp4";
                  const r = await api(
                    "content",
                    "/v1/admin/media",
                    "POST",
                    new Blob([file], { type: mime }),
                  );
                  setV({ ...v, audio_asset_id: r.id });
                  media.reload();
                }, "Đã tải audio. Có thể chọn cho từ vựng hoặc bài học.")
              }
            >
              Tải audio
            </button>
            <Load state={media}>
              {media.data?.items.map((m: Row) => (
                <p className="file-row" key={m.id}>
                  {m.object_key.split("/").at(-1)}{" "}
                  <small>{Math.round(m.size_bytes / 1024)} KB</small>
                </p>
              ))}
            </Load>
          </div>
        </div>
      )}
      <Load state={s}>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Từ</th>
                <th>Nghĩa</th>
                <th>Ví dụ</th>
                {write && <th />}
              </tr>
            </thead>
            <tbody>
              {s.data?.items.map((r: Row) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.word}</b>
                    <small>{r.phonetic}</small>
                  </td>
                  <td>{r.meaning}</td>
                  <td>{r.example}</td>
                  {write && (
                    <td>
                      <button
                        className="text-link"
                        onClick={() => {
                          setV(r);
                          window.scrollTo(0, 0);
                        }}
                      >
                        Sửa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Load>
    </>
  );
}
function LessonEditor({
  lesson,
  catalog,
  write,
  publish,
  refresh,
}: {
  lesson: Row;
  catalog: Row;
  write: boolean;
  publish: boolean;
  refresh: () => void;
}) {
  const s = useLoad(async () => {
    const [revisions, vocab, media] = await Promise.all([
      api("content", `/v1/admin/lessons/${lesson.id}/revisions`),
      api("content", "/v1/admin/vocabulary"),
      api("content", "/v1/admin/media"),
    ]);
    return {
      revisions: revisions.items,
      vocab: vocab.items,
      media: media.items,
    };
  }, [lesson.id]);
  const [draft, setDraft] = useState<Row | null>(null),
    a = useAction();
  function changeBlock(index: number, fields: Row) {
    setDraft({
      ...draft!,
      blocks: draft!.blocks.map((b: Row, n: number) =>
        n === index ? { ...b, ...fields } : b,
      ),
    });
  }
  return (
    <>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <Load state={s}>
        <div className="card">
          <div className="section-heading">
            <h2>Nội dung bài học</h2>
            {write && (
              <button
                className="secondary"
                onClick={() => {
                  const current = s.data!.revisions[0];
                  setDraft(
                    current
                      ? {
                          ...current,
                          ...(current.published_at
                            ? { id: null, row_version: null }
                            : {}),
                          blocks: structuredClone(current.blocks),
                        }
                      : {
                          title: "",
                          objectives: "",
                          blocks: [
                            { id: crypto.randomUUID(), type: "text", body: "" },
                          ],
                        },
                  );
                }}
              >
                Soạn bản nháp
              </button>
            )}
          </div>
          {s.data?.revisions.map((r: Row) => (
            <div className="list-row" key={r.id}>
              <div>
                <b>{r.title}</b>
                <small>
                  Phiên bản {r.revision_no} ·{" "}
                  {r.published_at ? "Đã xuất bản" : "Bản nháp"}
                </small>
              </div>
              {write && !r.published_at && (
                <button
                  className="text-link"
                  onClick={() => setDraft(structuredClone(r))}
                >
                  Chỉnh sửa
                </button>
              )}
              <details>
                <summary>Xem trước</summary>
                <p>{r.objectives}</p>
                {r.blocks.map((b: Row) => (
                  <p className="preserve" key={b.id}>
                    {b.body ??
                      b.transcript ??
                      (b.type === "vocabulary"
                        ? b.vocabulary_ids
                            .map(
                              (id: string) =>
                                s.data!.vocab.find((v: Row) => v.id === id)
                                  ?.word,
                            )
                            .join(", ")
                        : "Audio")}
                  </p>
                ))}
              </details>
            </div>
          ))}
        </div>
        {draft && (
          <div className="card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.run(async () => {
                  const body = {
                    title: draft.title,
                    objectives: draft.objectives,
                    blocks: draft.blocks,
                  };
                  await api(
                    "content",
                    draft.id
                      ? `/v1/admin/lesson-revisions/${draft.id}`
                      : `/v1/admin/lessons/${lesson.id}/revisions`,
                    draft.id ? "PATCH" : "POST",
                    {
                      ...body,
                      ...(draft.id
                        ? { expectedVersion: Number(draft.row_version) }
                        : {}),
                    },
                  );
                  setDraft(null);
                  s.reload();
                }, "Đã lưu bản nháp bài học.");
              }}
            >
              <label>
                Tiêu đề bài
                <input
                  required
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <label>
                Mục tiêu
                <textarea
                  required
                  value={draft.objectives}
                  onChange={(e) =>
                    setDraft({ ...draft, objectives: e.target.value })
                  }
                />
              </label>
              {draft.blocks.map((b: Row, index: number) => (
                <div className="block-editor" key={b.id}>
                  <div className="section-heading">
                    <b>
                      Khối {index + 1} ·{" "}
                      {
                        (
                          {
                            text: "Văn bản",
                            grammar: "Ngữ pháp",
                            reading: "Bài đọc",
                            audio: "Audio",
                            vocabulary: "Từ vựng",
                          } as Row
                        )[b.type]
                      }
                    </b>
                    <button
                      type="button"
                      className="text-link danger"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          blocks: draft.blocks.filter(
                            (_: Row, n: number) => n !== index,
                          ),
                        })
                      }
                    >
                      Bỏ khối
                    </button>
                  </div>
                  {b.type === "audio" ? (
                    <>
                      <Pick
                        label="Tệp audio"
                        value={b.asset_id}
                        rows={s.data!.media}
                        onChange={(v) => changeBlock(index, { asset_id: v })}
                      />
                      <label>
                        Transcript
                        <textarea
                          required
                          value={b.transcript}
                          onChange={(e) =>
                            changeBlock(index, { transcript: e.target.value })
                          }
                        />
                      </label>
                    </>
                  ) : b.type === "vocabulary" ? (
                    <div className="checkbox-grid">
                      {s
                        .data!.vocab.filter((v: Row) => v.status === "active")
                        .map((v: Row) => (
                          <label className="check-label" key={v.id}>
                            <input
                              type="checkbox"
                              checked={b.vocabulary_ids.includes(v.id)}
                              onChange={(e) =>
                                changeBlock(index, {
                                  vocabulary_ids: e.target.checked
                                    ? [...b.vocabulary_ids, v.id]
                                    : b.vocabulary_ids.filter(
                                        (id: string) => id !== v.id,
                                      ),
                                })
                              }
                            />
                            {v.word} — {v.meaning}
                          </label>
                        ))}
                    </div>
                  ) : (
                    <label>
                      Nội dung
                      <textarea
                        rows={5}
                        required
                        value={b.body}
                        onChange={(e) =>
                          changeBlock(index, { body: e.target.value })
                        }
                      />
                    </label>
                  )}
                </div>
              ))}
              <div className="actions">
                {[
                  ["text", "Văn bản"],
                  ["grammar", "Ngữ pháp"],
                  ["reading", "Bài đọc"],
                  ["audio", "Audio"],
                  ["vocabulary", "Từ vựng"],
                ].map(([type, label]) => (
                  <button
                    className="secondary"
                    type="button"
                    key={type}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        blocks: [
                          ...draft.blocks,
                          {
                            id: crypto.randomUUID(),
                            type,
                            ...(type === "audio"
                              ? { asset_id: "", transcript: "" }
                              : type === "vocabulary"
                                ? { vocabulary_ids: [] }
                                : { body: "" }),
                          },
                        ],
                      })
                    }
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <div className="actions">
                <button disabled={a.busy || !draft.blocks.length}>
                  Lưu bản nháp
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setDraft(null)}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        )}
        <Questions lesson={lesson} media={s.data?.media ?? []} write={write} />
        <DictationAdmin
          lessonId={lesson.id}
          media={s.data?.media ?? []}
          write={write}
          publish={publish}
        />
        <Assessments
          lesson={lesson}
          catalog={catalog}
          revisions={s.data?.revisions ?? []}
          write={write}
          publish={publish}
          refresh={() => {
            s.reload();
            refresh();
          }}
        />
      </Load>
    </>
  );
}
function Questions({
  lesson,
  media,
  write,
}: {
  lesson: Row;
  media: Row[];
  write: boolean;
}) {
  const [page, setPage] = useState(1),
    s = useLoad(
      () =>
        api(
          "content",
          `/v1/admin/questions?lesson_id=${lesson.id}&page=${page}`,
        ),
      [lesson.id, page],
    ),
    [q, setQ] = useState<Row | null>(null),
    a = useAction();
  return (
    <div className="card">
      <div className="section-heading">
        <h2>Câu hỏi trong bài</h2>
        {write && (
          <button
            className="secondary"
            onClick={() =>
              setQ({
                type: "single_choice",
                prompt: "",
                passage: "",
                audio_asset_id: "",
                options: [
                  { option_key: "A", text: "" },
                  { option_key: "B", text: "" },
                ],
                correct_option_key: "A",
                acceptedText: "",
                explanation: "",
                transcript: "",
              })
            }
          >
            + Câu hỏi
          </button>
        )}
      </div>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <Load state={s}>
        {s.data?.items.map((r: Row) => (
          <div className="list-row" key={r.revision_id}>
            <div>
              <b>{r.prompt}</b>
              <small>
                Phiên bản {r.revision_no} ·{" "}
                {r.published_at ? "Đã xuất bản" : "Nháp"}
              </small>
            </div>
            {write && (
              <button
                className="text-link"
                disabled={a.busy}
                onClick={() =>
                  a.run(async () => {
                    const full = await api(
                      "content",
                      "/v1/admin/question-revisions/" + r.revision_id,
                    );
                    setQ({
                      ...full,
                      options: full.options.map((o: Row) => ({
                        option_key: o.option_key,
                        text: o.text,
                      })),
                      acceptedText: full.accepted_answers?.join("\n") ?? "",
                      ...(r.published_at ? { id: null } : {}),
                      question_id: r.id,
                    });
                  })
                }
              >
                {r.published_at ? "Tạo phiên bản mới" : "Sửa"}
              </button>
            )}
          </div>
        ))}
        <Pager
          page={page}
          setPage={setPage}
          more={s.data?.items.length === 20}
        />
      </Load>
      {q && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            a.run(async () => {
              const b = {
                type: q.type,
                prompt: q.prompt,
                passage: q.passage || null,
                audio_asset_id: q.audio_asset_id || null,
                options: q.type === "single_choice" ? q.options : [],
                correct_option_key:
                  q.type === "single_choice" ? q.correct_option_key : null,
                accepted_answers:
                  q.type === "fill_blank"
                    ? q.acceptedText
                        .split("\n")
                        .map((v: string) => v.trim())
                        .filter(Boolean)
                    : null,
                explanation: q.explanation,
                transcript: q.transcript || null,
              };
              await api(
                "content",
                q.id
                  ? `/v1/admin/question-revisions/${q.id}`
                  : q.question_id
                    ? `/v1/admin/questions/${q.question_id}/revisions`
                    : "/v1/admin/questions",
                q.id ? "PATCH" : "POST",
                {
                  ...b,
                  ...(q.id
                    ? { expectedVersion: Number(q.row_version) }
                    : q.question_id
                      ? {}
                      : { lesson_id: lesson.id }),
                },
              );
              setQ(null);
              s.reload();
            }, "Đã lưu câu hỏi.");
          }}
        >
          <label>
            Loại câu
            <select
              value={q.type}
              onChange={(e) => setQ({ ...q, type: e.target.value })}
            >
              <option value="single_choice">Trắc nghiệm một đáp án</option>
              <option value="fill_blank">Điền từ</option>
            </select>
          </label>
          <label>
            Câu hỏi
            <textarea
              required
              value={q.prompt}
              onChange={(e) => setQ({ ...q, prompt: e.target.value })}
            />
          </label>
          <label>
            Đoạn đọc (nếu có)
            <textarea
              value={q.passage ?? ""}
              onChange={(e) => setQ({ ...q, passage: e.target.value })}
            />
          </label>
          <Pick
            label="Audio"
            value={q.audio_asset_id}
            rows={media}
            optional
            onChange={(v) => setQ({ ...q, audio_asset_id: v })}
          />
          {q.type === "single_choice" ? (
            <>
              {q.options.map((o: Row, n: number) => (
                <label key={o.option_key}>
                  Lựa chọn {o.option_key}
                  <input
                    required
                    value={o.text}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        options: q.options.map((x: Row, i: number) =>
                          i === n ? { ...x, text: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={q.options.length >= 4}
                  onClick={() =>
                    setQ({
                      ...q,
                      options: [
                        ...q.options,
                        { option_key: "ABCD"[q.options.length], text: "" },
                      ],
                    })
                  }
                >
                  + Lựa chọn
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={q.options.length <= 2}
                  onClick={() =>
                    setQ({
                      ...q,
                      options: q.options.slice(0, -1),
                      correct_option_key: "A",
                    })
                  }
                >
                  Bỏ lựa chọn cuối
                </button>
              </div>
              <label>
                Đáp án đúng
                <select
                  value={q.correct_option_key ?? "A"}
                  onChange={(e) =>
                    setQ({ ...q, correct_option_key: e.target.value })
                  }
                >
                  {q.options.map((o: Row) => (
                    <option key={o.option_key}>{o.option_key}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label>
              Đáp án chấp nhận (mỗi dòng một đáp án)
              <textarea
                required
                value={q.acceptedText}
                onChange={(e) => setQ({ ...q, acceptedText: e.target.value })}
              />
            </label>
          )}
          <label>
            Giải thích
            <textarea
              required
              value={q.explanation}
              onChange={(e) => setQ({ ...q, explanation: e.target.value })}
            />
          </label>
          <label>
            Transcript (nếu có)
            <textarea
              value={q.transcript ?? ""}
              onChange={(e) => setQ({ ...q, transcript: e.target.value })}
            />
          </label>
          <div className="actions">
            <button disabled={a.busy}>Lưu câu hỏi</button>
            <button
              type="button"
              className="secondary"
              onClick={() => setQ(null)}
            >
              Đóng
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
function Assessments({
  lesson,
  catalog,
  revisions,
  write,
  publish,
  refresh,
}: {
  lesson: Row;
  catalog: Row;
  revisions: Row[];
  write: boolean;
  publish: boolean;
  refresh: () => void;
}) {
  const s = useLoad(() => api("content", "/v1/admin/assessments")),
    [form, setForm] = useState<Row | null>(null),
    [questions, setQuestions] = useState<Row[]>([]),
    [lessonRev, setLessonRev] = useState(""),
    a = useAction();
  async function edit(kind: string, existing?: Row) {
    const pool: Row[] = [];
    for (const l of kind === "quiz"
      ? [lesson]
      : catalog.lessons.filter((l: Row) => l.topic_id === lesson.topic_id)) {
      for (let page = 1; ; page++) {
        const r = await api(
          "content",
          `/v1/admin/questions?lesson_id=${l.id}&page=${page}`,
        );
        pool.push(...r.items);
        if (r.items.length < 20) break;
      }
    }
    setQuestions(pool);
    const full = existing
      ? await api(
          "content",
          "/v1/admin/assessment-revisions/" + existing.revision_id,
        )
      : null;
    setForm({
      kind,
      title: full?.title ?? "",
      question_revision_ids: full?.question_revision_ids ?? [],
      ...(existing && !existing.published_at
        ? { id: existing.revision_id, row_version: full!.row_version }
        : {}),
    });
  }
  return (
    <div className="card">
      <div className="section-heading">
        <h2>Quiz & kiểm tra chủ đề</h2>
        {write && (
          <div className="actions">
            <button
              className="secondary"
              disabled={a.busy}
              onClick={() => a.run(() => edit("quiz"))}
            >
              + Quiz
            </button>
            <button
              className="secondary"
              disabled={a.busy}
              onClick={() => a.run(() => edit("topic_test"))}
            >
              + Kiểm tra
            </button>
          </div>
        )}
      </div>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <Load state={s}>
        {s.data?.items
          .filter(
            (r: Row) =>
              r.lesson_id === lesson.id || r.topic_id === lesson.topic_id,
          )
          .map((r: Row) => (
            <div className="list-row wrap" key={r.revision_id}>
              <div>
                <b>{r.title}</b>
                <small>
                  {r.kind === "quiz" ? "Quiz bài học" : "Kiểm tra chủ đề"} ·
                  Phiên bản {r.revision_no} ·{" "}
                  {r.published_at ? "Đã xuất bản" : "Nháp"}
                </small>
              </div>
              {write && (
                <button
                  className="text-link"
                  disabled={a.busy}
                  onClick={() => a.run(() => edit(r.kind, r))}
                >
                  {r.published_at ? "Phiên bản mới" : "Sửa đề"}
                </button>
              )}
              {publish && !r.published_at && (
                <>
                  {r.kind === "quiz" && (
                    <Pick
                      label="Bản nháp bài để xuất bản"
                      value={lessonRev}
                      rows={revisions.filter((r) => !r.published_at)}
                      onChange={setLessonRev}
                    />
                  )}
                  <button
                    disabled={a.busy || (r.kind === "quiz" && !lessonRev)}
                    onClick={() =>
                      a.run(async () => {
                        if (
                          !confirm(
                            "Xuất bản nội dung? Phiên bản này sẽ không thể sửa sau khi xuất bản.",
                          )
                        )
                          return;
                        if (r.kind === "quiz")
                          await api(
                            "content",
                            `/v1/admin/lessons/${lesson.id}/publish`,
                            "POST",
                            {
                              lessonRevisionId: lessonRev,
                              assessmentRevisionId: r.revision_id,
                              expectedVersion: Number(lesson.row_version),
                            },
                          );
                        else
                          await api(
                            "content",
                            `/v1/admin/assessments/${r.id}/publish`,
                            "POST",
                            {
                              revisionId: r.revision_id,
                              expectedVersion: Number(r.row_version),
                            },
                          );
                        s.reload();
                        refresh();
                      }, "Đã xử lý xuất bản.")
                    }
                  >
                    Xuất bản
                  </button>
                </>
              )}
            </div>
          ))}
      </Load>
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            a.run(async () => {
              const common = {
                title: form.title,
                question_revision_ids: form.question_revision_ids,
              };
              await api(
                "content",
                form.id
                  ? `/v1/admin/assessment-revisions/${form.id}`
                  : "/v1/admin/assessments",
                form.id ? "PATCH" : "POST",
                form.id
                  ? { ...common, expectedVersion: Number(form.row_version) }
                  : {
                      ...common,
                      kind: form.kind,
                      lesson_id: form.kind === "quiz" ? lesson.id : null,
                      topic_id:
                        form.kind === "topic_test" ? lesson.topic_id : null,
                    },
              );
              setForm(null);
              s.reload();
            }, "Đã lưu đề nháp.");
          }}
        >
          <label>
            Tên đề
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <p>
            {form.kind === "quiz"
              ? "Chọn 5–10 câu của bài."
              : "Chọn 10–20 câu trong chủ đề."}{" "}
            Mỗi câu chỉ chọn một phiên bản. Thứ tự theo thứ tự chọn.
          </p>
          <div className="question-pool">
            {questions.map((q) => (
              <label className="check-label" key={q.revision_id}>
                <input
                  type="checkbox"
                  checked={form.question_revision_ids.includes(q.revision_id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question_revision_ids: e.target.checked
                        ? [...form.question_revision_ids, q.revision_id]
                        : form.question_revision_ids.filter(
                            (id: string) => id !== q.revision_id,
                          ),
                    })
                  }
                />
                {q.prompt} · v{q.revision_no}
              </label>
            ))}
          </div>
          <p>{form.question_revision_ids.length} câu đã chọn</p>
          <div className="actions">
            <button disabled={a.busy || !form.question_revision_ids.length}>
              Lưu đề
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setForm(null)}
            >
              Đóng
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
