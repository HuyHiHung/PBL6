import { auth, callbackUrl } from "./runtime";
const handled = new Map<string, Promise<boolean>>();
export function handleCallback(url: string): Promise<boolean> {
  const parsed = new URL(url);
  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== callbackUrl)
    return Promise.reject(new Error("Liên kết xác thực không hợp lệ."));
  if (parsed.searchParams.has("error") || parsed.hash.includes("error="))
    return Promise.reject(
      new Error(
        "Liên kết xác thực đã hết hạn hoặc bị từ chối. Hãy yêu cầu liên kết mới.",
      ),
    );
  const code = parsed.searchParams.get("code");
  if (!code)
    return Promise.reject(
      new Error(
        "Thiếu mã xác thực. Mở liên kết trên thiết bị đã gửi yêu cầu hoặc dùng trang khôi phục web.",
      ),
    );
  const existing = handled.get(code);
  if (existing) return existing;
  const promise = (async () => {
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (error)
      throw new Error(
        "Không hoàn tất xác thực. Mở liên kết trên thiết bị đã gửi yêu cầu hoặc yêu cầu liên kết mới.",
      );
    return parsed.searchParams.get("mode") === "recovery";
  })();
  handled.set(code, promise);
  if (handled.size > 20) handled.delete(handled.keys().next().value!);
  return promise;
}
