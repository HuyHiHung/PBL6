import { render, screen, act } from "@testing-library/react-native";
import { Text } from "react-native";
import { SessionProvider, useSession } from "../src/lib/session";
let mockCurrent = { user: { id: "first" } };
let mockListener: (event: string, session: typeof mockCurrent) => void;
let mockResolve: (value: unknown) => void;
jest.mock("../src/lib/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));
jest.mock("../src/lib/runtime", () => ({
  auth: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: mockCurrent },
        error: null,
      })),
      onAuthStateChange: jest.fn((listener) => {
        mockListener = listener;
        return {
          data: { listener: null, subscription: { unsubscribe: jest.fn() } },
        };
      }),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
  api: jest.fn(async () =>
    mockCurrent.user.id === "first"
      ? { user_id: "first", display_name: "First" }
      : new Promise((resolve) => {
          mockResolve = resolve;
        }),
  ),
  client: { clearPending: jest.fn() },
  onApiAuthError: jest.fn(() => () => {}),
}));
function Consumer() {
  const state = useSession();
  return <Text>{state.user?.user_id ?? "no-profile"}</Text>;
}
test("switching accounts clears the previous profile before the new profile request resolves", async () => {
  render(
    <SessionProvider>
      <Consumer />
    </SessionProvider>,
  );
  await screen.findByText("first");
  act(() => {
    mockCurrent = { user: { id: "second" } };
    mockListener("SIGNED_IN", mockCurrent);
  });
  expect(screen.queryByText("first")).toBeNull();
  expect(screen.getByText("no-profile")).toBeTruthy();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockResolve({ user_id: "second", display_name: "Second" });
  });
  await screen.findByText("second");
});
