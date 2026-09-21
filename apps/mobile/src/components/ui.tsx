import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { usePreventRemove, useNavigation } from "expo-router/react-navigation";
import { useSession } from "../lib/session";
export const colors = {
  ink: "#163D31",
  green: "#28624A",
  muted: "#68776B",
  background: "#F6F5EC",
  card: "#FFFFFF",
  line: "#E2E6DB",
  pale: "#E8EEDC",
  red: "#A8392E",
  gold: "#E5BA70",
};
export const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 22,
    gap: 18,
    paddingBottom: 42,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 29,
    lineHeight: 36,
    color: colors.ink,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: { fontSize: 15, lineHeight: 23, color: colors.muted },
  heading: {
    fontSize: 19,
    lineHeight: 27,
    color: colors.ink,
    fontWeight: "600",
  },
  text: { fontSize: 16, lineHeight: 25, color: colors.ink },
  small: { fontSize: 13, lineHeight: 20, color: colors.muted },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.green,
  },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secondary: { backgroundColor: colors.pale },
  input: {
    minHeight: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD6C8",
    borderRadius: 13,
    padding: 14,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: "top",
  },
  notice: {
    backgroundColor: "#FFF2E5",
    borderRadius: 14,
    padding: 14,
    color: "#873C25",
    fontSize: 14,
    lineHeight: 22,
  },
  hero: { backgroundColor: colors.ink, padding: 24, borderRadius: 26, gap: 16 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 5 },
});
export function Screen({
  children,
  refreshing = false,
  onRefresh,
}: PropsWithChildren<{ refreshing?: boolean; onRefresh?: () => void }>) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.screen}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.green}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Title({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export const Card = ({ children }: PropsWithChildren) => (
  <View style={styles.card}>{children}</View>
);
export const P = ({ children }: PropsWithChildren) => (
  <Text style={styles.text}>{children}</Text>
);
export const H = ({ children }: PropsWithChildren) => (
  <Text accessibilityRole="header" style={styles.heading}>
    {children}
  </Text>
);
export function Notice({ children }: { children?: ReactNode }) {
  return children ? (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.notice}
    >
      {children}
    </Text>
  ) : null;
}
export function Button({
  title,
  onPress,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.small}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A958B"
        style={[styles.input, props.multiline && { minHeight: 140 }]}
        {...props}
      />
    </View>
  );
}
export const LinkButton = ({ title, to }: { title: string; to: string }) => (
  <Button title={title} secondary onPress={() => router.push(to as never)} />
);
export function useAction() {
  const lock = useRef(false),
    alive = useRef(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function run(fn: () => Promise<unknown>, message = "") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      if (alive.current) setSuccess(message);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return {
    busy,
    error,
    success,
    run,
    clear: () => {
      setError("");
      setSuccess("");
    },
  };
}
export function ActionNotice({
  action,
}: {
  action: ReturnType<typeof useAction>;
}) {
  return (
    <>
      <Notice>{action.error}</Notice>
      {action.success && (
        <Text accessibilityLiveRegion="polite" style={styles.small}>
          {action.success}
        </Text>
      )}
    </>
  );
}
export function useResource<T>(load: () => Promise<T>, key = "") {
  const fn = useRef(load);
  fn.current = load;
  const sequence = useRef(0);
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  const reload = useCallback(async () => {
    const n = ++sequence.current;
    setBusy(true);
    setError("");
    try {
      const value = await fn.current();
      if (n === sequence.current) setData(value);
      return value;
    } catch (e) {
      if (n === sequence.current) setError((e as Error).message);
      return null;
    } finally {
      if (n === sequence.current) setBusy(false);
    }
  }, [key]);
  useFocusEffect(
    useCallback(() => {
      setData(null);
      void reload();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void reload();
      });
      return () => {
        sequence.current++;
        subscription.remove();
      };
    }, [reload]),
  );
  return { data, error, busy, reload, setData };
}
export function Resource({
  state,
  children,
}: PropsWithChildren<{
  state: {
    data: unknown;
    error: string;
    busy: boolean;
    reload: () => Promise<unknown>;
  };
}>) {
  return (
    <>
      {state.busy && !state.data && (
        <ActivityIndicator size="large" color={colors.green} />
      )}
      <Notice>{state.error}</Notice>
      {state.error && (
        <Button title="Tải lại" secondary onPress={() => void state.reload()} />
      )}
      <>{children}</>
    </>
  );
}
export function RequireUser({
  children,
  allowIncomplete = false,
}: PropsWithChildren<{ allowIncomplete?: boolean }>) {
  const session = useSession();
  if (session.busy)
    return (
      <Screen>
        <ActivityIndicator color={colors.green} />
      </Screen>
    );
  if (!session.user)
    return (
      <Screen>
        <Title
          title="Hành trình của riêng bạn"
          subtitle="Đăng nhập để lưu bài học và tiếp tục trên mọi thiết bị."
        />
        <Notice>{session.error}</Notice>
        <LinkButton title="Đăng nhập / Đăng ký" to="/auth/login" />
        {session.authenticated && (
          <Button
            title="Kiểm tra lại phiên"
            onPress={() => void session.reload()}
          />
        )}
      </Screen>
    );
  if (!allowIncomplete && !session.user.display_name)
    return (
      <Screen>
        <Title title="Hoàn tất hồ sơ" />
        <LinkButton title="Nhập tên hiển thị" to="/(tabs)/profile" />
      </Screen>
    );
  return <>{children}</>;
}
export function Pager({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Button
        title="Trước"
        secondary
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Text style={styles.small}>Trang {page}</Text>
      <Button
        title="Tiếp"
        secondary
        disabled={count < 20}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}
export function confirm(
  title: string,
  message: string,
  action = "Xác nhận",
): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Quay lại", style: "cancel", onPress: () => resolve(false) },
        { text: action, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
export function useUnsaved(dirty: boolean) {
  const navigation = useNavigation();
  usePreventRemove(dirty, ({ data }) => {
    Alert.alert(
      "Bản nhập chưa lưu",
      "Rời màn hình sẽ bỏ các thay đổi chưa lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        {
          text: "Bỏ thay đổi",
          style: "destructive",
          onPress: () => navigationDispatch(data.action),
        },
      ],
    );
  });
  // Filled by navigation hook rather than global router, preserving the original back action.
  function navigationDispatch(
    action: Parameters<typeof navigation.dispatch>[0],
  ) {
    navigation.dispatch(action);
  }
}
export function status(value: string) {
  return (
    (
      {
        in_progress: "Đang học",
        submitted: "Đã nộp",
        cancelled: "Đã hủy",
        completed: "Hoàn thành",
        not_started: "Chưa học",
      } as Record<string, string>
    )[value] ?? value
  );
}
export function date(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "";
}
