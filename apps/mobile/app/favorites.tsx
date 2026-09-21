import { RequireUser } from "../src/components/ui";
import { FavoritesScreen } from "../src/features/expansion";
export default function Route() {
  return (
    <RequireUser>
      <FavoritesScreen />
    </RequireUser>
  );
}
