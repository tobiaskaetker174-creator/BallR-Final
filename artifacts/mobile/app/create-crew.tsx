import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const COLOR_PRESETS = [
  { label: "Moss Green", value: "#2D5A27" },
  { label: "Ocean Blue", value: "#2A5B8F" },
  { label: "Royal Purple", value: "#6B3FA0" },
  { label: "Sunset Orange", value: "#D4722A" },
  { label: "Crimson Red", value: "#B03030" },
  { label: "Teal", value: "#2A8F7A" },
  { label: "Gold", value: "#B8860B" },
  { label: "Slate", value: "#4A5568" },
];

export default function CreateCrewScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [isPrivate, setIsPrivate] = useState(false);

  const canCreate = name.trim().length >= 2;

  const handleCreate = () => {
    // Creation API not yet available
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Create Crew</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomPadding + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming Soon notice */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="construct-outline" size={18} color={Colors.amber} />
          <View style={styles.comingSoonText}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonDesc}>
              Crew creation will be available in the next update. Preview the form below.
            </Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CREW NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Bangkok Ballers"
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={(t) => setName(t.slice(0, 30))}
            maxLength={30}
          />
          <Text style={styles.charCount}>{name.length}/30</Text>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="What's your crew about?"
            placeholderTextColor={Colors.muted}
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, 200))}
            maxLength={200}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Color Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CREW COLOR</Text>
          <View style={styles.colorGrid}>
            {COLOR_PRESETS.map((preset) => (
              <Pressable
                key={preset.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: `${preset.value}30`, borderColor: preset.value },
                  selectedColor === preset.value && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(preset.value)}
              >
                <View style={[styles.colorDot, { backgroundColor: preset.value }]} />
                <Text style={styles.colorLabel}>{preset.label}</Text>
                {selectedColor === preset.value && (
                  <Ionicons name="checkmark-circle" size={16} color={preset.value} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.fieldGroup}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.fieldLabel}>PRIVATE CREW</Text>
              <Text style={styles.privacyDesc}>
                Only players with an invite code can join
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: Colors.overlay, true: `${Colors.primary}88` }}
              thumbColor={isPrivate ? Colors.accent : Colors.muted}
            />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <View style={styles.previewCard}>
            <View style={[styles.previewColorBar, { backgroundColor: selectedColor }]} />
            <View style={styles.previewBody}>
              <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}30` }]}>
                <Ionicons name="people" size={18} color={selectedColor} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{name || "Crew Name"}</Text>
                <Text style={styles.previewDesc}>
                  {description || "No description"}
                </Text>
              </View>
              {isPrivate && (
                <Ionicons name="lock-closed" size={14} color={Colors.muted} />
              )}
            </View>
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
          disabled
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.base} />
          <Text style={styles.createBtnText}>Create Crew</Text>
        </Pressable>
        <Text style={styles.createNote}>
          Crew creation requires the backend API (coming soon)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  comingSoonBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${Colors.amber}15`,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.amber}30`,
  },
  comingSoonText: {
    flex: 1,
  },
  comingSoonTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.amber,
  },
  comingSoonDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  textArea: {
    minHeight: 80,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "right",
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorOptionSelected: {
    borderWidth: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  privacyInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
  },
  previewColorBar: {
    width: 4,
  },
  previewBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  previewDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    opacity: 0.5,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.base,
  },
  createNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
    marginBottom: 24,
  },
});
