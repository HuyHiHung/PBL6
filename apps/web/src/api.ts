import { createClient } from "@supabase/supabase-js";
export const auth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
export type Service = "identity" | "content" | "learning";
const bases = {
  identity: import.meta.env.VITE_IDENTITY_URL,
  content: import.meta.env.VITE_CONTENT_URL,
  learning: import.meta.env.VITE_LEARNING_URL,
};
const messages: Record<string, string> = {
  SESSION_CHANGED: "Tài khoản đã thay đổi. Hãy mở lại mini game.",
  INSUFFICIENT_WORDS:
    "Chưa có đủ từ hợp lệ để chơi. Hãy thêm thẻ hoặc chọn bài khác.",
  ACTIVE_GAME_EXISTS:
    "Bạn đang có một lượt chưa kết thúc. Hãy mở và kết thúc lượt trước.",
  SESSION_EXPIRED:
    "Lượt chơi đã hết hạn lưu. Bạn vẫn có thể xem kết quả trên thiết bị này.",
  SESSION_ALREADY_FINISHED: "Lượt chơi đã kết thúc ở một tab khác.",
  SESSION_NOT_FOUND: "Không tìm thấy lượt chơi của bạn.",
  INVALID_GAME_LOG:
    "Không thể xác nhận kết quả lượt này. Hãy bắt đầu lượt mới.",
  GAME_DISABLED: "Mini game đang tạm đóng lượt chơi mới.",
  AUTH_REQUIRED: "Hãy đăng nhập để tiếp tục.",
  INVALID_SESSION: "Phiên đã kết thúc. Vui lòng đăng nhập lại.",
  ACCOUNT_LOCKED: "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  PROFILE_REQUIRED: "Hãy hoàn tất tên hiển thị trong hồ sơ.",
  VERSION_CONFLICT: "Dữ liệu đã thay đổi. Tải lại trang để xem bản mới nhất.",
  CONFLICT: "Thao tác bị trùng hoặc nội dung đã có bản nháp.",
  CONTENT_UNAVAILABLE: "Nội dung hiện không còn khả dụng.",
  NO_CARDS_DUE: "Bạn đã ôn hết thẻ đến hạn. Hãy quay lại sau!",
  NO_MISTAKES: "Không còn câu sai cần ôn.",
  OPEN_A_LESSON_FIRST: "Hãy mở một bài trong chủ đề trước khi làm kiểm tra.",
  CONFIRM_BLANK_REQUIRED:
    "Vẫn còn câu chưa trả lời. Xác nhận bỏ trống để nộp bài.",
  DRAFT_REQUIRED: "Chỉ có thể sửa bản nháp chưa xuất bản.",
  INVALID_TRANSCRIPT_LENGTH: "Transcript cần có từ 1 đến 200 từ.",
  INVALID_ANSWER_LENGTH: "Bản chép cần có từ 1 đến 1.000 từ.",
  UPSTREAM_UNAVAILABLE: "Dịch vụ đang gián đoạn. Vui lòng thử lại.",
  EMAIL_NOT_VERIFIED: "Hãy xác minh email trước khi tiếp tục.",
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(messages[code] ?? `Không thể thực hiện thao tác (${code}).`);
  }
}
// DTO fields vary by CMS entity; callers only render explicit fields, never HTML from content.
export type Row = Record<string, any>;
export async function api<T = Row>(
  service: Service,
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
  signal?: AbortSignal,
  expectedUser?: string,
): Promise<T> {
  const {
    data: { session },
  } = await auth.auth.getSession();
  if (expectedUser && session?.user.id !== expectedUser)
    throw new ApiError(401, "SESSION_CHANGED");
  let response: Response;
  try {
    response = await fetch(bases[service] + path, {
      method,
      headers: {
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(body instanceof Blob
          ? { "Content-Type": body.type }
          : body !== undefined && !(body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body:
        body === undefined
          ? undefined
          : body instanceof FormData || body instanceof Blob
            ? body
            : JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  const result = await response.json();
  if (
    expectedUser &&
    (await auth.auth.getSession()).data.session?.user.id !== expectedUser
  )
    throw new ApiError(401, "SESSION_CHANGED");
  if (!response.ok)
    throw new ApiError(response.status, result.error?.code ?? "UNKNOWN_ERROR");
  return result;
}
// Keep a key across uncertain retries with the same payload, discard after confirmed success.
const pending = new Map<string, string>();
export async function mutate<T = Row>(
  service: Service,
  path: string,
  body: unknown,
) {
  const {
    data: { session },
  } = await auth.auth.getSession();
  const signature = JSON.stringify([session?.user.id, service, path, body]);
  const key = pending.get(signature) ?? crypto.randomUUID();
  pending.set(signature, key);
  try {
    const result = await api<T>(service, path, "POST", body, key);
    pending.delete(signature);
    return result;
  } catch (e) {
    if (e instanceof ApiError && e.status < 500) pending.delete(signature);
    throw e;
  }
}
export const go = (path: string) => {
  location.hash = path;
};
export const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const statusText = (s: string) =>
  ({
    draft: "Bản nháp",
    published: "Đã xuất bản",
    hidden: "Đang ẩn",
    active: "Hoạt động",
    locked: "Đã khóa",
    disabled: "Vô hiệu hóa",
    in_progress: "Đang học",
    submitted: "Đã nộp",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
    not_started: "Chưa học",
  })[s] ?? s;
