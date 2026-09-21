export type * from "./types.js";
export type Service = "identity" | "content" | "learning";
export type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
export type Session = { userId: string; token: string };
export type Pending = {
  key: string;
  signature: string;
  service: Service;
  path: string;
  body: unknown;
  createdAt: string;
};
const messages: Record<string, string> = {
  AUTH_REQUIRED: "Hãy đăng nhập để tiếp tục.",
  INVALID_SESSION: "Phiên đã kết thúc. Hãy đăng nhập lại.",
  SESSION_REVOKED: "Phiên đã bị thu hồi. Hãy đăng nhập lại.",
  ACCOUNT_LOCKED: "Tài khoản đang bị khóa.",
  PROFILE_REQUIRED: "Hãy hoàn tất tên hiển thị trong hồ sơ.",
  EMAIL_NOT_VERIFIED: "Hãy xác minh email trước khi học.",
  VERSION_CONFLICT:
    "Dữ liệu đã thay đổi. Tải bản mới trước khi lưu tiếp; bản nhập của bạn được giữ lại.",
  CONTENT_UNAVAILABLE:
    "Nội dung không còn khả dụng. Hãy xem trạng thái trong lịch sử.",
  NO_CARDS_DUE: "Bạn đã ôn hết thẻ đến hạn.",
  NO_MISTAKES: "Không còn câu sai cần ôn.",
  OPEN_A_LESSON_FIRST: "Hãy mở một bài trong chủ đề trước khi kiểm tra.",
  CONFIRM_BLANK_REQUIRED: "Còn câu chưa trả lời. Xác nhận bỏ trống để nộp.",
  INVALID_ANSWER_LENGTH: "Bản chép cần có từ 1 đến 1.000 từ.",
  UPSTREAM_UNAVAILABLE: "Dịch vụ đang gián đoạn. Hãy thử lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  SESSION_CHANGED: "Tài khoản đã thay đổi. Hãy tải lại màn hình.",
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(messages[code] ?? `Không thể thực hiện thao tác (${code}).`);
  }
}
export function createApiClient(options: {
  bases: Record<Service, string>;
  session: () => Promise<Session | null>;
  storage: Storage;
  uuid: () => string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  onAuthError?: (error: ApiError) => void;
}) {
  const transport = options.fetch ?? fetch;
  let queue: Promise<unknown> = Promise.resolve();
  const locked = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(fn, fn);
    queue = next.catch(() => {});
    return next;
  };
  const storageKey = (user: string) => `pending.${user}`;
  const read = async (user: string): Promise<Pending[]> =>
    JSON.parse(
      (await options.storage.getItem(storageKey(user))) ?? "[]",
    ) as Pending[];
  const write = async (user: string, items: Pending[]) =>
    items.length
      ? options.storage.setItem(storageKey(user), JSON.stringify(items))
      : options.storage.removeItem(storageKey(user));
  async function request<T>(
    service: Service,
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
    expectedUser?: string,
  ): Promise<T> {
    if (!path.startsWith("/v1/") || path.includes("://"))
      throw new Error("Chỉ được gọi API public /v1/.");
    const session = await options.session();
    if (expectedUser && session?.userId !== expectedUser)
      throw new ApiError(401, "SESSION_CHANGED");
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 20000,
    );
    try {
      const response = await transport(options.bases[service] + path, {
        method,
        signal: controller.signal,
        headers: {
          ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(key ? { "Idempotency-Key": key } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const result = (await response.json()) as T & {
        error?: { code?: string };
      };
      if ((await options.session())?.userId !== session?.userId)
        throw new ApiError(401, "SESSION_CHANGED");
      if (!response.ok) {
        const error = new ApiError(
          response.status,
          result.error?.code ?? "UNKNOWN_ERROR",
        );
        if (response.status === 401 || error.code === "ACCOUNT_LOCKED")
          options.onAuthError?.(error);
        throw error;
      }
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error(
        "Chưa nhận được xác nhận từ máy chủ. Kiểm tra mạng và thử lại cùng thao tác.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  const inflight = new Map<string, Promise<unknown>>();
  async function mutate<T>(
    service: Service,
    path: string,
    body: unknown,
  ): Promise<T> {
    const session = await options.session();
    if (!session) throw new ApiError(401, "AUTH_REQUIRED");
    const user = session.userId;
    const signature = JSON.stringify([service, path, body]);
    const scope = user + signature;
    const active = inflight.get(scope);
    if (active) return active as Promise<T>;
    const run = (async () => {
      const pending = await locked(async () => {
        const items = await read(user);
        const old = items.find((item) => item.signature === signature);
        if (old) return old;
        const item = {
          key: options.uuid(),
          signature,
          service,
          path,
          body,
          createdAt: new Date().toISOString(),
        };
        await write(user, [...items, item]);
        return item;
      });
      const remove = () =>
        locked(async () =>
          write(
            user,
            (await read(user)).filter((item) => item.key !== pending.key),
          ),
        );
      try {
        const value = await request<T>(
          service,
          path,
          "POST",
          body,
          pending.key,
          user,
        );
        await remove();
        return value;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 401 &&
          error.status !== 429
        )
          await remove();
        throw error;
      }
    })();
    inflight.set(scope, run);
    try {
      return await run;
    } finally {
      inflight.delete(scope);
    }
  }
  return {
    request,
    mutate,
    pending: async () => {
      const s = await options.session();
      return s ? locked(() => read(s.userId)) : [];
    },
    clearPending: (user: string) =>
      locked(() => options.storage.removeItem(storageKey(user))),
  };
}
