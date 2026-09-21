import { RequireUser } from "../src/components/ui";
import { CardsScreen } from "../src/features/review";
export default function Route() {
  return (
    <RequireUser>
      <CardsScreen />
    </RequireUser>
  );
}
