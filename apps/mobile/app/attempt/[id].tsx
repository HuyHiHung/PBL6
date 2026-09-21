import { useLocalSearchParams } from "expo-router";
import { RequireUser } from "../../src/components/ui";
import { AttemptScreen } from "../../src/features/attempt";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireUser>
      <AttemptScreen key={id} id={id} />
    </RequireUser>
  );
}
