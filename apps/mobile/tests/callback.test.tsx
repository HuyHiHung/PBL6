import { handleCallback } from "../src/lib/callback";
const mockExchange = jest.fn();
jest.mock("../src/lib/runtime", () => ({
  auth: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchange(...args),
    },
  },
  callbackUrl: "sprout://auth/callback",
}));
beforeEach(() => {
  mockExchange.mockReset();
  mockExchange.mockResolvedValue({ error: null });
});
test("duplicate native/browser callback handlers exchange the PKCE code only once", async () => {
  const url = "sprout://auth/callback?code=duplicate-code";
  expect(await Promise.all([handleCallback(url), handleCallback(url)])).toEqual(
    [false, false],
  );
  expect(mockExchange).toHaveBeenCalledTimes(1);
});
test("recovery callback preserves the recovery flow and invalid routes never exchange tokens", async () => {
  expect(
    await handleCallback(
      "sprout://auth/callback?code=recovery-code&mode=recovery",
    ),
  ).toBe(true);
  mockExchange.mockClear();
  await expect(
    handleCallback("https://outside.example/auth/callback?code=code"),
  ).rejects.toThrow("không hợp lệ");
  await expect(
    handleCallback("sprout://auth/callback?error=access_denied"),
  ).rejects.toThrow("hết hạn");
  await expect(handleCallback("sprout://auth/callback")).rejects.toThrow(
    "Thiếu mã",
  );
  expect(mockExchange).not.toHaveBeenCalled();
});
test("an expired or cross-device PKCE exchange has a recovery instruction", async () => {
  mockExchange.mockResolvedValue({ error: { message: "invalid verifier" } });
  await expect(
    handleCallback("sprout://auth/callback?code=expired-code"),
  ).rejects.toThrow("thiết bị đã gửi yêu cầu");
});
