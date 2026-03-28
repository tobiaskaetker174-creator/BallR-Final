import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-games">
        <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
        <Label>My Games</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Rankings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crews">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Crews</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      {children}
    </View>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.separator,
          elevation: 0,
          height: isWeb ? 84 : 62,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size, focused }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={size} />
            ) : (
              <TabIcon focused={focused}>
                <Feather name="search" size={size} color={color} />
              </TabIcon>
            ),
        }}
      />
      <Tabs.Screen
        name="my-games"
        options={{
          title: "My Games",
          tabBarIcon: ({ color, size, focused }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={size} />
            ) : (
              <TabIcon focused={focused}>
                <Feather name="calendar" size={size} color={color} />
              </TabIcon>
            ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Rankings",
          tabBarIcon: ({ color, size, focused }) =>
            isIOS ? (
              <SymbolView name="trophy" tintColor={color} size={size} />
            ) : (
              <TabIcon focused={focused}>
                <Ionicons name="trophy-outline" size={size} color={color} />
              </TabIcon>
            ),
        }}
      />
      <Tabs.Screen
        name="crews"
        options={{
          title: "Crews",
          tabBarIcon: ({ color, size, focused }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={size} />
            ) : (
              <TabIcon focused={focused}>
                <Ionicons name={focused ? "people" : "people-outline"} size={size} color={color} />
              </TabIcon>
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={size} />
            ) : (
              <TabIcon focused={focused}>
                <Feather name="user" size={size} color={color} />
              </TabIcon>
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  tabIconWrapActive: {
    backgroundColor: `${Colors.primary}55`,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
});
