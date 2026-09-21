import { useState } from "react";
import { Text, View } from "react-native";
import type { Answer, Attempt, AttemptItem } from "@sprout/api-client";
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
  styles,
  confirm,
  useUnsaved,
  status,
} from "../components/ui";
type Draft = { answer: Answer; version: number };
export function AttemptScreen({ id }: { id: string }) {
  const s = useResource(
      () => api<Attempt>("learning", "/v1/attempts/" + id),
      id,
    ),
    action = useAction();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const changed = (item: AttemptItem) =>
    drafts[item.id] &&
    JSON.stringify(drafts[item.id].answer) !== JSON.stringify(item.answer);
  const dirty = s.data?.status === "in_progress" && s.data.items.some(changed);
  useUnsaved(!!dirty);
  function edit(item: AttemptItem, answer: Answer) {
    setDrafts((old) => ({
      ...old,
      [item.id]: {
        answer,
        version: old[item.id]?.version ?? item.answer_version,
      },
    }));
  }
  function discard(item: AttemptItem) {
    setDrafts((old) => {
      const next = { ...old };
      delete next[item.id];
      return next;
    });
  }
  async function save(item: AttemptItem) {
    const draft = drafts[item.id],
      answer = draft?.answer ?? item.answer;
    if (!answer) throw new Error("Hãy nhập hoặc chọn câu trả lời.");
    if (draft && draft.version !== item.answer_version)
      throw new Error(
        "Câu này đã được cập nhật. Chọn bản máy chủ hoặc xác nhận giữ bản nhập bên dưới.",
      );
    const body = {
      answer,
      expectedVersion: draft?.version ?? item.answer_version,
      attemptVersion: s.data!.row_version,
    };
    try {
      if (s.data!.kind === "topic_test") {
        await api("learning", `/v1/items/${item.id}/answer`, "PUT", body);
        discard(item);
        await s.reload();
      } else {
        const result = await mutate<Attempt>(
          "learning",
          `/v1/items/${item.id}/check`,
          body,
        );
        discard(item);
        s.setData(result);
      }
    } catch (e) {
      await s.reload();
      throw e;
    }
  }
  async function submit() {
    if (dirty)
      throw new Error("Hãy lưu hoặc kiểm tra các câu đã nhập trước khi nộp.");
    const blank = s.data!.items.some(
      (i) => !i.answer || ("text" in i.answer && !i.answer.text.trim()),
    );
    if (
      !(await confirm(
        "Nộp bài?",
        blank
          ? "Có câu chưa trả lời. Bạn muốn bỏ trống và nộp?"
          : "Kết quả sẽ được lưu và không thể sửa lượt đã nộp.",
        "Nộp bài",
      ))
    )
      return;
    try {
      s.setData(
        await mutate<Attempt>("learning", `/v1/attempts/${id}/submit`, {
          expectedVersion: s.data!.row_version,
          confirmBlank: blank,
        }),
      );
    } catch (e) {
      await s.reload();
      throw e;
    }
  }
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <ActionNotice action={action} />
      <Resource state={s}>
        {s.data && (
          <>
            <Title
              eyebrow={
                s.data.kind === "topic_test"
                  ? "KIỂM TRA CHỦ ĐỀ"
                  : s.data.kind === "mistake_review"
                    ? "ÔN CÂU SAI"
                    : "QUIZ BÀI HỌC"
              }
              title={s.data.title}
              subtitle={status(s.data.status)}
            />
            {s.data.status === "submitted" && (
              <Card>
                <H>
                  {s.data.score === null
                    ? `${s.data.correct_count}/${s.data.total_count} câu đúng`
                    : `${s.data.score}% · ${s.data.correct_count}/${s.data.total_count} câu đúng`}
                </H>
                <P>
                  {s.data.passed === null
                    ? "Đã hoàn thành lượt ôn."
                    : s.data.passed
                      ? "Bạn đã đạt yêu cầu."
                      : "Hãy xem giải thích và thử lại sau."}
                </P>
              </Card>
            )}
            {s.data.status === "cancelled" && (
              <Notice>
                {s.data.cancel_reason === "content_unavailable"
                  ? "Nội dung không còn khả dụng. Lượt học đã được hủy."
                  : "Lượt học đã hủy."}
              </Notice>
            )}
            {s.data.items.map((item) => {
              const value = drafts[item.id]?.answer ?? item.answer,
                editable = s.data!.status === "in_progress" && !item.checked;
              return (
                <Card key={item.id}>
                  <Text style={styles.eyebrow}>
                    CÂU {item.position} / {s.data!.total_count}
                  </Text>
                  <H>{item.prompt}</H>
                  {item.passage && <P>{item.passage}</P>}
                  {item.audio_url && (
                    <Audio
                      url={item.audio_url}
                      refresh={async () =>
                        (
                          await api<Attempt>("learning", "/v1/attempts/" + id)
                        ).items.find((i) => i.id === item.id)?.audio_url
                      }
                    />
                  )}
                  {item.type === "single_choice" ? (
                    item.options.map((option) => (
                      <Button
                        key={option.option_key}
                        title={`${option.option_key}. ${option.text}`}
                        secondary={
                          !value ||
                          !("option_key" in value) ||
                          value.option_key !== option.option_key
                        }
                        disabled={!editable || action.busy}
                        onPress={() =>
                          edit(item, { option_key: option.option_key })
                        }
                      />
                    ))
                  ) : (
                    <Field
                      label="Câu trả lời"
                      value={value && "text" in value ? value.text : ""}
                      onChangeText={(text) => edit(item, { text })}
                      editable={editable && !action.busy}
                      maxLength={1000}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  )}
                  {editable && (
                    <>
                      <Text style={styles.small}>
                        {changed(item)
                          ? "Bản nhập chưa lưu"
                          : item.answer
                            ? "Đã lưu trên máy chủ"
                            : "Chưa trả lời"}
                      </Text>
                      <Button
                        title={
                          s.data!.kind === "topic_test"
                            ? "Lưu câu trả lời"
                            : "Kiểm tra câu trả lời"
                        }
                        disabled={action.busy}
                        onPress={() => void action.run(() => save(item))}
                      />
                      {drafts[item.id] &&
                        drafts[item.id].version !== item.answer_version && (
                          <>
                            <Notice>
                              Câu trả lời đã đổi trên thiết bị khác. Bản máy
                              chủ:{" "}
                              {item.answer && "text" in item.answer
                                ? item.answer.text
                                : item.answer && "option_key" in item.answer
                                  ? item.answer.option_key
                                  : "(trống)"}
                            </Notice>
                            <Button
                              secondary
                              title="Dùng bản máy chủ"
                              onPress={() => discard(item)}
                            />
                            <Button
                              secondary
                              title="Giữ bản nhập để lưu lại"
                              onPress={() =>
                                void action.run(async () => {
                                  if (
                                    await confirm(
                                      "Giữ bản nhập?",
                                      "Lần lưu tiếp theo sẽ thay câu trả lời đang có trên máy chủ.",
                                    )
                                  )
                                    setDrafts((old) => ({
                                      ...old,
                                      [item.id]: {
                                        ...old[item.id],
                                        version: item.answer_version,
                                      },
                                    }));
                                })
                              }
                            />
                          </>
                        )}
                    </>
                  )}
                  {item.is_correct !== undefined && (
                    <>
                      <P>{item.is_correct ? "✓ Chính xác" : "Cần ôn lại"}</P>
                      <P>{item.explanation}</P>
                      {item.answer_key && (
                        <P>
                          Đáp án:{" "}
                          {item.answer_key.correct_option_key ??
                            item.answer_key.accepted_answers?.join(" / ")}
                        </P>
                      )}
                      {item.transcript && <P>{item.transcript}</P>}
                      <LinkButton
                        title="Ôn bài liên quan"
                        to={"/lesson/" + item.lesson_id}
                      />
                    </>
                  )}
                </Card>
              );
            })}
            {s.data.status === "in_progress" && (
              <>
                <Button
                  title="Nộp bài"
                  disabled={action.busy || !!dirty}
                  onPress={() => void action.run(submit)}
                />
                <Button
                  secondary
                  title="Hủy lượt học"
                  disabled={action.busy}
                  onPress={() =>
                    void action.run(async () => {
                      if (
                        !(await confirm(
                          "Hủy lượt?",
                          "Lượt này sẽ không thể tiếp tục.",
                        ))
                      )
                        return;
                      await api(
                        "learning",
                        `/v1/attempts/${id}/cancel`,
                        "POST",
                        { expectedVersion: s.data!.row_version },
                      );
                      setDrafts({});
                      await s.reload();
                    })
                  }
                />
              </>
            )}
            <LinkButton title="Lịch sử học tập" to="/history" />
          </>
        )}
      </Resource>
    </Screen>
  );
}
