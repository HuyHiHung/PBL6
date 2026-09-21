import { RequireUser } from "../../src/components/ui";
import { ReviewHome } from "../../src/features/review";
export default function Route() {
  return (
    <RequireUser>
      <ReviewHome />
    </RequireUser>
  );
}
