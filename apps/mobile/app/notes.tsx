import { RequireUser } from "../src/components/ui";
import { NotesScreen } from "../src/features/expansion";
export default function Route() {
  return (
    <RequireUser>
      <NotesScreen />
    </RequireUser>
  );
}
