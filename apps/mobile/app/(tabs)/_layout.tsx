import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/components/ui";
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "sprout · ENGLISH",
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {(
        [
          ["index", "Hôm nay", "◉"],
          ["discover", "Khám phá", "▤"],
          ["review", "Ôn tập", "▱"],
          ["profile", "Cá nhân", "◎"],
        ] as const
      ).map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 25, color }}>{icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
