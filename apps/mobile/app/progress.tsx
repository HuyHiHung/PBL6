import { RequireUser } from "../src/components/ui";
import { ProgressScreen } from "../src/features/learning";
export default function Route() {
  return (
    <RequireUser>
      <ProgressScreen />
    </RequireUser>
  );
}
