import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import type { Profile } from "@sprout/api-client";
import { auth, api, client, onApiAuthError } from "./runtime";
import { secureStorage } from "./storage";
type State = {
  user: Profile | null;
  authenticated: boolean;
  busy: boolean;
  error: string;
  recovery: boolean;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
  setRecovery: (value: boolean) => Promise<void>;
};
const Context = createContext<State>(null!);
export const useSession = () => useContext(Context);
export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Profile | null>(null),
    [authenticated, setAuthenticated] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [recovery, recoveryState] = useState(false);
  const generation = useRef(0);
  const accountId = useRef<string | null>(null);
  const setRecovery = useCallback(async (value: boolean) => {
    recoveryState(value);
    if (value) await secureStorage.setItem("recovery", "1");
    else await secureStorage.removeItem("recovery");
  }, []);
  const reload = useCallback(async () => {
    const run = ++generation.current;
    try {
      const { data, error: authError } = await auth.auth.getSession();
      if (authError) throw authError;
      if (run !== generation.current) return;
      setAuthenticated(!!data.session);
      if (!data.session) {
        setUser(null);
        recoveryState(false);
        setError("");
        return;
      }
      const profile = await api<Profile>("identity", "/v1/me");
      if (run === generation.current) {
        setUser(profile);
        setError("");
        recoveryState((await secureStorage.getItem("recovery")) === "1");
      }
    } catch (e) {
      if (run === generation.current) {
        setUser(null);
        setError((e as Error).message);
      }
    } finally {
      if (run === generation.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    const { data: listener } = auth.auth.onAuthStateChange(
      (event, nextSession) => {
        const nextId = nextSession?.user.id ?? null;
        if (nextId !== accountId.current) {
          accountId.current = nextId;
          generation.current++;
          setUser(null);
          setAuthenticated(!!nextSession);
          setBusy(!!nextSession);
        }
        // Run SDK calls after the callback releases the Auth lock.
        setTimeout(() => {
          if (event === "PASSWORD_RECOVERY")
            void setRecovery(true)
              .then(reload)
              .catch((e) => setError((e as Error).message));
          else void reload();
        }, 0);
      },
    );
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        auth.auth.startAutoRefresh();
        void reload();
      } else auth.auth.stopAutoRefresh();
    });
    if (AppState.currentState === "active") auth.auth.startAutoRefresh();
    const stop = onApiAuthError((e) => {
      setUser(null);
      setError(e.message);
    });
    return () => {
      generation.current++;
      listener.subscription.unsubscribe();
      subscription.remove();
      auth.auth.stopAutoRefresh();
      stop();
    };
  }, [reload, setRecovery]);
  async function logout() {
    const { data } = await auth.auth.getSession();
    if (data.session) {
      try {
        await api("identity", "/v1/logout", "POST");
      } catch (e) {
        if (
          !("status" in (e as object)) ||
          ![401, 403].includes((e as { status: number }).status)
        )
          throw e;
      }
      await client.clearPending(data.session.user.id);
    }
    const { error: e } = await auth.auth.signOut({ scope: "local" });
    if (e) throw e;
    await setRecovery(false);
    setUser(null);
    setAuthenticated(false);
    setError("");
  }
  return (
    <Context.Provider
      value={{
        user,
        authenticated,
        busy,
        error,
        recovery,
        reload,
        logout,
        setRecovery,
      }}
    >
      {children}
    </Context.Provider>
  );
}
