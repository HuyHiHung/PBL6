import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { api, ApiError, type Row } from "./api";

type ProfileState = {
  userId: string | null;
  data: Row | null;
  loading: boolean;
  error: string;
};

export function useProfile(session: Session | null | undefined) {
  const userId = session?.user.id ?? null;
  const [state, setState] = useState<ProfileState>({
    userId: null,
    data: null,
    loading: true,
    error: "",
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    // Revalidate refreshed tokens without unmounting the same user's drafts.
    setState((old) => ({
      userId,
      data: old.userId === userId ? old.data : null,
      loading: !!userId,
      error: "",
    }));
    if (userId) {
      api<Row>("identity", "/v1/me")
        .then((data) => {
          if (data.user_id !== userId)
            throw new ApiError(401, "SESSION_CHANGED");
          if (alive) setState({ userId, data, loading: false, error: "" });
        })
        .catch((error: Error) => {
          if (!alive) return;
          const rejected =
            error instanceof ApiError && [401, 403].includes(error.status);
          setState((old) => ({
            userId,
            data: rejected || old.userId !== userId ? null : old.data,
            loading: false,
            error: error.message,
          }));
        });
    }
    return () => {
      alive = false;
    };
  }, [userId, session?.access_token, tick]);

  // Hide the previous account immediately, before the effect starts its fetch.
  const current = state.userId === userId && !!userId;
  return {
    data: current ? state.data : null,
    loading: current ? state.loading : !!userId,
    error: current ? state.error : "",
    reload: () => setTick((value) => value + 1),
  };
}
