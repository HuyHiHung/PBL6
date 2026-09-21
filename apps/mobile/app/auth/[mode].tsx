import { useState } from "react";
import { Linking, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { auth, api, callbackUrl, settings } from "../../src/lib/runtime";
import { handleCallback } from "../../src/lib/callback";
import { useSession } from "../../src/lib/session";
import {
  Screen,
  Title,
  Card,
  Field,
  Button,
  LinkButton,
  useAction,
  ActionNotice,
  styles,
  Notice,
} from "../../src/components/ui";
export default function AuthScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>(),
    session = useSession(),
    a = useAction();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const signup = mode === "signup",
    forgot = mode === "forgot",
    reset = mode === "reset";
  async function submit() {
    if (
      (signup || reset) &&
      (password.length < 8 ||
        password.length > 72 ||
        !/[A-Za-z]/.test(password) ||
        !/[0-9]/.test(password))
    )
      throw new Error("Mật khẩu cần 8–72 ký tự, có chữ và số.");
    if (signup && (name.trim().length < 2 || name.trim().length > 50))
      throw new Error("Tên hiển thị cần 2–50 ký tự.");
    if (signup) {
      const { error } = await auth.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: callbackUrl,
        },
      });
      if (error) throw error;
    } else if (forgot) {
      const { error } = await auth.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl + "?mode=recovery",
      });
      if (error)
        throw new Error("Chưa gửi được email hướng dẫn. Hãy thử lại sau.");
    } else if (reset) {
      if (!session.recovery || !session.authenticated)
        throw new Error("Hãy mở liên kết khôi phục mật khẩu trước.");
      const { error } = await auth.auth.updateUser({ password });
      if (error) throw error;
      await api("identity", "/v1/logout-all", "POST");
      await auth.auth.signOut({ scope: "global" });
      await session.setRecovery(false);
      router.replace("/auth/login");
    } else {
      const { error } = await auth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error)
        throw new Error(
          "Email hoặc mật khẩu không hợp lệ, hoặc email chưa xác minh.",
        );
      await session.setRecovery(false);
      await session.reload();
      router.replace("/");
    }
  }
  async function google() {
    const { data, error } = await auth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, callbackUrl);
    if (result.type !== "success") return;
    await handleCallback(result.url);
    await session.setRecovery(false);
    await session.reload();
    router.replace("/");
  }
  return (
    <Screen>
      <Title
        eyebrow="CHÀO MỪNG ĐẾN SPROUT"
        title={
          signup
            ? "Bắt đầu hành trình"
            : forgot
              ? "Quên mật khẩu?"
              : reset
                ? "Mật khẩu mới"
                : "Chào bạn trở lại."
        }
        subtitle="Mỗi ngày một chút. Tự tin hơn mỗi ngày."
      />
      <Card>
        {signup && (
          <Field
            label="Tên hiển thị"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        )}
        {!reset && (
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
        {!forgot && (
          <Field
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={signup || reset ? "new-password" : "current-password"}
            maxLength={72}
          />
        )}
        <ActionNotice action={a} />
        <Notice>
          {reset && !session.recovery
            ? "Mở liên kết đặt lại từ email trên điện thoại đã gửi yêu cầu."
            : ""}
        </Notice>
        <Button
          title={
            a.busy
              ? "Đang xử lý…"
              : signup
                ? "Tạo tài khoản"
                : forgot
                  ? "Gửi liên kết khôi phục"
                  : reset
                    ? "Lưu mật khẩu"
                    : "Đăng nhập"
          }
          disabled={a.busy || (reset && !session.recovery)}
          onPress={() =>
            void a.run(
              submit,
              signup
                ? "Kiểm tra email và mở liên kết trên thiết bị này để xác minh."
                : forgot
                  ? "Nếu địa chỉ đủ điều kiện, bạn sẽ nhận được email hướng dẫn."
                  : "",
            )
          }
        />
        {!forgot && !reset && settings.google && (
          <Button
            secondary
            title="Tiếp tục với Google"
            disabled={a.busy}
            onPress={() => void a.run(google)}
          />
        )}
        {!signup && !reset && !forgot && (
          <Button
            secondary
            title="Gửi lại email xác minh"
            disabled={a.busy || !email.trim()}
            onPress={() =>
              void a.run(async () => {
                const { error } = await auth.auth.resend({
                  type: "signup",
                  email: email.trim(),
                  options: { emailRedirectTo: callbackUrl },
                });
                if (error)
                  throw new Error("Chưa gửi được email. Hãy thử lại sau.");
              }, "Nếu địa chỉ đủ điều kiện, email xác minh đã được gửi.")
            }
          />
        )}
      </Card>
      <LinkButton
        title={
          signup || forgot || reset
            ? "Trở về đăng nhập"
            : "Chưa có tài khoản? Đăng ký"
        }
        to={signup || forgot || reset ? "/auth/login" : "/auth/signup"}
      />
      {!forgot && <LinkButton title="Quên / Đổi mật khẩu" to="/auth/forgot" />}
      {session.authenticated && (
        <Button
          secondary
          title="Đăng xuất phiên hiện tại"
          disabled={a.busy}
          onPress={() => void a.run(session.logout)}
        />
      )}
      {settings.recoveryUrl && (
        <Button
          secondary
          title="Khôi phục bằng trang web"
          onPress={() => void Linking.openURL(settings.recoveryUrl)}
        />
      )}
      <Text style={styles.small}>
        Tiến độ của bạn được lưu chung với Sprout trên web.
      </Text>
    </Screen>
  );
}
