import { RequireUser } from "../src/components/ui";
import { HistoryScreen } from "../src/features/learning";
export default function Route() {
  return (
    <RequireUser>
      <HistoryScreen />
    </RequireUser>
  );
}
