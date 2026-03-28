import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

interface PlayerAvatarProps {
  name: string;
  size?: number;
  color?: string;
  ringColor?: string;
  showBadgeIcon?: string;
}

const AVATAR_COLORS = [
  Colors.primary,
  Colors.teal,
  Colors.blue,
  Colors.purple,
  Colors.amber,
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PlayerAvatar({ name, size = 36, color, ringColor, showBadgeIcon }: PlayerAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = color ?? getAvatarColor(name);
  const fontSize = size * 0.38;
  const badgeSize = Math.max(16, size * 0.35);

  return (
    <View style={{ position: "relative" }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
          },
          ringColor
            ? { borderWidth: 3, borderColor: ringColor }
            : undefined,
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
      {showBadgeIcon ? (
        <View
          style={[
            styles.badgeIcon,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: -2,
              right: -2,
            },
          ]}
        >
          <Text style={{ fontSize: badgeSize * 0.65, lineHeight: badgeSize * 0.85 }}>
            {showBadgeIcon}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  badgeIcon: {
    position: "absolute",
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
