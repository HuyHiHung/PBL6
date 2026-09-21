import { useLocalSearchParams } from "expo-router";
import { RequireUser } from "../../src/components/ui";
import { ReviewSessionScreen } from "../../src/features/review";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireUser>
      <ReviewSessionScreen key={id} id={id} />
    </RequireUser>
  );
}
