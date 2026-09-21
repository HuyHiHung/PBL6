import { secureStorage } from "../src/lib/storage";
const mockValues = new Map<string, string>();
let mockFailure = false;
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
  getItemAsync: jest.fn(async (key: string) => mockValues.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (mockFailure && key.endsWith(".1")) throw new Error("write failed");
    mockValues.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockValues.delete(key);
  }),
}));
let mockId = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => String(++mockId) }));
beforeEach(() => {
  mockValues.clear();
  mockFailure = false;
});
test("large sessions preserve Vietnamese and emoji across encrypted chunks", async () => {
  const value = "Tiếng Việt 🌱🔐 ".repeat(250);
  await secureStorage.setItem("session", value);
  expect(await secureStorage.getItem("session")).toBe(value);
  expect(
    [...mockValues.values()]
      .filter((v) => !v.includes("generation"))
      .every((v) => Buffer.byteLength(v, "utf8") <= 1600),
  ).toBe(true);
  await secureStorage.removeItem("session");
  expect(mockValues.size).toBe(0);
});
test("failed replacement leaves the previous session readable", async () => {
  await secureStorage.setItem("session", "old session");
  mockFailure = true;
  await expect(
    secureStorage.setItem("session", "new".repeat(500)),
  ).rejects.toThrow("write failed");
  expect(await secureStorage.getItem("session")).toBe("old session");
});
test("concurrent reads and writes never see an incomplete generation", async () => {
  await secureStorage.setItem("session", "first".repeat(500));
  const values = await Promise.all([
    secureStorage.getItem("session"),
    secureStorage.setItem("session", "second".repeat(500)),
    secureStorage.getItem("session"),
  ]);
  expect(values[0]).toBe("first".repeat(500));
  expect(values[2]).toBe("second".repeat(500));
});
