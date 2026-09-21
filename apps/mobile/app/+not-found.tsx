import { Screen, Title, LinkButton } from "../src/components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Title title="Không tìm thấy trang" />
      <LinkButton title="Về Hôm nay" to="/" />
    </Screen>
  );
}
