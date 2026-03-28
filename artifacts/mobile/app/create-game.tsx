import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { SkillLevel, VENUES_LIST, getSkillColor, getSkillLabel } from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";

const CITIES = [
  { id: "bangkok", label: "Bangkok 🇹🇭" },
  { id: "bali", label: "Bali 🇮🇩" },
];

const SKILL_OPTIONS: SkillLevel[] = ["beginner", "intermediate", "advanced", "mixed"];
const PLAYER_COUNTS = [8, 10, 12, 14, 16];
const DURATIONS = [60, 90, 120];
const CUTOFFS = [1, 2, 4, 6, 12, 24];

function ChipSelect<T extends string>({
  label,
  options,
  value,
  onSelect,
  renderLabel,
  renderColor,
}: {
  label: string;
  options: T[];
  value: T;
  onSelect: (v: T) => void;
  renderLabel: (v: T) => string;
  renderColor?: (v: T) => string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((opt) => {
          const active = value === opt;
          const color = renderColor ? renderColor(opt) : Colors.accent;
          return (
            <Pressable
              key={opt}
              style={[styles.chip, active && { backgroundColor: `${color}33`, borderColor: color }]}
              onPress={() => { Haptics.selectionAsync(); onSelect(opt); }}
            >
              <Text style={[styles.chipText, active && { color }]}>{renderLabel(opt)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function CreateGameScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

  const [city, setCity] = useState("bangkok");
  const [venueId, setVenueId] = useState("v1");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [price, setPrice] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [minReliability, setMinReliability] = useState(0);
  const [description, setDescription] = useState("");
  const [cutoffHours, setCutoffHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const cityVenues = VENUES_LIST.filter((v) => v.cityId === city);

  const validate = () => {
    if (!date.trim()) return "Please enter a date";
    if (!price.trim() || isNaN(Number(price))) return "Enter a valid price";
    return "";
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { Alert.alert("Missing info", err); return; }
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Game Created! 🎉",
      "Your game has been posted. Players can now discover and join it.",
      [{ text: "View Games", onPress: () => router.replace("/(tabs)") }]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: topPadding, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }]}>
        <Ionicons name="football-outline" size={52} color={Colors.muted} />
        <Text style={styles.headerTitle}>Create a Game</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 20 }}>
          You need to be logged in to post a game and become an organizer.
        </Text>
        <Pressable
          style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, flexDirection: "row", gap: 8, alignItems: "center" }}
          onPress={() => router.push("/auth")}
        >
          <Ionicons name="person-outline" size={16} color={Colors.text} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text }}>Log In to BallR</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPadding }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Game</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <ChipSelect
          label="CITY"
          options={CITIES.map((c) => c.id) as any}
          value={city}
          onSelect={(v) => { setCity(v); setVenueId(VENUES_LIST.find((vn) => vn.cityId === v)?.id ?? "v1"); }}
          renderLabel={(v) => CITIES.find((c) => c.id === v)?.label ?? v}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>VENUE</Text>
          <View style={styles.venueList}>
            {cityVenues.map((v) => (
              <Pressable
                key={v.id}
                style={[styles.venueRow, venueId === v.id && styles.venueRowActive]}
                onPress={() => { Haptics.selectionAsync(); setVenueId(v.id); }}
              >
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{v.name}</Text>
                  <Text style={styles.venueAddr}>{v.address} · {v.surfaceType}</Text>
                </View>
                {venueId === v.id && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>DATE</Text>
            <View style={styles.inputRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Mar 28, 2026"
                placeholderTextColor={Colors.muted}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>KICK-OFF TIME</Text>
            <View style={styles.inputRow}>
              <Ionicons name="time-outline" size={14} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="18:00"
                placeholderTextColor={Colors.muted}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
        </View>

        <ChipSelect
          label="DURATION"
          options={DURATIONS as any}
          value={duration as any}
          onSelect={(v) => setDuration(Number(v))}
          renderLabel={(v) => `${v} min`}
        />

        <ChipSelect
          label="MAX PLAYERS"
          options={PLAYER_COUNTS as any}
          value={maxPlayers as any}
          onSelect={(v) => setMaxPlayers(Number(v))}
          renderLabel={(v) => `${v} players`}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>PRICE PER PLAYER ({city === "bangkok" ? "฿ THB" : "Rp IDR"})</Text>
          <View style={styles.inputRow}>
            <Ionicons name="cash-outline" size={14} color={Colors.muted} />
            <TextInput
              style={styles.input}
              placeholder={city === "bangkok" ? "250" : "150000"}
              placeholderTextColor={Colors.muted}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <ChipSelect
          label="SKILL LEVEL"
          options={SKILL_OPTIONS}
          value={skillLevel}
          onSelect={setSkillLevel}
          renderLabel={getSkillLabel}
          renderColor={getSkillColor}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>MIN RELIABILITY SCORE ({minReliability}%+)</Text>
          <View style={styles.reliabilitySlider}>
            {[0, 70, 80, 90].map((v) => (
              <Pressable
                key={v}
                style={[styles.reliabilityChip, minReliability === v && styles.reliabilityChipActive]}
                onPress={() => { Haptics.selectionAsync(); setMinReliability(v); }}
              >
                <Text style={[styles.reliabilityChipText, minReliability === v && styles.reliabilityChipTextActive]}>
                  {v === 0 ? "Any" : `${v}%+`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ChipSelect
          label="REGISTRATION CUTOFF"
          options={CUTOFFS as any}
          value={cutoffHours as any}
          onSelect={(v) => setCutoffHours(Number(v))}
          renderLabel={(v) => `${v}h before`}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DESCRIPTION (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any notes for players — skill expectations, meetup point, gear needed..."
            placeholderTextColor={Colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={300}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>GAME SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Venue</Text>
            <Text style={styles.summaryValue}>{VENUES_LIST.find((v) => v.id === venueId)?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Players</Text>
            <Text style={styles.summaryValue}>{maxPlayers} max · {duration}min</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>{price ? (city === "bangkok" ? `฿${price}` : `Rp${price}`) : "--"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Level</Text>
            <Text style={[styles.summaryValue, { color: getSkillColor(skillLevel) }]}>
              {getSkillLabel(skillLevel)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomPadding, 12) + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.createBtn, submitting && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.createBtnText}>Posting Game...</Text>
          ) : (
            <>
              <Ionicons name="football-outline" size={18} color={Colors.text} />
              <Text style={styles.createBtnText}>Post Game</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  scroll: { paddingHorizontal: 16, gap: 4 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  chipRow: { gap: 8, flexDirection: "row" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  venueList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    gap: 10,
  },
  venueRowActive: {
    backgroundColor: `${Colors.primary}22`,
  },
  venueInfo: { flex: 1 },
  venueName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  venueAddr: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  reliabilitySlider: {
    flexDirection: "row",
    gap: 8,
  },
  reliabilityChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  reliabilityChipActive: {
    backgroundColor: `${Colors.accent}22`,
    borderColor: Colors.accent,
  },
  reliabilityChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  reliabilityChipTextActive: { color: Colors.accent },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    minHeight: 80,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    textAlign: "right",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  summaryTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  summaryValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
