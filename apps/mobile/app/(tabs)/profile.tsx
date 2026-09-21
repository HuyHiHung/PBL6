import { RequireUser } from "../../src/components/ui";
import { ProfileScreen } from "../../src/features/profile";
export default function Route() {
  return (
    <RequireUser allowIncomplete>
      <ProfileScreen />
    </RequireUser>
  );
}
