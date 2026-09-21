import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../src/lib/session";
import { configurationError } from "../src/lib/runtime";
import { colors, Screen, Title, Notice } from "../src/components/ui";
function Navigation() {
  const { user, authenticated } = useSession();
  return (
    <Stack
      key={user?.user_id ?? (authenticated ? "session" : "guest")}
      screenOptions={{
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
        title: "sprout",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {configurationError ? (
        <Screen>
          <Title title="Sprout Mobile" />
          <Notice>{configurationError}</Notice>
        </Screen>
      ) : (
        <SessionProvider>
          <Navigation />
        </SessionProvider>
      )}
    </SafeAreaProvider>
  );
}
