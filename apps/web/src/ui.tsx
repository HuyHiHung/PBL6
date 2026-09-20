import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, LoaderCircle, RefreshCw } from "lucide-react";
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(undefined);
    setError("");
    load()
      .then((v) => {
        if (alive) setData(v);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((v) => v + 1), setData };
}
export function Notice({
  children,
  good = false,
}: {
  children: ReactNode;
  good?: boolean;
}) {
  return children ? (
    <div
      role={good ? "status" : "alert"}
      className={`notice ${good ? "good" : ""}`}
    >
      {children}
    </div>
  ) : null;
}
export function Load({
  state,
  children,
}: {
  state: { loading: boolean; error: string; reload: () => void };
  children: ReactNode;
}) {
  if (state.loading)
    return (
      <div className="empty" role="status">
        <LoaderCircle className="spin" /> Đang tải…
      </div>
    );
  if (state.error)
    return (
      <div className="empty">
        <Notice>{state.error}</Notice>
        <button className="secondary" onClick={state.reload}>
          <RefreshCw size={16} />
          Thử lại
        </button>
      </div>
    );
  return children;
}
export function Title({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <div className="eyebrow">{eyebrow ?? "KHÔNG GIAN HỌC TẬP"}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Link({
  to,
  children,
  className = "button",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={"#" + to}>
      {children}
      <ArrowRight size={17} />
    </a>
  );
}
export function Pager({
  page,
  setPage,
  more,
}: {
  page: number;
  setPage: (p: number) => void;
  more: boolean;
}) {
  return (
    <div className="pager">
      <button
        className="secondary"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        Trước
      </button>
      <span>Trang {page}</span>
      <button
        className="secondary"
        disabled={!more}
        onClick={() => setPage(page + 1)}
      >
        Tiếp
      </button>
    </div>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  return {
    busy,
    error,
    success,
    setError,
    run: async (fn: () => Promise<void>, message = "") => {
      if (busy) return;
      setBusy(true);
      setError("");
      setSuccess("");
      try {
        await fn();
        setSuccess(message);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      } finally {
        setBusy(false);
      }
    },
  };
}
