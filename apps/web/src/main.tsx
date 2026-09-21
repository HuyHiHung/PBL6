import {
  useEffect,
  useState,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  LayoutDashboard,
  BookOpen,
  Layers,
  Bookmark,
  History,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  Headphones,
  StickyNote,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { auth, api, go, ApiError, type Row } from "./api";
import { AuthPage, Profile } from "./auth";
import { Notice, Load } from "./ui";
import { useProfile } from "./session";
import {
  Home,
  Catalog,
  Lesson,
  Attempt,
  HistoryPage,
  ReviewPage,
  Cards,
  CardSession,
  Favorites,
  Progress,
} from "./learning";
import "./style.css";
import {
  SearchBox,
  SearchPage,
  NotesPage,
  DictationPage,
  DictationAttempt,
} from "./expansion";
import { canNavigate } from "./navigation";
const Admin = lazy(() => import("./admin"));
export const UserContext = createContext<Row | null>(null);
export const useUser = () => useContext(UserContext);
function App() {
  const [route, setRoute] = useState(
      location.hash.startsWith("#/") ? location.hash.slice(1) : "/",
    ),
    [session, setSession] = useState<Session | null>(),
    [menu, setMenu] = useState(false),
    [authError, setAuthError] = useState("");
  useEffect(() => {
    let approvedClick = false;
    const onLink = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href^="#/"]')
          : null;
      if (!link || link.getAttribute("href") === location.hash) return;
      if (!canNavigate()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      approvedClick = true;
    };
    let previous = location.hash.startsWith("#/")
      ? location.hash.slice(1)
      : "/";
    const listener = () => {
      if (!approvedClick && !canNavigate()) {
        history.replaceState(null, "", "#" + previous);
        return;
      }
      approvedClick = false;
      previous = location.hash.startsWith("#/") ? location.hash.slice(1) : "/";
      setRoute(location.hash.startsWith("#/") ? location.hash.slice(1) : "/");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", listener);
    addEventListener("click", onLink, true);
    auth.auth.getSession().then(({ data, error }) => {
      setSession(data.session);
      if (error) setAuthError(error.message);
    });
    const {
      data: { subscription },
    } = auth.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") go("/reset");
    });
    const callbackError =
      new URLSearchParams(location.search).get("error_description") ??
      new URLSearchParams(location.hash.slice(1)).get("error_description");
    if (callbackError) {
      setAuthError("Đăng nhập chưa hoàn tất. Vui lòng thử lại.");
      go("/login");
    }
    return () => {
      removeEventListener("hashchange", listener);
      removeEventListener("click", onLink, true);
      subscription.unsubscribe();
    };
  }, []);
  const profile = useProfile(session);
  const me = profile.data ?? null;
  const part = route.split("?")[0].split("/").filter(Boolean);
  const screen = part[0] ?? "home";
  const publicScreens = [
    "home",
    "catalog",
    "search",
    "lesson",
    "login",
    "signup",
    "forgot",
    "reset",
  ];
  const protectedScreen = !publicScreens.includes(screen);
  async function logout() {
    if (!canNavigate()) return;
    try {
      await api("identity", "/v1/logout", "POST");
    } catch (e) {
      if (!(e instanceof ApiError) || ![401, 403].includes(e.status)) {
        setAuthError((e as Error).message);
        return;
      }
    }
    await auth.auth.signOut({ scope: "local" });
    setAuthError("");
    go("/login");
  }
  const nav = [
    ["/", "Học hôm nay", LayoutDashboard],
    ["/catalog", "Lộ trình học", BookOpen],
    ["/dictation", "Nghe & chép lại", Headphones],
    ["/notes", "Ghi chú", StickyNote],
    ["/cards", "Thẻ từ vựng", Layers],
    ["/mistakes", "Ôn câu sai", ChartNoAxesCombined],
    ["/favorites", "Bài yêu thích", Bookmark],
    ["/history", "Lịch sử học", History],
  ] as const;
  if (["login", "signup", "forgot", "reset"].includes(screen))
    return (
      <>
        <Notice>{authError}</Notice>
        <AuthPage key={screen} mode={screen} />
      </>
    );
  if (session === undefined)
    return <div className="empty">Đang mở không gian học tập…</div>;
  let page;
  if (protectedScreen && !session)
    page = (
      <div className="card empty">
        <h1>Tiếp tục hành trình của bạn</h1>
        <p>Đăng nhập để lưu tiến độ, làm bài và ôn tập.</p>
        <a href="#/login" className="button">
          Đăng nhập
        </a>
      </div>
    );
  else if (session && !me && (profile.loading || profile.error))
    page = (
      <>
        <Load state={profile}>
          <></>
        </Load>
        {profile.error && (
          <button className="secondary" onClick={logout}>
            Đăng nhập bằng tài khoản khác
          </button>
        )}
      </>
    );
  else if (me && !me.display_name)
    page = <Profile me={me} reload={profile.reload} />;
  else
    switch (screen) {
      case "home":
        page = <Home />;
        break;
      case "catalog":
        page = <Catalog />;
        break;
      case "search":
        page = <SearchPage query={route.split("?")[1] ?? ""} />;
        break;
      case "notes":
        page = <NotesPage />;
        break;
      case "dictation":
        page = <DictationPage />;
        break;
      case "dictation-attempt":
        page = <DictationAttempt key={part[1]} id={part[1]} />;
        break;
      case "lesson":
        page = <Lesson key={part[1]} id={part[1]} />;
        break;
      case "attempt":
        page = <Attempt key={part[1]} id={part[1]} />;
        break;
      case "cards":
        page = <Cards />;
        break;
      case "card-session":
        page = <CardSession key={part[1]} id={part[1]} />;
        break;
      case "mistakes":
        page = <ReviewPage />;
        break;
      case "favorites":
        page = <Favorites />;
        break;
      case "history":
        page = <HistoryPage />;
        break;
      case "progress":
        page = <Progress />;
        break;
      case "profile":
        page = me && <Profile me={me} reload={profile.reload} />;
        break;
      case "admin":
        page =
          me?.role === "admin" || me?.role === "editor" ? (
            <Suspense fallback={<p>Đang mở quản trị…</p>}>
              <Admin me={me} />
            </Suspense>
          ) : (
            <Notice>Bạn không có quyền truy cập khu quản trị.</Notice>
          );
        break;
      default:
        page = (
          <div className="empty">
            <h1>Không tìm thấy trang</h1>
            <a href="#/">Về trang chủ</a>
          </div>
        );
    }
  return (
    <UserContext.Provider key={session?.user.id ?? "guest"} value={me}>
      <div className="app-shell">
        <button
          className="mobile-toggle secondary"
          aria-label={menu ? "Đóng menu" : "Mở menu"}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        {menu && (
          <button
            className="scrim"
            aria-label="Đóng menu"
            onClick={() => setMenu(false)}
          />
        )}
        <aside className={"sidebar " + (menu ? "open" : "")}>
          <a href="#/" className="brand">
            <Sprout size={32} />
            sprout<span>ENGLISH</span>
          </a>
          <div className="nav-caption">HỌC THEO CÁCH CỦA BẠN</div>
          <nav aria-label="Điều hướng chính">
            {nav.map(([path, label, Icon]) => (
              <a
                key={path}
                href={"#" + path}
                className={route === path ? "active" : ""}
                aria-current={route === path ? "page" : undefined}
              >
                <Icon size={20} />
                {label}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Sprout />
              <b>Chậm một chút cũng được.</b>
              <p>Điều quan trọng là bạn vẫn đang tiến về phía trước.</p>
            </div>
            {me && (me.role === "admin" || me.role === "editor") && (
              <a href="#/admin" className="admin-link">
                <Settings size={18} />
                Quản trị nội dung
                <ArrowUpRight size={16} />
              </a>
            )}
            <div className="account">
              {me ? (
                <>
                  <a href="#/profile" className="avatar">
                    {me.display_name?.charAt(0) ?? "S"}
                  </a>
                  <a href="#/profile">
                    <b>{me.display_name ?? "Hồ sơ"}</b>
                    <small>
                      {me.role === "learner"
                        ? "Người học"
                        : me.role === "admin"
                          ? "Quản trị viên"
                          : "Biên tập viên"}
                    </small>
                  </a>
                  <button
                    className="icon-button"
                    aria-label="Đăng xuất"
                    onClick={logout}
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <a className="button wide" href="#/login">
                  Đăng nhập
                </a>
              )}
            </div>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <SearchBox />
            <span className="top-pill">
              <span />
              Học một chút, mỗi ngày
            </span>
          </div>
          <Notice>{authError}</Notice>
          {me && profile.error && (
            <div>
              <Notice>{profile.error}</Notice>
              <button className="secondary" onClick={profile.reload}>
                Thử lại hồ sơ
              </button>
            </div>
          )}
          {page}
          <footer>
            SPROUT ENGLISH <span>Những bước nhỏ tạo nên thay đổi lớn.</span>
          </footer>
        </main>
      </div>
    </UserContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
