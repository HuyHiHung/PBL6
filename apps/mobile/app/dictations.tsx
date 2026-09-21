import { useLocalSearchParams } from "expo-router";
import { RequireUser } from "../src/components/ui";
import { DictationsScreen } from "../src/features/expansion";
export default function Route() {
  const { lesson_id } = useLocalSearchParams<{ lesson_id?: string }>();
  return (
    <RequireUser>
      <DictationsScreen lessonId={lesson_id} />
    </RequireUser>
  );
}
