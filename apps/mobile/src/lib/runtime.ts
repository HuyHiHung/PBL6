import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { createApiClient, type ApiError } from "@sprout/api-client";
import { secureStorage } from "./storage";
export const settings = {
  supabase: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  identity: process.env.EXPO_PUBLIC_IDENTITY_URL ?? "",
  content: process.env.EXPO_PUBLIC_CONTENT_URL ?? "",
  learning: process.env.EXPO_PUBLIC_LEARNING_URL ?? "",
  google: process.env.EXPO_PUBLIC_GOOGLE_ENABLED === "true",
  recoveryUrl: process.env.EXPO_PUBLIC_WEB_RECOVERY_URL ?? "",
};
export const configurationError =
  !settings.key ||
  [
    settings.supabase,
    settings.identity,
    settings.content,
    settings.learning,
  ].some((url) => !/^https?:\/\//.test(url))
    ? "Chưa có cấu hình kết nối. Chạy npm run mobile:configure ở thư mục gốc rồi khởi động lại Expo."
    : null;
export const auth = createClient(
  settings.supabase || "http://127.0.0.1:55321",
  settings.key || "not-configured",
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      detectSessionInUrl: false,
      autoRefreshToken: true,
      storage: secureStorage,
      lock: processLock,
    },
  },
);
const authListeners = new Set<(error: ApiError) => void>();
export const onApiAuthError = (fn: (error: ApiError) => void) => {
  authListeners.add(fn);
  return () => {
    authListeners.delete(fn);
  };
};
export const client = createApiClient({
  bases: settings,
  storage: secureStorage,
  uuid: Crypto.randomUUID,
  session: async () => {
    const { data, error } = await auth.auth.getSession();
    if (error) throw error;
    return data.session
      ? { userId: data.session.user.id, token: data.session.access_token }
      : null;
  },
  onAuthError: (error) => authListeners.forEach((fn) => fn(error)),
});
export const api = client.request;
export const mutate = client.mutate;
export const callbackUrl = "sprout://auth/callback";
