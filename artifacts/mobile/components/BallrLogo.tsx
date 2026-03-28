import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

type BallrLogoProps = {
  size?: "sm" | "md" | "lg";
};

export default function BallrLogo({ size = "md" }: BallrLogoProps) {
  const fontSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;
  const dotSize = size === "sm" ? 6 : size === "lg" ? 10 : 8;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
      <Text style={[styles.b, { fontSize }]}>B</Text>
      <Text style={[styles.allr, { fontSize }]}>ALLR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  dot: {
    backgroundColor: Colors.accent,
    marginRight: 3,
  },
  b: {
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    letterSpacing: 2,
  },
  allr: {
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 2,
  },
});
