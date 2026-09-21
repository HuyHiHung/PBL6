import { useLocalSearchParams } from "expo-router";
import { Discover } from "../src/features/learning";
export default function Route() {
  const params = useLocalSearchParams<{
    course_id?: string;
    topic_id?: string;
  }>();
  return <Discover courseId={params.course_id} topicId={params.topic_id} />;
}
