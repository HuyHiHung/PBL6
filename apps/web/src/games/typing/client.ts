import { api, auth } from "../../api";
import type {
  TypingFinish,
  TypingSession,
  TypingStart,
} from "../../../../../packages/api-client/src/typing";

export const freshGames = new Set<string>();
export const gameApi = <T>(
  user: string,
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
) => api<T>("learning", path, method, body, key, undefined, user);
const startKeys = new Map<string, string>();
export async function startGame(user: string, body: TypingStart) {
  const signature = JSON.stringify([user, body]);
  const key = startKeys.get(signature) ?? crypto.randomUUID();
  startKeys.set(signature, key);
  const result = await gameApi<TypingSession>(
    user,
    "/v1/typing-sessions",
    "POST",
    body,
    key,
  );
  startKeys.delete(signature);
  if (result.status === "in_progress") freshGames.add(result.id);
  return result;
}
export type PendingResult = {
  id: string;
  user: string;
  key: string;
  payload: TypingFinish;
};
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sprout-typing", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("results", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Không thể mở bộ nhớ kết quả."));
    request.onblocked = () =>
      reject(new Error("Bộ nhớ đang bị một tab khác giữ."));
  });
}
async function transaction<T>(
  write: boolean,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("results", write ? "readwrite" : "readonly");
      const req = action(tx.objectStore("results"));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () =>
        reject(tx.error ?? new Error("Không thể lưu bộ nhớ kết quả."));
      tx.onabort = () =>
        reject(tx.error ?? new Error("Không thể lưu bộ nhớ kết quả."));
    });
  } finally {
    db.close();
  }
}
export async function readPending(user: string, id: string) {
  const item = await transaction<PendingResult | undefined>(false, (s) =>
    s.get(id),
  );
  return item?.user === user ? item : undefined;
}
export async function savePending(item: PendingResult) {
  const { data } = await auth.auth.getSession();
  if (data.session?.user.id !== item.user)
    throw new Error("Tài khoản đã thay đổi.");
  await transaction(true, (s) => s.put(item));
  if ((await auth.auth.getSession()).data.session?.user.id !== item.user) {
    await deletePending(item.id);
    throw new Error("Tài khoản đã thay đổi.");
  }
}
export async function deletePending(id: string) {
  await transaction(true, (s) => s.delete(id));
}
// Keep offline results through token refresh, remove private drafts on logout/account switch.
let previousUser: string | undefined;
auth.auth.onAuthStateChange((_event, session) => {
  const next = session?.user.id;
  if (previousUser && previousUser !== next) {
    freshGames.clear();
    startKeys.clear();
    void transaction(true, (s) => s.clear()).catch(() => {});
  }
  previousUser = next;
});
