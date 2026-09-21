import { useLocalSearchParams } from "expo-router";
import { LessonScreen } from "../../src/features/learning";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonScreen key={id} id={id} />;
}
