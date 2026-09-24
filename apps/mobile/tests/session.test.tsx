import { render, screen, act, fireEvent } from "@testing-library/react-native";
import { AppState, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { SessionProvider, useSession } from "../src/lib/session";
import { RequireUser } from "../src/components/ui";
let mockCurrent: { user: { id: string } } | null;
let mockListener: (event: string, session: typeof mockCurrent) => void;
let mockAuthError: (error: unknown) => void;
let foreground: (state: string) => void;
const mockApi = jest.fn();
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
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
  api: (...args: unknown[]) => mockApi(...args),
  client: { clearPending: jest.fn() },
  onApiAuthError: jest.fn((listener) => {
    mockAuthError = listener;
    return jest.fn();
  }),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: jest.fn(),
  useNavigation: jest.fn(),
}));
function Draft() {
  const [value, setValue] = useState("");
  return (
    <TextInput
      accessibilityLabel="Draft"
      value={value}
      onChangeText={setValue}
    />
  );
}
function Consumer() {
  const state = useSession();
  return (
    <>
      <Text>{state.user?.user_id ?? "no-profile"}</Text>
      <View
        key={state.user?.user_id ?? (state.authenticated ? "session" : "guest")}
      >
        <RequireUser>
          <Draft />
        </RequireUser>
      </View>
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockCurrent = { user: { id: "first" } };
  mockApi.mockReset().mockImplementation(async () => ({
    user_id: mockCurrent!.user.id,
    display_name: "Learner",
  }));
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      foreground = listener as typeof foreground;
      return { remove: jest.fn() };
    });
});
afterEach(() => jest.restoreAllMocks());
async function openDraft() {
  render(
    <SessionProvider>
      <Consumer />
    </SessionProvider>,
  );
  await screen.findByText("first");
  fireEvent.changeText(screen.getByLabelText("Draft"), "Unsaved work");
}
test.each([
  new Error("Offline"),
  Object.assign(new Error("Service unavailable"), { status: 503 }),
])(
  "foreground failure preserves profile, navigation key and draft; retry recovers: %s",
  async (error) => {
    await openDraft();
    mockApi.mockRejectedValueOnce(error);
    await act(async () => foreground("active"));
    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.getByDisplayValue("Unsaved work")).toBeTruthy();
    expect(screen.getByText(error.message)).toBeTruthy();
    await act(async () =>
      fireEvent.press(screen.getByText("Kiểm tra lại phiên")),
    );
    expect(screen.queryByText(error.message)).toBeNull();
    expect(screen.getByDisplayValue("Unsaved work")).toBeTruthy();
  },
);
test("switching accounts clears the previous profile and draft before the new request resolves", async () => {
  await openDraft();
  let resolve!: (value: unknown) => void;
  mockApi.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await act(async () => {
    mockCurrent = { user: { id: "second" } };
    mockListener("SIGNED_IN", mockCurrent);
    await new Promise((r) => setTimeout(r, 10));
  });
  expect(screen.getByText("no-profile")).toBeTruthy();
  expect(screen.queryByDisplayValue("Unsaved work")).toBeNull();
  await act(async () => resolve({ user_id: "second", display_name: "Second" }));
  expect(screen.getByText("second")).toBeTruthy();
});
test("revocation invalidates an in-flight successful profile response", async () => {
  await openDraft();
  let resolve!: (value: unknown) => void;
  mockApi.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await act(async () => foreground("active"));
  act(() =>
    mockAuthError({ status: 401, code: "SESSION_REVOKED", message: "Revoked" }),
  );
  await act(async () => resolve({ user_id: "first", display_name: "Late" }));
  expect(screen.getByText("no-profile")).toBeTruthy();
  expect(screen.queryByDisplayValue("Unsaved work")).toBeNull();
});
test("a rejected session clears the draft while a permission error does not", async () => {
  await openDraft();
  act(() =>
    mockAuthError({ status: 403, code: "FORBIDDEN", message: "Permission" }),
  );
  expect(screen.getByDisplayValue("Unsaved work")).toBeTruthy();
  mockApi.mockRejectedValueOnce({
    status: 403,
    code: "ACCOUNT_LOCKED",
    message: "Locked",
  });
  await act(async () => foreground("active"));
  expect(screen.getByText("no-profile")).toBeTruthy();
  expect(screen.queryByDisplayValue("Unsaved work")).toBeNull();
});

test("an old account response cannot restore its profile after switching accounts", async () => {
  await openDraft();
  let oldResponse!: (value: unknown) => void;
  let newResponse!: (value: unknown) => void;
  mockApi
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          oldResponse = r;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          newResponse = r;
        }),
    );
  await act(async () => foreground("active"));
  await act(async () => {
    mockCurrent = { user: { id: "second" } };
    mockListener("SIGNED_IN", mockCurrent);
    await new Promise((r) => setTimeout(r, 10));
  });
  await act(async () => oldResponse({ user_id: "first", display_name: "Old" }));
  expect(screen.getByText("no-profile")).toBeTruthy();
  await act(async () =>
    newResponse({ user_id: "second", display_name: "New" }),
  );
  expect(screen.getByText("second")).toBeTruthy();
  expect(screen.queryByDisplayValue("Unsaved work")).toBeNull();
});

test("an initial profile failure shows the session gate and retry mounts the private screen", async () => {
  mockApi.mockRejectedValueOnce(new Error("Offline initially"));
  render(
    <SessionProvider>
      <Consumer />
    </SessionProvider>,
  );
  await screen.findByText("Offline initially");
  expect(screen.queryByLabelText("Draft")).toBeNull();
  await act(async () =>
    fireEvent.press(screen.getByText("Kiểm tra lại phiên")),
  );
  expect(screen.getByLabelText("Draft")).toBeTruthy();
});
