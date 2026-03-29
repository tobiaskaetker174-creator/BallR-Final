import React from "react";
import { Image, Platform, View, ImageStyle, StyleProp } from "react-native";

/**
 * Cross-platform Image that works on both native and Expo Web.
 * On web, uses CSS backgroundImage because RN Image with { uri } can fail to render.
 * On native, uses standard Image component.
 */
export default function WebImage({
  uri,
  style,
  resizeMode = "cover",
}: {
  uri: string;
  style: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}) {
  if (Platform.OS === "web") {
    const bgSize = resizeMode === "contain" ? "contain" : "cover";
    return (
      <View
        style={[
          style as any,
          {
            backgroundImage: `url(${uri})`,
            backgroundSize: bgSize,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          } as any,
        ]}
      />
    );
  }

  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}
