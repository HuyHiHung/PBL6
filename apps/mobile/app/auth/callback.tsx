import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { handleCallback } from "../../src/lib/callback";
import { callbackUrl } from "../../src/lib/runtime";
import { useSession } from "../../src/lib/session";
import { Screen, Title, Notice, LinkButton } from "../../src/components/ui";
export default function Callback() {
  const params = useLocalSearchParams<{
      code?: string;
      mode?: string;
      error?: string;
    }>(),
    [error, setError] = useState("");
  const session = useSession();
  useEffect(() => {
    let live = true;
    const query = new URLSearchParams();
    for (const key of ["code", "mode", "error"] as const)
      if (params[key]) query.set(key, params[key]!);
    handleCallback(callbackUrl + "?" + query)
      .then(async (recovery) => {
        if (!live) return;
        await session.setRecovery(recovery);
        await session.reload();
        router.replace(recovery ? "/auth/reset" : "/");
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [params.code, params.error]);
  return (
    <Screen>
      <Title title="Đang hoàn tất xác thực" />
      <Notice>{error}</Notice>
      {error && <LinkButton title="Trở về đăng nhập" to="/auth/login" />}
    </Screen>
  );
}
