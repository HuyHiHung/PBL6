import { useState } from "react";
import { api, type Row, statusText } from "./api";
import { Load, Notice, useLoad, useAction } from "./ui";
import { useUnsaved } from "./navigation";
export function DictationAdmin({
  lessonId,
  media,
  write,
  publish,
}: {
  lessonId: string;
  media: Row[];
  write: boolean;
  publish: boolean;
}) {
  const s = useLoad(
      () => api("content", "/v1/admin/dictations?lesson_id=" + lessonId),
      [lessonId],
    ),
    a = useAction(),
    [form, setForm] = useState<Row | null>(null);
  useUnsaved(!!form);
  const blank = () => ({
    title: "",
    instructions: "Nghe và chép lại đoạn audio.",
    audio_asset_id: "",
    transcript: "",
  });
  async function save() {
    if (!form) return;
    const body = {
      title: form.title,
      instructions: form.instructions,
      audio_asset_id: form.audio_asset_id,
      transcript: form.transcript,
    };
    await api(
      "content",
      form.editId
        ? "/v1/admin/dictation-revisions/" + form.editId
        : form.parentId
          ? "/v1/admin/dictations/" + form.parentId + "/revisions"
          : "/v1/admin/dictations",
      form.editId ? "PATCH" : "POST",
      {
        ...body,
        ...(form.editId
          ? { expectedVersion: Number(form.revision_version) }
          : form.parentId
            ? {}
            : { lesson_id: lessonId }),
      },
    );
    setForm(null);
    s.reload();
  }
  return (
    <section className="card">
      <div className="section-heading">
        <h2>Dictation — Nghe và chép lại</h2>
        {write && (
          <button
            className="secondary"
            onClick={() => {
              if (!form || confirm("Bỏ bản đang sửa để tạo bài mới?"))
                setForm(blank());
            }}
          >
            + Bài Dictation
          </button>
        )}
      </div>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <Load state={s}>
        {s.data?.items.map((r: Row) => (
          <div className="list-row wrap" key={r.revision_id}>
            <div>
              <b>{r.title}</b>
              <small>
                Phiên bản {r.revision_no} ·{" "}
                {r.published_at ? "Đã xuất bản" : "Bản nháp"} ·{" "}
                {statusText(r.status)}
              </small>
              <details>
                <summary>Xem bản biên soạn</summary>
                <p>{r.instructions}</p>
                <p className="preserve">{r.transcript}</p>
              </details>
            </div>
            {write && (
              <button
                className="text-link"
                onClick={() => {
                  if (!form || confirm("Bỏ bản đang sửa?"))
                    setForm({
                      ...r,
                      editId: r.published_at ? null : r.revision_id,
                      parentId: r.id,
                    });
                }}
              >
                {r.published_at ? "Tạo phiên bản mới" : "Sửa nháp"}
              </button>
            )}
            {publish && !r.published_at && (
              <button
                disabled={a.busy}
                onClick={() => {
                  if (
                    confirm(
                      "Xuất bản Dictation? Transcript sẽ không sửa được sau khi xuất bản.",
                    )
                  )
                    a.run(async () => {
                      await api(
                        "content",
                        `/v1/admin/dictations/${r.id}/publish`,
                        "POST",
                        {
                          revisionId: r.revision_id,
                          expectedVersion: Number(r.row_version),
                        },
                      );
                      s.reload();
                    }, "Đã xuất bản bài Dictation.");
                }}
              >
                Xuất bản Dictation
              </button>
            )}
            {publish && r.published_revision_id === r.revision_id && (
              <button
                className="secondary"
                disabled={a.busy}
                onClick={() =>
                  a.run(async () => {
                    await api(
                      "content",
                      `/v1/admin/dictations/${r.id}/status`,
                      "PATCH",
                      {
                        status:
                          r.status === "published" ? "hidden" : "published",
                        expectedVersion: Number(r.row_version),
                      },
                    );
                    s.reload();
                  })
                }
              >
                {r.status === "published" ? "Ẩn Dictation" : "Hiện Dictation"}
              </button>
            )}
          </div>
        ))}
      </Load>
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            a.run(save, "Đã lưu bản nháp Dictation.");
          }}
        >
          <label>
            Tên bài Dictation
            <input
              required
              maxLength={300}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Hướng dẫn
            <textarea
              maxLength={5000}
              value={form.instructions}
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
            />
          </label>
          <label>
            Audio Dictation
            <select
              aria-label="Audio Dictation"
              required
              value={form.audio_asset_id}
              onChange={(e) =>
                setForm({ ...form, audio_asset_id: e.target.value })
              }
            >
              <option value="">Chọn audio đã tải lên</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.object_key}
                </option>
              ))}
            </select>
          </label>
          <p>
            Chọn đoạn nghe riêng; transcript này chỉ được người học xem sau khi
            nộp.
          </p>
          <label>
            Transcript chuẩn
            <textarea
              required
              rows={5}
              maxLength={10000}
              value={form.transcript}
              onChange={(e) => setForm({ ...form, transcript: e.target.value })}
            />
          </label>
          <small>
            1–200 từ. Không tự quy đổi dạng viết tắt hoặc chữ số khi chấm.
          </small>
          <div className="actions">
            <button disabled={a.busy}>Lưu Dictation</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (confirm("Bỏ thay đổi trong bản nháp?")) setForm(null);
              }}
            >
              Đóng
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
