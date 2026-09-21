import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import type {
  Catalog,
  Page,
  SearchHit,
  Note,
  NoteDetail,
  Dictation,
  DictationAttempt,
  Favorite,
} from "@sprout/api-client";
import { api, mutate } from "../lib/runtime";
import { Audio } from "../components/audio";
import {
  Screen,
  Title,
  Card,
  H,
  P,
  Field,
  Button,
  LinkButton,
  Resource,
  useResource,
  useAction,
  ActionNotice,
  Notice,
  Pager,
  styles,
  confirm,
  useUnsaved,
  status,
} from "../components/ui";
export function SearchScreen() {
  const [input, setInput] = useState(""),
    [q, setQ] = useState(""),
    [type, setType] = useState("all"),
    [course, setCourse] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);
  const catalog = useResource(() => api<Catalog>("content", "/v1/catalog"));
  const s = useResource(
    () =>
      q.length < 2
        ? Promise.resolve({ items: [], total: 0 } as Page<SearchHit>)
        : api<Page<SearchHit>>(
            "content",
            "/v1/search?" +
              new URLSearchParams({
                q,
                type,
                page: String(page),
                ...(course ? { course_id: course } : {}),
              }),
          ),
    `${q}.${type}.${course}.${page}`,
  );
  return (
    <Screen>
      <Title
        title="Bạn muốn học điều gì?"
        subtitle="Tìm bài học, lộ trình và từ vựng."
      />
      <Field
        label="Từ khóa"
        value={input}
        onChangeText={setInput}
        maxLength={100}
      />
      <View style={styles.row}>
        {[
          ["all", "Tất cả"],
          ["course", "Lộ trình"],
          ["topic", "Chủ đề"],
          ["lesson", "Bài học"],
          ["vocabulary", "Từ vựng"],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={label}
            secondary={type !== value}
            onPress={() => {
              setType(value);
              setPage(1);
            }}
          />
        ))}
      </View>
      <Resource state={catalog}>
        <View style={styles.row}>
          <Button
            title="Mọi lộ trình"
            secondary={!!course}
            onPress={() => {
              setCourse("");
              setPage(1);
            }}
          />
          {catalog.data?.courses.map((c) => (
            <Button
              key={c.id}
              title={c.title}
              secondary={course !== c.id}
              onPress={() => {
                setCourse(c.id);
                setPage(1);
              }}
            />
          ))}
        </View>
      </Resource>
      <Resource state={s}>
        {s.data?.items.map((item) => (
          <Card key={item.type + item.id}>
            <Text style={styles.eyebrow}>
              {
                (
                  {
                    course: "LỘ TRÌNH",
                    topic: "CHỦ ĐỀ",
                    lesson: "BÀI HỌC",
                    vocabulary: "TỪ VỰNG",
                  } as Record<string, string>
                )[item.type]
              }
            </Text>
            <H>{item.title}</H>
            {item.meaning && <P>{item.meaning}</P>}
            <LinkButton
              title="Khám phá →"
              to={
                item.lesson_id
                  ? "/lesson/" + item.lesson_id
                  : "/catalog?course_id=" +
                    item.course_id +
                    (item.topic_id ? "&topic_id=" + item.topic_id : "")
              }
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && (
          <P>
            {q.length < 2
              ? "Nhập ít nhất 2 ký tự để tìm kiếm."
              : "Chưa tìm thấy nội dung phù hợp."}
          </P>
        )}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
export function NotesScreen() {
  const [page, setPage] = useState(1),
    s = useResource(
      () => api<Page<Note>>("learning", "/v1/notes?page=" + page),
      String(page),
    );
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title title="Những điều bạn ghi nhớ." />
      <Resource state={s}>
        {s.data?.items.map((note) => (
          <Card key={note.id}>
            <H>{note.current_title ?? note.title_snapshot}</H>
            <P>{note.content.slice(0, 200)}</P>
            <Notice>
              {!note.available
                ? "Bài học không còn khả dụng. Bạn vẫn có thể sửa ghi chú."
                : note.revision_changed
                  ? "Bài học có phiên bản mới."
                  : ""}
            </Notice>
            <LinkButton title="Mở ghi chú" to={"/note/" + note.lesson_id} />
          </Card>
        ))}
        {s.data && !s.data.items.length && (
          <P>Mở một bài học để viết ghi chú đầu tiên.</P>
        )}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
export function NoteScreen({ id }: { id: string }) {
  const s = useResource(
      () => api<NoteDetail>("learning", `/v1/lessons/${id}/note`),
      id,
    ),
    a = useAction();
  const [draft, setDraft] = useState<{
    text: string;
    base: string;
    version: number;
  } | null>(null);
  useEffect(() => {
    if (s.data && draft === null)
      setDraft({
        text: s.data.note?.content ?? "",
        base: s.data.note?.content ?? "",
        version: Number(s.data.note?.row_version ?? 0),
      });
  }, [s.data, draft]);
  const dirty = !!draft && draft.text !== draft.base;
  useUnsaved(dirty);
  const conflict =
    !!s.data &&
    !!draft &&
    draft.version !== Number(s.data.note?.row_version ?? 0);
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title
        title={
          s.data?.current_title ??
          s.data?.note?.title_snapshot ??
          "Ghi chú của tôi"
        }
      />
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data && draft && (
          <>
            <Notice>
              {s.data.revision_changed
                ? "Nội dung bài học đã được cập nhật từ lần ghi chú trước."
                : !s.data.available
                  ? "Bài học không còn khả dụng; ghi chú đã có vẫn được giữ."
                  : ""}
            </Notice>
            <Field
              label="Ghi chú riêng của bạn"
              value={draft.text}
              onChangeText={(text) => setDraft({ ...draft, text })}
              multiline
              maxLength={5000}
              editable={!a.busy && (s.data.available || !!s.data.note)}
            />
            <Text style={styles.small}>
              {draft.text.length}/5.000 ký tự ·{" "}
              {dirty ? "Chưa lưu" : "Đã đồng bộ bản đọc"}
            </Text>
            {conflict && (
              <Card>
                <Notice>
                  Ghi chú đã thay đổi trên thiết bị khác. Bản nhập của bạn được
                  giữ phía trên.
                </Notice>
                <H>Bản máy chủ</H>
                <P>{s.data.note?.content ?? "(Ghi chú đã bị xóa)"}</P>
                <Button
                  secondary
                  title="Dùng bản máy chủ"
                  onPress={() =>
                    void a.run(async () => {
                      if (
                        !(await confirm(
                          "Bỏ bản nhập?",
                          "Thay bản nhập bằng ghi chú trên máy chủ.",
                        ))
                      )
                        return;
                      setDraft({
                        text: s.data!.note?.content ?? "",
                        base: s.data!.note?.content ?? "",
                        version: Number(s.data!.note?.row_version ?? 0),
                      });
                    })
                  }
                />
                <Button
                  secondary
                  title="Giữ bản nhập để lưu lại"
                  onPress={() =>
                    void a.run(async () => {
                      if (
                        await confirm(
                          "Giữ bản nhập?",
                          "Lần lưu tiếp theo sẽ ghi nội dung này lên phiên bản hiện tại.",
                        )
                      )
                        setDraft({
                          ...draft,
                          version: Number(s.data!.note?.row_version ?? 0),
                        });
                    })
                  }
                />
              </Card>
            )}
            <Button
              title="Lưu ghi chú"
              disabled={
                a.busy ||
                conflict ||
                !draft.text.trim() ||
                (!s.data.available && !s.data.note)
              }
              onPress={() =>
                void a.run(async () => {
                  try {
                    const note = await api<Note>(
                      "learning",
                      `/v1/lessons/${id}/note`,
                      "PUT",
                      { content: draft.text, expectedVersion: draft.version },
                    );
                    setDraft({
                      text: note.content,
                      base: note.content,
                      version: Number(note.row_version),
                    });
                    await s.reload();
                  } catch (e) {
                    await s.reload();
                    throw e;
                  }
                }, "Đã lưu ghi chú.")
              }
            />
            {s.data.note && (
              <Button
                secondary
                title="Xóa ghi chú"
                disabled={a.busy || conflict}
                onPress={() =>
                  void a.run(async () => {
                    if (
                      !(await confirm(
                        "Xóa ghi chú?",
                        "Nội dung ghi chú và bản nhập hiện tại sẽ bị bỏ.",
                        "Xóa",
                      ))
                    )
                      return;
                    try {
                      await api(
                        "learning",
                        `/v1/lessons/${id}/note`,
                        "DELETE",
                        { expectedVersion: draft.version },
                      );
                      setDraft({ text: "", base: "", version: 0 });
                      await s.reload();
                    } catch (e) {
                      await s.reload();
                      throw e;
                    }
                  })
                }
              />
            )}
            {s.data.available && (
              <LinkButton title="Mở bài học" to={"/lesson/" + id} />
            )}
          </>
        )}
      </Resource>
    </Screen>
  );
}
export function DictationsScreen({ lessonId }: { lessonId?: string }) {
  const [page, setPage] = useState(1),
    [course, setCourse] = useState(""),
    [topic, setTopic] = useState("");
  const catalog = useResource(() => api<Catalog>("content", "/v1/catalog"));
  const s = useResource(
      () =>
        api<Page<Dictation>>(
          "content",
          "/v1/dictations?" +
            new URLSearchParams({
              page: String(page),
              ...(lessonId ? { lesson_id: lessonId } : {}),
              ...(course ? { course_id: course } : {}),
              ...(topic ? { topic_id: topic } : {}),
            }),
        ),
      `${page}.${lessonId}.${course}.${topic}`,
    ),
    a = useAction();
  return (
    <Screen>
      <Title
        eyebrow="LISTEN, WRITE, LEARN"
        title="Lắng nghe từng từ."
        subtitle="Nghe và chép lại theo nhịp độ của bạn."
      />
      <ActionNotice action={a} />
      <LinkButton title="Lượt Dictation đã lưu" to="/history?kind=dictation" />
      {!lessonId && (
        <Resource state={catalog}>
          <View style={styles.row}>
            <Button
              title="Tất cả"
              secondary={!!course}
              onPress={() => {
                setCourse("");
                setTopic("");
                setPage(1);
              }}
            />
            {catalog.data?.courses.map((c) => (
              <Button
                key={c.id}
                title={c.title}
                secondary={course !== c.id}
                onPress={() => {
                  setCourse(c.id);
                  setTopic("");
                  setPage(1);
                }}
              />
            ))}
          </View>
          {course && (
            <View style={styles.row}>
              <Button
                title="Mọi chủ đề"
                secondary={!!topic}
                onPress={() => {
                  setTopic("");
                  setPage(1);
                }}
              />
              {catalog.data?.courses
                .find((c) => c.id === course)
                ?.topics.map((t) => (
                  <Button
                    key={t.id}
                    title={t.title}
                    secondary={topic !== t.id}
                    onPress={() => {
                      setTopic(t.id);
                      setPage(1);
                    }}
                  />
                ))}
            </View>
          )}
        </Resource>
      )}
      <Resource state={s}>
        {s.data?.items.map((item) => (
          <Card key={item.id}>
            <H>{item.title}</H>
            <Text style={styles.small}>{item.lesson_title}</Text>
            <P>{item.instructions}</P>
            <Button
              title="Bắt đầu / Tiếp tục"
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  const result = await mutate<{ attempt_id: string }>(
                    "learning",
                    "/v1/dictation-attempts",
                    { dictation_id: item.id },
                  );
                  router.push(
                    `/dictation-attempt/${result.attempt_id}` as never,
                  );
                })
              }
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && <P>Chưa có Dictation phù hợp.</P>}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
export function DictationAttemptScreen({ id }: { id: string }) {
  const s = useResource(
      () => api<DictationAttempt>("learning", "/v1/dictation-attempts/" + id),
      id,
    ),
    a = useAction();
  const [draft, setDraft] = useState<{
    text: string;
    base: string;
    version: number;
  } | null>(null);
  useEffect(() => {
    if (s.data && !draft)
      setDraft({
        text: s.data.answer,
        base: s.data.answer,
        version: s.data.row_version,
      });
  }, [s.data, draft]);
  const dirty =
    s.data?.status === "in_progress" && !!draft && draft.text !== draft.base;
  const conflict = !!draft && !!s.data && draft.version !== s.data.row_version;
  useUnsaved(!!dirty);
  async function save(submit: boolean) {
    if (!draft || !s.data) return;
    if (
      submit &&
      !(await confirm(
        "Nộp bản chép?",
        "Sau khi nộp bạn có thể xem transcript và kết quả, nhưng không sửa lượt này.",
        "Nộp bài",
      ))
    )
      return;
    try {
      if (submit)
        s.setData(
          await mutate<DictationAttempt>(
            "learning",
            `/v1/dictation-attempts/${id}/submit`,
            { answer: draft.text, expectedVersion: draft.version },
          ),
        );
      else {
        const saved = await api<{ answer: string; row_version: number }>(
          "learning",
          `/v1/dictation-attempts/${id}/answer`,
          "PUT",
          { answer: draft.text, expectedVersion: draft.version },
        );
        setDraft({
          text: saved.answer,
          base: saved.answer,
          version: saved.row_version,
        });
        await s.reload();
      }
    } catch (e) {
      await s.reload();
      throw e;
    }
  }
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data && draft && (
          <>
            <Title
              eyebrow="DICTATION"
              title={s.data.title}
              subtitle={status(s.data.status)}
            />
            <P>{s.data.instructions}</P>
            <Card>
              <Audio
                url={s.data.audio_url}
                refresh={async () =>
                  (
                    await api<DictationAttempt>(
                      "learning",
                      "/v1/dictation-attempts/" + id,
                    )
                  ).audio_url
                }
              />
            </Card>
            {s.data.status === "in_progress" ? (
              <>
                <Field
                  label="Bản chép của bạn"
                  value={draft.text}
                  onChangeText={(text) => setDraft({ ...draft, text })}
                  maxLength={10000}
                  multiline
                  autoCorrect={false}
                  autoCapitalize="none"
                  editable={!a.busy}
                />
                <Text style={styles.small}>
                  {dirty ? "Bản nhập chưa lưu" : "Đã lưu trên máy chủ"}
                </Text>
                {conflict && (
                  <Card>
                    <Notice>
                      Bản chép đã thay đổi. Đối chiếu trước khi lưu tiếp.
                    </Notice>
                    <H>Bản máy chủ</H>
                    <P>{s.data.answer || "(trống)"}</P>
                    <Button
                      secondary
                      title="Dùng bản máy chủ"
                      onPress={() =>
                        void a.run(async () => {
                          if (
                            await confirm(
                              "Bỏ bản nhập?",
                              "Dùng bản chép trên máy chủ.",
                            )
                          )
                            setDraft({
                              text: s.data!.answer,
                              base: s.data!.answer,
                              version: s.data!.row_version,
                            });
                        })
                      }
                    />
                    <Button
                      secondary
                      title="Giữ bản nhập để lưu lại"
                      onPress={() =>
                        void a.run(async () => {
                          if (
                            await confirm(
                              "Giữ bản nhập?",
                              "Lần lưu tiếp theo sẽ thay bản chép trên máy chủ.",
                            )
                          )
                            setDraft({
                              ...draft,
                              version: s.data!.row_version,
                            });
                        })
                      }
                    />
                  </Card>
                )}
                <Button
                  secondary
                  title="Lưu bản chép"
                  disabled={a.busy || conflict}
                  onPress={() =>
                    void a.run(() => save(false), "Đã lưu bản chép.")
                  }
                />
                <Button
                  title="Nộp bản chép"
                  disabled={a.busy || conflict || !draft.text.trim()}
                  onPress={() => void a.run(() => save(true))}
                />
                <Button
                  secondary
                  title="Hủy lượt"
                  disabled={a.busy}
                  onPress={() =>
                    void a.run(async () => {
                      if (
                        !(await confirm(
                          "Hủy lượt?",
                          "Lượt này sẽ không thể tiếp tục.",
                        ))
                      )
                        return;
                      await api(
                        "learning",
                        `/v1/dictation-attempts/${id}/cancel`,
                        "POST",
                        { expectedVersion: s.data!.row_version },
                      );
                      await s.reload();
                    })
                  }
                />
              </>
            ) : (
              <Card>
                <H>Bản chép đã lưu</H>
                <P>{s.data.answer || "(trống)"}</P>
              </Card>
            )}
            {s.data.status === "submitted" && s.data.result && (
              <>
                <Card>
                  <Text style={styles.title}>{s.data.result.score}%</Text>
                  <P>
                    {s.data.result.correct} đúng · {s.data.result.substitutions}{" "}
                    sai · {s.data.result.missing} thiếu · {s.data.result.extra}{" "}
                    thừa
                  </P>
                  <H>Transcript</H>
                  <P>{s.data.transcript}</P>
                </Card>
                <Card>
                  <H>Đối chiếu từng từ</H>
                  {s.data.result.alignment.map((word, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.text,
                        {
                          color:
                            word.type === "correct" ? "#28624A" : "#A8392E",
                        },
                      ]}
                    >
                      {
                        (
                          {
                            correct: "✓",
                            substitution: "Sai",
                            missing: "Thiếu",
                            extra: "Thừa",
                          } as Record<string, string>
                        )[word.type]
                      }{" "}
                      · {word.actual ?? "∅"}
                      {word.type !== "correct"
                        ? " → " + (word.expected ?? "∅")
                        : ""}
                    </Text>
                  ))}
                </Card>
              </>
            )}
            {s.data.status === "cancelled" && (
              <Notice>
                {s.data.cancel_reason === "content_unavailable"
                  ? "Nội dung đã ẩn; lượt đang làm đã hủy."
                  : "Bạn đã hủy lượt này."}
              </Notice>
            )}
          </>
        )}
      </Resource>
    </Screen>
  );
}
export function FavoritesScreen() {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    s = useResource(
      () =>
        api<Page<Favorite>>(
          "learning",
          "/v1/favorites?" + new URLSearchParams({ q, page: String(page) }),
        ),
      `${page}.${q}`,
    ),
    a = useAction();
  return (
    <Screen>
      <Title title="Những bài muốn trở lại." />
      <Field
        label="Tìm bài đã lưu"
        value={q}
        onChangeText={(value) => {
          setQ(value);
          setPage(1);
        }}
      />
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data?.items.map((item) => (
          <Card key={item.lesson_id}>
            <H>{item.title}</H>
            {item.available && (
              <LinkButton title="Mở bài" to={"/lesson/" + item.lesson_id} />
            )}
            <Button
              secondary
              title="Bỏ lưu"
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  await api(
                    "learning",
                    "/v1/favorites/" + item.lesson_id,
                    "DELETE",
                  );
                  await s.reload();
                })
              }
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && <P>Chưa có bài đã lưu phù hợp.</P>}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
