import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import type { Storage } from "@sprout/api-client";
// Atomic manifest swap; small chunks accommodate large Supabase sessions and retry records.
type Manifest = { generation: string; count: number };
const safe = (key: string) => `sprout.${key.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
async function manifest(key: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  const value = JSON.parse(raw) as Manifest;
  if (
    !value.generation ||
    !Number.isInteger(value.count) ||
    value.count < 1 ||
    value.count > 2000
  )
    throw new Error("Dữ liệu phiên không hợp lệ.");
  return value;
}
async function removeChunks(key: string, value: Manifest | null) {
  if (value)
    await Promise.all(
      Array.from({ length: value.count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}.${value.generation}.${i}`),
      ),
    );
}
let writes: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = writes.then(fn, fn);
  writes = next.catch(() => {});
  return next;
}
export const secureStorage: Storage = {
  getItem(input) {
    return serialize(async () => {
      const key = safe(input),
        value = await manifest(key);
      if (!value) return null;
      const parts = await Promise.all(
        Array.from({ length: value.count }, (_, i) =>
          SecureStore.getItemAsync(`${key}.${value.generation}.${i}`),
        ),
      );
      if (parts.some((p) => p === null))
        throw new Error("Không đọc được phiên đã lưu. Hãy đăng nhập lại.");
      return parts.join("");
    });
  },
  setItem(input, text) {
    return serialize(async () => {
      const key = safe(input),
        old = await manifest(key),
        generation = Crypto.randomUUID();
      const characters = Array.from(text);
      const parts = Array.from(
        { length: Math.max(1, Math.ceil(characters.length / 400)) },
        (_, i) => characters.slice(i * 400, (i + 1) * 400).join(""),
      );
      if (parts.length > 2000)
        throw new Error("Dữ liệu lưu trên thiết bị vượt giới hạn.");
      const current = { generation, count: parts.length };
      try {
        for (let i = 0; i < parts.length; i++)
          await SecureStore.setItemAsync(
            `${key}.${generation}.${i}`,
            parts[i],
            { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
          );
        await SecureStore.setItemAsync(key, JSON.stringify(current), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch (error) {
        await removeChunks(key, current).catch(() => {});
        throw error;
      }
      await removeChunks(key, old).catch(() => {});
    });
  },
  removeItem(input) {
    return serialize(async () => {
      const key = safe(input),
        old = await manifest(key);
      await SecureStore.deleteItemAsync(key);
      await removeChunks(key, old);
    });
  },
};
