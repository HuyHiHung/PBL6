import { useState, type FormEvent } from "react";
import { Sprout, ArrowLeft } from "lucide-react";
import { api, auth, go, type Row } from "./api";
import { Notice, useAction, useLoad } from "./ui";
export function AuthPage({ mode = "login" }: { mode?: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const a = useAction();
  const signup = mode === "signup",
    forgot = mode === "forgot",
    reset = mode === "reset";
  async function google() {
    if (import.meta.env.VITE_GOOGLE_ENABLED !== "true")
      throw new Error(
        "Đăng nhập Google hiện chưa khả dụng. Bạn có thể tiếp tục bằng email.",
      );
    const { error } = await auth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + "/auth/callback" },
    });
    if (error) throw error;
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    await a.run(
      async () => {
        if (signup || reset) {
          if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
            throw new Error("Mật khẩu cần có cả chữ và số.");
        }
        const callback = location.origin + "/auth/callback";
        if (signup) {
          const r = await auth.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { full_name: name.trim() },
              emailRedirectTo: callback,
            },
          });
          if (r.error) throw r.error;
        } else if (forgot) {
          const r = await auth.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: callback,
          });
          if (r.error)
            throw new Error("Chưa gửi được email. Vui lòng thử lại sau.");
        } else if (reset) {
          const r = await auth.auth.updateUser({ password });
          if (r.error) throw r.error;
          await api("identity", "/v1/logout-all", "POST");
          await auth.auth.signOut({ scope: "global" });
          go("/login");
        } else {
          const r = await auth.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (r.error)
            throw new Error(
              "Email hoặc mật khẩu không hợp lệ, hoặc email chưa được xác minh.",
            );
          go("/");
        }
      },
      signup
        ? "Kiểm tra hộp thư để xác minh email trước khi đăng nhập."
        : forgot
          ? "Nếu địa chỉ đủ điều kiện, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu."
          : "",
    );
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <a className="brand" href="#/">
          <Sprout />
          sprout<span>ENGLISH</span>
        </a>
        <div>
          <div className="eyebrow">SMALL STEPS. REAL PROGRESS.</div>
          <h1>
            Mỗi ngày một chút.
            <br />
            Tự tin hơn mỗi ngày.
          </h1>
          <p>
            Một nơi để học điều mới, luyện điều khó và nhìn lại những gì bạn đã
            làm được.
          </p>
          <div className="leaf-art" aria-hidden="true">
            <span>hello.</span>
            <i />
            <b />
          </div>
        </div>
        <small>Hành trình tiếng Anh của riêng bạn.</small>
      </aside>
      <section className="auth-panel">
        <a href="#/" className="text-link">
          <ArrowLeft size={16} />
          Trở về khám phá
        </a>
        <h1>
          {signup
            ? "Bắt đầu hành trình"
            : forgot
              ? "Quên mật khẩu?"
              : reset
                ? "Đặt mật khẩu mới"
                : "Chào mừng trở lại"}
        </h1>
        <p>
          {signup
            ? "Tạo tài khoản để lưu tiến độ học của bạn."
            : forgot
              ? "Nhập email để nhận hướng dẫn khôi phục."
              : "Học thêm một điều mới, ngay hôm nay."}
        </p>
        <Notice>{a.error}</Notice>
        <Notice good>{a.success}</Notice>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Tên hiển thị
              <input
                required
                minLength={2}
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          {!reset && (
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          )}
          {!forgot && (
            <label>
              Mật khẩu
              <input
                aria-label="Mật khẩu"
                type="password"
                required
                minLength={signup || reset ? 8 : 1}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  signup || reset ? "new-password" : "current-password"
                }
              />
              {(signup || reset) && <small>8–72 ký tự, gồm chữ và số.</small>}
            </label>
          )}
          <button disabled={a.busy}>
            {a.busy
              ? "Đang xử lý…"
              : signup
                ? "Tạo tài khoản"
                : forgot
                  ? "Gửi hướng dẫn"
                  : reset
                    ? "Lưu mật khẩu"
                    : "Đăng nhập"}
          </button>
        </form>
        {!forgot && !reset && (
          <>
            <div className="divider">hoặc tiếp tục với</div>
            <button
              className="secondary wide"
              disabled={a.busy}
              onClick={() => a.run(google)}
            >
              <span className="google">G</span>Google
            </button>
            <p className="auth-foot">
              {signup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
              <a href={signup ? "#/login" : "#/signup"}>
                {signup ? "Đăng nhập" : "Đăng ký"}
              </a>
            </p>
            <a className="text-link" href="#/forgot">
              Quên mật khẩu
            </a>
            <button
              className="text-link"
              disabled={a.busy || !email}
              onClick={() =>
                a.run(async () => {
                  const { error } = await auth.auth.resend({
                    type: "signup",
                    email: email.trim(),
                    options: {
                      emailRedirectTo: location.origin + "/auth/callback",
                    },
                  });
                  if (error) throw error;
                }, "Nếu phù hợp, email xác minh đã được gửi lại.")
              }
            >
              Gửi lại email xác minh
            </button>
          </>
        )}
      </section>
    </div>
  );
}
export function Profile({ me, reload }: { me: Row; reload: () => void }) {
  const [name, setName] = useState(me.display_name ?? "");
  const providers = useLoad(async () => {
    const { data, error } = await auth.auth.getUser();
    if (error) throw error;
    return (data.user?.app_metadata.providers ?? []) as string[];
  }, [me.user_id]);
  const a = useAction();
  return (
    <div className="card narrow">
      <h2>Hồ sơ của bạn</h2>
      <p>
        Phương thức đăng nhập:{" "}
        {providers.data
          ?.map((p) =>
            p === "google" ? "Google" : p === "email" ? "Email" : p,
          )
          .join(", ") || "Đang tải…"}
      </p>
      <Notice>{providers.error}</Notice>
      <Notice>{a.error}</Notice>
      <Notice good>{a.success}</Notice>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.run(async () => {
            await api("identity", "/v1/me", "PATCH", {
              display_name: name.trim(),
              expectedVersion: Number(me.row_version),
            });
            reload();
          }, "Đã lưu tên hiển thị.");
        }}
      >
        <label>
          Email
          <input readOnly value={me.email} />
        </label>
        <label>
          Tên hiển thị
          <input
            required
            minLength={2}
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button disabled={a.busy}>Lưu thay đổi</button>
      </form>
      <a className="text-link" href="#/forgot">
        Đặt lại mật khẩu qua email
      </a>
    </div>
  );
}
