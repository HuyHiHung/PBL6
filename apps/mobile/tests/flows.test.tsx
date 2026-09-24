import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import { NoteScreen } from "../src/features/expansion";
import { AttemptScreen } from "../src/features/attempt";
import { ReviewSessionScreen } from "../src/features/review";
import { RequireUser } from "../src/components/ui";
const mockApi = jest.fn(),
  mockMutate = jest.fn();
let mockSession = {
  user: { user_id: "learner", display_name: "Learner" },
  busy: false,
  authenticated: true,
  error: "",
};
jest.mock("../src/lib/runtime", () => ({
  api: (...args: unknown[]) => mockApi(...args),
  mutate: (...args: unknown[]) => mockMutate(...args),
}));
jest.mock("../src/lib/session", () => ({ useSession: () => mockSession }));
jest.mock("../src/components/audio", () => ({ Audio: () => null }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => () => void) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: jest.fn(),
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockSession = {
    user: { user_id: "learner", display_name: "Learner" },
    busy: false,
    authenticated: true,
    error: "",
  };
});
test("cancelled review sessions with pending items never offer ratings", async () => {
  mockApi.mockResolvedValue({
    status: "cancelled",
    items: [
      {
        id: "i",
        status: "pending",
        card_snapshot: { word: "hello", meaning: "xin chào" },
      },
    ],
  });
  render(<ReviewSessionScreen id="s" />);
  await screen.findByText("Phiên đã hủy");
  expect(screen.queryByText("Lật thẻ")).toBeNull();
  expect(screen.queryByText("Đã nhớ")).toBeNull();
  expect(screen.getByText("Về ôn tập")).toBeTruthy();
});

test("a rating rejected after remote cancellation reloads the terminal session", async () => {
  const item = {
    id: "i",
    status: "pending",
    card_snapshot: { word: "hello", meaning: "xin chào" },
  };
  mockApi
    .mockResolvedValueOnce({ status: "in_progress", items: [item] })
    .mockResolvedValue({ status: "cancelled", items: [item] });
  mockMutate.mockRejectedValueOnce(new Error("ITEM_ALREADY_FINISHED"));
  render(<ReviewSessionScreen id="s" />);
  fireEvent.press(await screen.findByText("Lật thẻ"));
  fireEvent.press(screen.getByText("Đã nhớ"));
  await screen.findByText("Phiên đã hủy");
  expect(screen.queryByText("Đã nhớ")).toBeNull();
});

test("note conflict keeps local text and blocks overwrite until the user reconciles", async () => {
  let note = {
    id: "n",
    lesson_id: "l",
    content: "Original",
    title_snapshot: "Lesson",
    row_version: 1,
  };
  mockApi.mockImplementation(async (_service, _path, method) => {
    if (method === "PUT") {
      note = { ...note, content: "Changed on web", row_version: 2 };
      throw new Error("VERSION_CONFLICT");
    }
    return {
      note,
      available: true,
      current_title: "Lesson",
      revision_changed: false,
    };
  });
  render(<NoteScreen id="l" />);
  await screen.findByDisplayValue("Original");
  fireEvent.changeText(
    screen.getByLabelText("Ghi chú riêng của bạn"),
    "My unsaved draft",
  );
  fireEvent.press(screen.getByText("Lưu ghi chú"));
  await screen.findByText("Changed on web");
  expect(screen.getByDisplayValue("My unsaved draft")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Lưu ghi chú" })).toBeDisabled();
  expect(mockApi).toHaveBeenCalledWith(
    "learning",
    "/v1/lessons/l/note",
    "PUT",
    { content: "My unsaved draft", expectedVersion: 1 },
  );
});
test("topic test saves answers without revealing keys, then renders only server results after submission", async () => {
  let attempt = {
    id: "a",
    title: "Topic test",
    kind: "topic_test",
    status: "in_progress",
    row_version: 1,
    score: null,
    correct_count: null,
    total_count: 1,
    passed: null,
    cancel_reason: null,
    items: [
      {
        id: "i",
        position: 1,
        lesson_id: "l",
        type: "fill_blank",
        prompt: "Say hello",
        passage: null,
        audio_url: null,
        options: [],
        answer: null as { text: string } | null,
        answer_version: 0,
        checked: false,
      },
    ],
  };
  mockApi.mockImplementation(async (_service, _path, method, body) => {
    if (method === "PUT") {
      attempt = {
        ...attempt,
        row_version: 2,
        items: [
          { ...attempt.items[0], answer: body.answer, answer_version: 1 },
        ],
      };
      return { answer_version: 1, attempt_version: 2 };
    }
    return attempt;
  });
  mockMutate.mockResolvedValue({
    ...attempt,
    status: "submitted",
    row_version: 3,
    score: 100,
    correct_count: 1,
    passed: true,
    items: [
      {
        ...attempt.items[0],
        answer: { text: "hello" },
        answer_version: 1,
        is_correct: true,
        answer_key: { accepted_answers: ["hello"] },
        explanation: "A greeting",
      },
    ],
  });
  jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === "Nộp bài")?.onPress?.();
  });
  render(<AttemptScreen id="a" />);
  await screen.findByText("Say hello");
  expect(screen.queryByText("A greeting")).toBeNull();
  fireEvent.changeText(screen.getByLabelText("Câu trả lời"), "hello");
  expect(screen.getByRole("button", { name: "Nộp bài" })).toBeDisabled();
  fireEvent.press(screen.getByText("Lưu câu trả lời"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Nộp bài" })).toBeEnabled(),
  );
  expect(mockApi).toHaveBeenCalledWith(
    "learning",
    "/v1/items/i/answer",
    "PUT",
    { answer: { text: "hello" }, expectedVersion: 0, attemptVersion: 1 },
  );
  expect(screen.queryByText("A greeting")).toBeNull();
  fireEvent.press(screen.getByText("Nộp bài"));
  await screen.findByText("A greeting");
  expect(mockMutate).toHaveBeenCalledWith("learning", "/v1/attempts/a/submit", {
    expectedVersion: 2,
    confirmBlank: false,
  });
});
test("private feature does not mount for guests or rejected sessions", async () => {
  mockSession = {
    user: null as never,
    busy: false,
    authenticated: false,
    error: "",
  };
  render(
    <RequireUser>
      <NoteScreen id="private" />
    </RequireUser>,
  );
  expect(screen.getByText("Đăng nhập / Đăng ký")).toBeTruthy();
  expect(mockApi).not.toHaveBeenCalled();
});
