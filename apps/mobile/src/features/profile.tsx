import { useState } from "react";
import { router } from "expo-router";
import type { Pending } from "@sprout/api-client";
import { api, client, mutate } from "../lib/runtime";
import { useSession } from "../lib/session";
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
  confirm,
} from "../components/ui";
export function ProfileScreen() {
  const session = useSession(),
    a = useAction(),
    [name, setName] = useState(session.user?.display_name ?? "");
  const pending = useResource(() => client.pending());
  function label(item: Pending) {
    if (item.path.includes("dictation")) return "Lượt luyện nghe";
    if (item.path.includes("/rate")) return "Đánh giá thẻ";
    if (item.path.includes("flashcard")) return "Thẻ và phiên ôn";
    if (item.path.includes("/check")) return "Kiểm tra câu trả lời";
    if (item.path.includes("/submit")) return "Nộp bài";
    return "Lượt học";
  }
  async function retry(item: Pending) {
    if (
      !(await confirm(
        "Gửi lại thao tác?",
        "Thao tác sẽ dùng đúng nội dung đã gửi trước đó. Máy chủ sẽ đối chiếu để tránh lưu trùng.",
      ))
    )
      return;
    try {
      const value = await mutate<{ attempt_id?: string; session_id?: string }>(
        item.service,
        item.path,
        item.body,
      );
      if (value.attempt_id)
        router.push(
          `/${item.path.includes("dictation") ? "dictation-attempt" : "attempt"}/${value.attempt_id}` as never,
        );
      else if (value.session_id)
        router.push(`/review-session/${value.session_id}` as never);
    } finally {
      await pending.reload();
    }
  }
  return (
    <Screen>
      <Title
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title={session.user?.display_name ?? "Hoàn tất hồ sơ"}
        subtitle={session.user?.email}
      />
      <ActionNotice action={a} />
      <Card>
        <Field
          label="Tên hiển thị"
          value={name}
          onChangeText={setName}
          maxLength={50}
        />
        <Button
          title="Lưu hồ sơ"
          disabled={a.busy}
          onPress={() =>
            void a.run(async () => {
              if (name.trim().length < 2)
                throw new Error("Tên cần 2–50 ký tự.");
              try {
                await api("identity", "/v1/me", "PATCH", {
                  display_name: name.trim(),
                  expectedVersion: Number(session.user!.row_version),
                });
                await session.reload();
              } catch (e) {
                await session.reload();
                throw e;
              }
            }, "Đã lưu hồ sơ.")
          }
        />
      </Card>
      <LinkButton title="Tiến độ học tập" to="/progress" />
      <LinkButton title="Lịch sử và lượt đang làm" to="/history" />
      <LinkButton title="Bài yêu thích" to="/favorites" />
      <LinkButton title="Ghi chú của tôi" to="/notes" />
      <LinkButton title="Đổi mật khẩu qua email" to="/auth/forgot" />
      <Resource state={pending}>
        {!!pending.data?.length && (
          <>
            <H>Thao tác cần kiểm tra</H>
            <Notice>
              Chưa nhận được xác nhận cho các thao tác dưới đây. Xem lịch sử
              trước hoặc gửi lại cùng nội dung.
            </Notice>
            {pending.data.map((item) => (
              <Card key={item.key}>
                <P>{label(item)}</P>
                <Button
                  secondary
                  title="Gửi lại thao tác đã lưu"
                  disabled={a.busy}
                  onPress={() =>
                    void a.run(
                      () => retry(item),
                      "Máy chủ đã xác nhận thao tác.",
                    )
                  }
                />
              </Card>
            ))}
          </>
        )}
      </Resource>
      <Button
        secondary
        title="Đăng xuất"
        disabled={a.busy}
        onPress={() =>
          void a.run(async () => {
            if (
              !(await confirm(
                "Đăng xuất?",
                "Phiên trên điện thoại này sẽ kết thúc. Dữ liệu đã lưu trên máy chủ vẫn được giữ.",
              ))
            )
              return;
            await session.logout();
            router.replace("/");
          })
        }
      />
    </Screen>
  );
}
