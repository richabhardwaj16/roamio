import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../../src/theme/palette";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.teal,
        tabBarInactiveTintColor: palette.textDim,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#091525",
          borderTopColor: "rgba(255,255,255,0.06)",
          height: 78,
          paddingTop: 12,
        },
      }}
    >
      {[
        ["home", "home"],
        ["explore", "compass"],
        ["friends", "people"],
        ["blends", "sparkles"],
        ["chat", "chatbubble-ellipses"],
        ["profile", "person-circle"],
      ].map(([name, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? (icon as any) : (`${icon}-outline` as any)}
                size={26}
                color={color}
              />
            ),
          }}
        />
      ))}

      <Tabs.Screen name="arena" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="matches" options={{ href: null }} />
      <Tabs.Screen name="chats/[id]" options={{ href: null }} />
    </Tabs>
  );
}
