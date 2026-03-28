import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Crew } from "@/constants/mock";
import { fetchCrewByInviteCode } from "@/lib/ballrApi";

export default function JoinCrewScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [code, setCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [crew, setCrew] = useState<Crew | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async () => {
    if (code.trim().length < 3) return;
    setIsSearching(true);
    setError("");
    setCrew(null);
    setHasSearched(true);
    try {
      const found = await fetchCrewByInviteCode(code.trim().toUpperCase());
      if (found) {
        setCrew(found);
      } else {
        setError("No crew found with this invite code");
      }
    } catch {
      setError("Could not find crew. Check the code and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoin = () => {
    if (crew) {
      router.replace({ pathname: "/crew/[id]", params: { id: crew.id } });
    }
  };

  const accentColor = crew?.primaryColor || Colors.primary;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Join a Crew</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPadding + 32 }]}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="enter-outline" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Enter Invite Code</Text>
          <Text style={styles.headerDesc}>
            Ask your crew leader for the invite code to join their crew.
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.codeInput}
            placeholder="INVITE CODE"
            placeholderTextColor={Colors.muted}
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              if (hasSearched) {
                setHasSearched(false);
                setCrew(null);
                setError("");
              }
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
          />
          <Pressable
            style={[styles.lookupBtn, code.trim().length < 3 && styles.lookupBtnDisabled]}
            onPress={handleLookup}
            disabled={code.trim().length < 3 || isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={Colors.base} />
            ) : (
              <>
                <Ionicons name="search-outline" size={16} color={Colors.base} />
                <Text style={styles.lookupBtnText}>Find Crew</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Crew Preview */}
        {crew && (
          <View style={styles.crewPreview}>
            <Text style={styles.previewLabel}>CREW FOUND</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewColorBar, { backgroundColor: accentColor }]} />
              <View style={styles.previewBody}>
                <View style={[styles.previewIcon, { backgroundColor: `${accentColor}30` }]}>
                  <Ionicons name="people" size={22} color={accentColor} />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{crew.name}</Text>
                  {crew.description ? (
                    <Text style={styles.previewDesc} numberOfLines={2}>
                      {crew.description}
                    </Text>
                  ) : null}
                  <View style={styles.previewStatsRow}>
                    <Text style={styles.previewStat}>
                      {crew.memberCount} members
                    </Text>
                    <View style={styles.previewDot} />
                    <Text style={styles.previewStat}>
                      {crew.gameCount} games
                    </Text>
                    <View style={styles.previewDot} />
                    <Text style={styles.previewStat}>
                      {crew.avgElo} avg ELO
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Pressable style={styles.joinBtn} onPress={handleJoin}>
              <Ionicons name="enter-outline" size={18} color={Colors.base} />
              <Text style={styles.joinBtnText}>Join {crew.name}</Text>
            </Pressable>
          </View>
        )}
      </View>
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
  backBtn: {
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 8,
  },
  headerDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  inputSection: {
    gap: 10,
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  lookupBtnDisabled: {
    opacity: 0.5,
  },
  lookupBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.base,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.red}15`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.red,
    flex: 1,
  },
  crewPreview: {
    marginTop: 8,
  },
  previewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 16,
  },
  previewColorBar: {
    width: 4,
  },
  previewBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  previewDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  previewStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  previewStat: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  previewDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.overlay,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  joinBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.base,
  },
});
