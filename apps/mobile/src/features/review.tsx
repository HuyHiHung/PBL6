import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import type {
  Card as CardDto,
  CardSession,
  Page,
  Mistake,
  Today,
} from "@sprout/api-client";
import { api, mutate } from "../lib/runtime";
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
import { Audio } from "../components/audio";
export function ReviewHome() {
  const s = useResource(() => api<Today>("learning", "/v1/today")),
    a = useAction();
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title eyebrow="ÔN ĐỂ NHỚ LÂU HƠN" title="Một chút mỗi ngày." />
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data && (
          <Card>
            <H>
              {s.data.due_cards} thẻ đến hạn · {s.data.new_cards} thẻ mới
            </H>
            <P>Lật thẻ, tự nhớ lại rồi chọn mức độ ghi nhớ.</P>
            <Button
              title={
                s.data.flashcard_session_id
                  ? "Tiếp tục phiên ôn"
                  : "Bắt đầu ôn thẻ"
              }
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  const id =
                    s.data!.flashcard_session_id ??
                    (
                      await mutate<{ session_id: string }>(
                        "learning",
                        "/v1/flashcard-sessions",
                        {},
                      )
                    ).session_id;
                  router.push(`/review-session/${id}` as never);
                })
              }
            />
          </Card>
        )}
      </Resource>
      <LinkButton title="Bộ thẻ của tôi" to="/cards" />
      <Card>
        <H>Câu sai là cơ hội để hiểu hơn.</H>
        <P>{s.data?.wrong_questions ?? "…"} câu cần ôn</P>
        <LinkButton title="Xem và ôn câu sai" to="/mistakes" />
      </Card>
    </Screen>
  );
}
export function CardsScreen() {
  const [page, setPage] = useState(1),
    [filter, setFilter] = useState("all");
  const s = useResource(
      () =>
        api<Page<CardDto>>(
          "learning",
          `/v1/flashcards?filter=${filter}&page=${page}`,
        ),
      `${page}.${filter}`,
    ),
    a = useAction();
  const [editing, setEditing] = useState<CardDto | null>(null),
    [word, setWord] = useState(""),
    [meaning, setMeaning] = useState(""),
    [example, setExample] = useState("");
  const dirty =
    word !== (editing?.word ?? "") ||
    meaning !== (editing?.meaning ?? "") ||
    example !== (editing?.example ?? "");
  useUnsaved(dirty);
  function reset() {
    setEditing(null);
    setWord("");
    setMeaning("");
    setExample("");
  }
  async function save() {
    if (!word.trim() || !meaning.trim())
      throw new Error("Nhập từ và nghĩa của thẻ.");
    const body = { word: word.trim(), meaning: meaning.trim(), example };
    if (editing)
      await api("learning", "/v1/flashcards/" + editing.id, "PATCH", {
        ...body,
        expectedVersion: Number(editing.row_version),
      });
    else await mutate("learning", "/v1/flashcards", body);
    reset();
    await s.reload();
  }
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title title="Bộ thẻ của tôi" />
      <ActionNotice action={a} />
      <Card>
        <H>{editing ? "Sửa thẻ · lịch ôn sẽ đặt lại" : "Thêm một từ mới"}</H>
        <Field
          label="Từ"
          value={word}
          onChangeText={setWord}
          maxLength={10000}
        />
        <Field
          label="Nghĩa"
          value={meaning}
          onChangeText={setMeaning}
          maxLength={10000}
        />
        <Field
          label="Ví dụ"
          value={example}
          onChangeText={setExample}
          maxLength={10000}
        />
        <Button
          title={editing ? "Lưu thay đổi" : "Tạo thẻ"}
          disabled={a.busy}
          onPress={() => void a.run(save, "Đã lưu thẻ.")}
        />
        {(editing || dirty) && (
          <Button
            secondary
            title="Bỏ bản nhập"
            onPress={() =>
              void a.run(async () => {
                if (
                  !dirty ||
                  (await confirm(
                    "Bỏ bản nhập?",
                    "Các thay đổi chưa lưu sẽ bị bỏ.",
                  ))
                )
                  reset();
              })
            }
          />
        )}
      </Card>
      <View style={styles.row}>
        {[
          ["all", "Tất cả"],
          ["new", "Mới"],
          ["due", "Đến hạn"],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={label}
            secondary={filter !== value}
            onPress={() => {
              setPage(1);
              setFilter(value);
            }}
          />
        ))}
      </View>
      <Resource state={s}>
        {s.data?.items.map((card) => (
          <Card key={card.id}>
            <H>{card.word}</H>
            <P>{card.meaning}</P>
            <P>{card.example}</P>
            <Text style={styles.small}>
              Lịch ôn: {new Date(card.due_at).toLocaleDateString("vi-VN")}
            </Text>
            <CardAudio id={card.id} />
            <Button
              secondary
              title="Sửa thẻ"
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  if (
                    dirty &&
                    !(await confirm(
                      "Đổi thẻ đang sửa?",
                      "Bản nhập chưa lưu sẽ bị bỏ.",
                    ))
                  )
                    return;
                  setEditing(card);
                  setWord(card.word);
                  setMeaning(card.meaning);
                  setExample(card.example);
                })
              }
            />
            <Button
              secondary
              title="Xóa thẻ"
              disabled={a.busy}
              onPress={() =>
                void a.run(async () => {
                  if (
                    !(await confirm(
                      "Xóa thẻ?",
                      "Thẻ sẽ bị bỏ khỏi các phiên ôn tiếp theo.",
                      "Xóa",
                    ))
                  )
                    return;
                  await api("learning", "/v1/flashcards/" + card.id, "DELETE", {
                    expectedVersion: Number(card.row_version),
                  });
                  if (editing?.id === card.id) reset();
                  await s.reload();
                })
              }
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && <P>Chưa có thẻ trong nhóm này.</P>}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
function CardAudio({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null),
    a = useAction();
  const load = async () =>
    (
      await api<{ url: string | null }>(
        "learning",
        `/v1/flashcards/${id}/audio`,
      )
    ).url;
  return (
    <>
      <ActionNotice action={a} />
      {url ? (
        <Audio url={url} refresh={load} />
      ) : (
        <Button
          secondary
          title="Nghe từ (nếu có audio)"
          disabled={a.busy}
          onPress={() =>
            void a.run(async () => {
              const next = await load();
              if (!next) throw new Error("Thẻ này chưa có audio nguồn.");
              setUrl(next);
            })
          }
        />
      )}
    </>
  );
}
export function ReviewSessionScreen({ id }: { id: string }) {
  const s = useResource(
      () => api<CardSession>("learning", "/v1/flashcard-sessions/" + id),
      id,
    ),
    a = useAction(),
    [flipped, setFlipped] = useState<string | null>(null);
  const item =
    s.data?.status === "in_progress"
      ? s.data.items.find((i) => i.status === "pending")
      : undefined;
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title
        title="Nhớ lại, rồi lật thẻ."
        subtitle={s.data ? status(s.data.status) : ""}
      />
      <ActionNotice action={a} />
      <Resource state={s}>
        {item ? (
          <Card>
            <Text style={styles.eyebrow}>
              {s.data!.items.filter((i) => i.status !== "pending").length + 1} /{" "}
              {s.data!.items.length}
            </Text>
            <Text style={styles.title}>{item.card_snapshot.word}</Text>
            <P>{item.card_snapshot.phonetic}</P>
            {flipped === item.id ? (
              <>
                <H>{item.card_snapshot.meaning}</H>
                <P>{item.card_snapshot.example}</P>
                <View style={styles.row}>
                  {[
                    ["again", "Chưa nhớ"],
                    ["remember", "Đã nhớ"],
                  ].map(([rating, label]) => (
                    <Button
                      key={rating}
                      title={label}
                      secondary={rating === "again"}
                      disabled={a.busy}
                      onPress={() =>
                        void a.run(async () => {
                          try {
                            await mutate(
                              "learning",
                              `/v1/flashcard-items/${item.id}/rate`,
                              { rating },
                            );
                            setFlipped(null);
                          } finally {
                            await s.reload();
                          }
                        })
                      }
                    />
                  ))}
                </View>
              </>
            ) : (
              <Button title="Lật thẻ" onPress={() => setFlipped(item.id)} />
            )}
          </Card>
        ) : (
          s.data && (
            <Card>
              <H>
                {s.data.status === "cancelled"
                  ? "Phiên đã hủy"
                  : "Bạn đã hoàn thành phiên ôn."}
              </H>
              <LinkButton title="Về ôn tập" to="/(tabs)/review" />
            </Card>
          )
        )}
        {!!s.data?.items.some((i) => i.status === "skipped") && (
          <Notice>
            Một số thẻ đã được sửa hoặc xóa nên được bỏ qua trong phiên này.
          </Notice>
        )}
        {s.data?.status === "in_progress" && (
          <Button
            secondary
            title="Hủy phiên ôn"
            disabled={a.busy}
            onPress={() =>
              void a.run(async () => {
                if (
                  !(await confirm(
                    "Hủy phiên ôn?",
                    "Các đánh giá đã lưu vẫn được giữ.",
                  ))
                )
                  return;
                await api(
                  "learning",
                  `/v1/flashcard-sessions/${id}/cancel`,
                  "POST",
                  { expectedVersion: Number(s.data!.row_version) },
                );
                await s.reload();
              })
            }
          />
        )}
      </Resource>
    </Screen>
  );
}
export function MistakesScreen() {
  const [page, setPage] = useState(1),
    s = useResource(
      () => api<Page<Mistake>>("learning", "/v1/mistakes?page=" + page),
      String(page),
    ),
    a = useAction();
  return (
    <Screen>
      <Title title="Cùng hiểu lại câu khó." />
      <ActionNotice action={a} />
      <Button
        title="Bắt đầu / Tiếp tục ôn câu sai"
        disabled={a.busy}
        onPress={() =>
          void a.run(async () => {
            const result = await mutate<{ attempt_id: string }>(
              "learning",
              "/v1/mistake-reviews",
              {},
            );
            router.push(`/attempt/${result.attempt_id}` as never);
          })
        }
      />
      <Resource state={s}>
        {s.data?.items.map((item) => (
          <Card key={item.question_id}>
            <H>{item.prompt}</H>
            <P>{item.explanation}</P>
            <LinkButton
              title="Ôn bài liên quan"
              to={"/lesson/" + item.lesson_id}
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && (
          <P>Không có câu sai cần ôn ở trang này.</P>
        )}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
