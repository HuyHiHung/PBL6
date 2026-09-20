import { useEffect } from "react";
const blockers = new Set<() => boolean>();
export function canNavigate() {
  return (
    ![...blockers].some((fn) => fn()) ||
    window.confirm("Bạn có thay đổi chưa lưu. Rời trang và bỏ thay đổi?")
  );
}
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const blocked = () => true;
    blockers.add(blocked);
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      blockers.delete(blocked);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty]);
}
