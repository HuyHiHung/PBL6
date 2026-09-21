import { useLocalSearchParams } from "expo-router";
import { RequireUser } from "../../src/components/ui";
import { NoteScreen } from "../../src/features/expansion";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireUser>
      <NoteScreen key={id} id={id} />
    </RequireUser>
  );
}
