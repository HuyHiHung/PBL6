import { RequireUser } from "../src/components/ui";
import { MistakesScreen } from "../src/features/review";
export default function Route() {
  return (
    <RequireUser>
      <MistakesScreen />
    </RequireUser>
  );
}
