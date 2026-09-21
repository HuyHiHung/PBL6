import { useLocalSearchParams } from "expo-router";
import { RequireUser } from "../../src/components/ui";
import { DictationAttemptScreen } from "../../src/features/expansion";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireUser>
      <DictationAttemptScreen key={id} id={id} />
    </RequireUser>
  );
}
