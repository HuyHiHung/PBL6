import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type {
  Catalog,
  Lesson,
  Progress,
  Today,
  Page,
  History,
} from "@sprout/api-client";
import { api, mutate } from "../lib/runtime";
import { useSession } from "../lib/session";
import { Audio } from "../components/audio";
import {
  Screen,
  Title,
  Card,
  P,
  H,
  Notice,
  Button,
  LinkButton,
  Resource,
  useResource,
  useAction,
  ActionNotice,
  styles,
  colors,
  Pager,
  status,
  date,
} from "../components/ui";
export async function startAttempt(id: string) {
  const value = await mutate<{ attempt_id: string }>(
    "learning",
    "/v1/attempts",
    { assessment_id: id },
  );
  router.push(`/attempt/${value.attempt_id}` as never);
}
export function Home() {
  const { user, recovery } = useSession();
  const s = useResource(
    () => (user ? api<Today>("learning", "/v1/today") : Promise.resolve(null)),
    user?.user_id,
  );
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title
        eyebrow="MỖI NGÀY, MỘT BƯỚC TIẾN"
        title={
          user?.display_name
            ? `Chào ${user.display_name.split(" ").at(-1)}.`
            : "Một khởi đầu nhỏ."
        }
        subtitle="Dành một khoảng nhỏ hôm nay cho phiên bản tự tin hơn của bạn."
      />
      {recovery && (
        <LinkButton title="Hoàn tất đặt lại mật khẩu" to="/auth/reset" />
      )}
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.gold }]}>
          YOUR NEXT CHAPTER
        </Text>
        <Text style={[styles.title, { color: "#fff" }]}>
          Tiếng Anh tốt hơn, từ những điều nhỏ.
        </Text>
        <Text style={[styles.subtitle, { color: "#D9E5D9" }]}>
          Học để hiểu. Ôn để nhớ lâu hơn.
        </Text>
        <Button
          secondary
          title={
            s.data?.progress.next_lesson_id
              ? "Tiếp tục học →"
              : "Khám phá lộ trình →"
          }
          onPress={() =>
            router.push(
              (s.data?.progress.next_lesson_id
                ? "/lesson/" + s.data.progress.next_lesson_id
                : "/(tabs)/discover") as never,
            )
          }
        />
      </View>
      <Resource state={s}>
        {s.data && (
          <>
            <View style={styles.row}>
              {[
                [s.data.due_cards, "thẻ đến hạn"],
                [s.data.new_cards, "thẻ mới"],
                [s.data.wrong_questions, "câu cần ôn"],
              ].map(([n, label]) => (
                <View
                  key={label}
                  style={[styles.card, { flex: 1, minWidth: 88, padding: 13 }]}
                >
                  <Text style={styles.title}>{n}</Text>
                  <Text style={styles.small}>{label}</Text>
                </View>
              ))}
            </View>
            <LinkButton title="Bắt đầu ôn tập" to="/(tabs)/review" />
            <LinkButton title="Lượt học đang làm / Lịch sử" to="/history" />
            <LinkButton title="Xem tiến độ" to="/progress" />
          </>
        )}
      </Resource>
      {!user && (
        <LinkButton title="Đăng nhập để lưu hành trình" to="/auth/login" />
      )}
      <Card>
        <H>Một chút lắng nghe</H>
        <P>Nghe, chép lại và khám phá những từ bạn còn bỏ lỡ.</P>
        <LinkButton title="Luyện Dictation" to="/dictations" />
      </Card>
    </Screen>
  );
}
export function Discover({
  courseId,
  topicId,
}: {
  courseId?: string;
  topicId?: string;
}) {
  const s = useResource(() => api<Catalog>("content", "/v1/catalog")),
    a = useAction(),
    { user } = useSession();
  const logged = (fn: () => Promise<unknown>) =>
    user ? void a.run(fn) : router.push("/auth/login");
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title
        eyebrow="KHÁM PHÁ"
        title="Từng bước, một hành trình."
        subtitle="Chọn lộ trình phù hợp với bạn."
      />
      <LinkButton title="Tìm bài học và từ vựng" to="/search" />
      <LinkButton title="Luyện nghe chép chính tả" to="/dictations" />
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data?.courses
          .filter((c) => !courseId || c.id === courseId)
          .map((course, n) => (
            <Card key={course.id}>
              <Text style={styles.eyebrow}>
                LỘ TRÌNH {String(n + 1).padStart(2, "0")} · {course.level}
              </Text>
              <H>{course.title}</H>
              <P>{course.description}</P>
              <Button
                title="Chọn lộ trình"
                disabled={a.busy}
                onPress={() =>
                  logged(async () => {
                    await api("learning", "/v1/enrollment", "PUT", {
                      course_id: course.id,
                    });
                    router.push("/progress");
                  })
                }
              />
              {course.topics
                .filter((t) => !topicId || t.id === topicId)
                .map((topic) => (
                  <View key={topic.id} style={{ gap: 10 }}>
                    <View style={styles.divider} />
                    <H>{topic.title}</H>
                    {topic.lessons.map((lesson) => (
                      <LinkButton
                        key={lesson.id}
                        title={
                          lesson.title + (lesson.is_preview ? " · Học thử" : "")
                        }
                        to={"/lesson/" + lesson.id}
                      />
                    ))}
                    {topic.assessment_id && (
                      <Button
                        secondary
                        title="Kiểm tra chủ đề"
                        disabled={a.busy}
                        onPress={() =>
                          logged(() => startAttempt(topic.assessment_id!))
                        }
                      />
                    )}
                  </View>
                ))}
            </Card>
          ))}
        {s.data?.courses.length === 0 && <P>Chưa có lộ trình được xuất bản.</P>}
      </Resource>
    </Screen>
  );
}
export function LessonScreen({ id }: { id: string }) {
  const s = useResource(() => api<Lesson>("content", "/v1/lessons/" + id), id),
    a = useAction(),
    { user } = useSession();
  const [transcripts, setTranscripts] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (s.data && user)
      void a.run(() => api("learning", `/v1/lessons/${id}/open`, "POST"));
  }, [s.data?.id, user?.user_id]);
  const logged = (fn: () => Promise<unknown>, message = "") =>
    user ? void a.run(fn, message) : router.push("/auth/login");
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Resource state={s}>
        {s.data && (
          <>
            <Title
              eyebrow="BÀI HỌC"
              title={s.data.title}
              subtitle={s.data.objectives}
            />
            <ActionNotice action={a} />
            <Button
              secondary
              title="Lưu bài yêu thích"
              disabled={a.busy}
              onPress={() =>
                logged(
                  () => api("learning", "/v1/favorites/" + id, "PUT"),
                  "Đã lưu bài.",
                )
              }
            />
            {s.data.blocks
              .filter((b) => b.type !== "vocabulary")
              .map((block) => (
                <Card key={block.id}>
                  {block.title && <H>{block.title}</H>}
                  {block.body && <P>{block.body}</P>}
                  {block.type === "audio" && (
                    <>
                      <Audio
                        url={block.audio_url}
                        refresh={async () =>
                          (
                            await api<Lesson>("content", "/v1/lessons/" + id)
                          ).blocks.find((b) => b.id === block.id)?.audio_url
                        }
                      />
                      <Button
                        secondary
                        title={
                          transcripts[block.id]
                            ? "Ẩn transcript"
                            : "Xem transcript"
                        }
                        onPress={() =>
                          setTranscripts({
                            ...transcripts,
                            [block.id]: !transcripts[block.id],
                          })
                        }
                      />
                      {transcripts[block.id] && <P>{block.transcript}</P>}
                    </>
                  )}
                </Card>
              ))}
            {s.data.vocabulary.length > 0 && <H>Từ vựng của bài</H>}
            {s.data.vocabulary.map((v) => (
              <Card key={v.vocabulary_id}>
                <H>{v.snapshot.word}</H>
                <Text style={styles.small}>{v.snapshot.phonetic}</Text>
                <P>{v.snapshot.meaning}</P>
                <P>{v.snapshot.example}</P>
                {v.snapshot.audio_url && (
                  <Audio
                    url={v.snapshot.audio_url}
                    refresh={async () =>
                      (
                        await api<Lesson>("content", "/v1/lessons/" + id)
                      ).vocabulary.find(
                        (item) => item.vocabulary_id === v.vocabulary_id,
                      )?.snapshot.audio_url
                    }
                  />
                )}
                <Button
                  secondary
                  title="Lưu vào bộ thẻ"
                  disabled={a.busy}
                  onPress={() =>
                    logged(
                      () =>
                        mutate("learning", "/v1/flashcards", {
                          source_vocabulary_id: v.vocabulary_id,
                          lesson_id: id,
                        }),
                      "Đã lưu từ vựng.",
                    )
                  }
                />
              </Card>
            ))}
            {s.data.assessment_id && (
              <Button
                title="Làm quiz bài học"
                disabled={a.busy}
                onPress={() =>
                  logged(() => startAttempt(s.data!.assessment_id!))
                }
              />
            )}
            <LinkButton title="Ghi chú của bài" to={"/note/" + id} />
            <LinkButton
              title="Dictation của bài"
              to={"/dictations?lesson_id=" + id}
            />
          </>
        )}
      </Resource>
      {!user && (
        <LinkButton title="Đăng nhập để học và lưu tiến độ" to="/auth/login" />
      )}
    </Screen>
  );
}
export function ProgressScreen() {
  const s = useResource(() => api<Progress>("learning", "/v1/progress")),
    a = useAction();
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title title="Nhìn lại từng bước tiến." />
      <ActionNotice action={a} />
      <Resource state={s}>
        {s.data?.course ? (
          <>
            <Card>
              <H>{s.data.course.title}</H>
              <Text style={styles.title}>{s.data.percent ?? 0}%</Text>
              <P>
                {s.data.completed
                  ? "Bạn đã hoàn thành lộ trình."
                  : "Mỗi bài học đều là một bước tiến."}
              </P>
              {s.data.catalog_changed && (
                <>
                  <Notice>Lộ trình có nội dung mới hoặc đã thay đổi.</Notice>
                  <Button
                    secondary
                    title="Đã xem thay đổi"
                    disabled={a.busy}
                    onPress={() =>
                      void a.run(async () => {
                        await api("learning", "/v1/catalog-seen", "POST", {
                          course_id: s.data!.course!.id,
                          catalog_version: Number(
                            s.data!.course!.catalog_version,
                          ),
                        });
                        await s.reload();
                      })
                    }
                  />
                </>
              )}
            </Card>
            {s.data.topics.map((topic) => (
              <Card key={topic.id}>
                <H>{topic.title}</H>
                <P>
                  {topic.percent ?? 0}% bài học · Kiểm tra:{" "}
                  {topic.test_passed ? "Đã đạt" : "Chưa đạt"}
                </P>
                {topic.lessons.map((l) => (
                  <LinkButton
                    key={l.id}
                    title={`${l.title} · ${status(l.status ?? "")}`}
                    to={"/lesson/" + l.id}
                  />
                ))}
                {topic.assessment_id && (
                  <Button
                    title="Làm kiểm tra chủ đề"
                    disabled={a.busy}
                    onPress={() =>
                      void a.run(() => startAttempt(topic.assessment_id!))
                    }
                  />
                )}
              </Card>
            ))}
          </>
        ) : (
          s.data && (
            <LinkButton
              title="Chọn lộ trình để bắt đầu"
              to="/(tabs)/discover"
            />
          )
        )}
      </Resource>
    </Screen>
  );
}
export function HistoryScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const [page, setPage] = useState(1),
    [dictation, setDictation] = useState(kind === "dictation");
  const s = useResource(
    () =>
      api<Page<History>>(
        "learning",
        `/v1/${dictation ? "dictation-attempts" : "attempts"}?page=${page}`,
      ),
    `${page}.${dictation}`,
  );
  return (
    <Screen onRefresh={() => void s.reload()} refreshing={s.busy && !!s.data}>
      <Title
        title="Lịch sử học tập"
        subtitle="Mở lượt đang làm để tiếp tục từ dữ liệu đã lưu."
      />
      <View style={styles.row}>
        <Button
          title="Quiz / Kiểm tra"
          secondary={dictation}
          onPress={() => {
            setPage(1);
            setDictation(false);
          }}
        />
        <Button
          title="Dictation"
          secondary={!dictation}
          onPress={() => {
            setPage(1);
            setDictation(true);
          }}
        />
      </View>
      <Resource state={s}>
        {s.data?.items.map((item) => (
          <Card key={item.id}>
            <H>{item.title_snapshot}</H>
            <P>{status(item.status)}</P>
            <Text style={styles.small}>
              {date(item.started_at ?? item.created_at)}
            </Text>
            <LinkButton
              title={item.status === "in_progress" ? "Tiếp tục" : "Xem kết quả"}
              to={`/${dictation ? "dictation-attempt" : "attempt"}/${item.id}`}
            />
          </Card>
        ))}
        {s.data && !s.data.items.length && <P>Chưa có lượt học ở trang này.</P>}
      </Resource>
      <Pager page={page} count={s.data?.items.length ?? 0} onChange={setPage} />
    </Screen>
  );
}
