import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

type BallrLogoProps = {
  size?: "sm" | "md" | "lg";
};

export default function BallrLogo({ size = "md" }: BallrLogoProps) {
  const fontSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;
  const iconSize = size === "sm" ? 16 : size === "lg" ? 28 : 22;
  const cutoutSize = iconSize * 0.55;
  const cutoutOffset = iconSize * 0.05;

  return (
    <View style={styles.row}>
      {/* Green circle with darker cutout — the BallR icon */}
      <View
        style={[
          styles.iconCircle,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.iconCutout,
            {
              width: cutoutSize,
              height: cutoutSize,
              borderRadius: cutoutSize / 2,
              top: cutoutOffset,
              left: cutoutOffset,
            },
          ]}
        />
      </View>
      <Text style={[styles.ballText, { fontSize }]}>Ball</Text>
      <Text style={[styles.rText, { fontSize }]}>R</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  iconCircle: {
    backgroundColor: Colors.accent,
    marginRight: 6,
    position: "relative",
    overflow: "hidden",
  },
  iconCutout: {
    position: "absolute",
    backgroundColor: "#2D5A27",
  },
  ballText: {
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 1,
  },
  rText: {
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    letterSpacing: 1,
  },
});
