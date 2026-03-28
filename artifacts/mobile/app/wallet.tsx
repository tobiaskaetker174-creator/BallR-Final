import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  WALLET_BALANCE,
  WALLET_ENTRIES,
  WalletEntry,
  MY_REFERRAL_CREDITS,
} from "@/constants/mock";

const REFERRAL_CREDIT_UNIT = 250;
const REFERRAL_CREDITS_TOTAL = MY_REFERRAL_CREDITS * REFERRAL_CREDIT_UNIT;
const GAME_CREDITS = WALLET_BALANCE - REFERRAL_CREDITS_TOTAL;

const EARNED_TYPES: WalletEntry["type"][] = ["referral_credit", "bonus", "top_up"];
const SPENT_TYPES: WalletEntry["type"][] = ["game_payment", "game_refund"];

const earnedEntries = WALLET_ENTRIES.filter((e) => EARNED_TYPES.includes(e.type));
const spentEntries = WALLET_ENTRIES.filter((e) => SPENT_TYPES.includes(e.type));

function getEntryIcon(type: WalletEntry["type"]): {
  name: "football-outline" | "people-outline" | "add-circle-outline" | "gift-outline" | "refresh-outline";
  color: string;
} {
  switch (type) {
    case "game_payment": return { name: "football-outline", color: Colors.red };
    case "game_refund": return { name: "refresh-outline", color: Colors.accent };
    case "referral_credit": return { name: "people-outline", color: Colors.blue };
    case "top_up": return { name: "add-circle-outline", color: Colors.accent };
    case "bonus": return { name: "gift-outline", color: Colors.amber };
  }
}

function EntryRow({ item }: { item: WalletEntry }) {
  const iconInfo = getEntryIcon(item.type);
  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryIcon, { backgroundColor: `${iconInfo.color}22` }]}>
        <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryLabel}>{item.label}</Text>
        <Text style={styles.entryDate}>{item.date}</Text>
      </View>
      <Text style={[styles.entryAmount, { color: item.amount > 0 ? Colors.accent : Colors.red }]}>
        {item.amount > 0 ? `+฿${item.amount}` : `-฿${Math.abs(item.amount)}`}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>BallR Wallet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 32 }]}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceIconWrap}>
              <Ionicons name="wallet-outline" size={24} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>฿{WALLET_BALANCE}</Text>
            </View>
          </View>

          <View style={styles.balanceDivider} />

          <View style={styles.creditBreakdownRow}>
            <View style={styles.creditBreakdownItem}>
              <View style={styles.creditIconRow}>
                <Ionicons name="people-outline" size={13} color={Colors.blue} />
                <Text style={styles.creditBreakdownLabel}>Referral Credits</Text>
              </View>
              <Text style={[styles.creditBreakdownValue, { color: Colors.blue }]}>
                ฿{REFERRAL_CREDITS_TOTAL}
              </Text>
            </View>
            <View style={styles.creditBreakdownDivider} />
            <View style={styles.creditBreakdownItem}>
              <View style={styles.creditIconRow}>
                <Ionicons name="gift-outline" size={13} color={Colors.amber} />
                <Text style={styles.creditBreakdownLabel}>Game Credits</Text>
              </View>
              <Text style={[styles.creditBreakdownValue, { color: Colors.amber }]}>
                ฿{GAME_CREDITS}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.redeemCard}>
          <View style={styles.redeemIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.redeemTitle}>Redeem Credits</Text>
            <Text style={styles.redeemDesc}>
              Your credits are automatically applied at checkout when you join a game.
            </Text>
          </View>
        </View>

        {earnedEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EARNED</Text>
            <View style={styles.entriesList}>
              {earnedEntries.map((item) => (
                <EntryRow key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}

        {spentEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SPENT</Text>
            <View style={styles.entriesList}>
              {spentEntries.map((item) => (
                <EntryRow key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}

        {earnedEntries.length === 0 && spentEntries.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={Colors.muted} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
    gap: 14,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  balanceIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Colors.primary}44`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  balanceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  balanceAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: Colors.accent,
    letterSpacing: -1,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: Colors.separator,
  },
  creditBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  creditBreakdownItem: {
    flex: 1,
    gap: 4,
  },
  creditIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  creditBreakdownLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
  creditBreakdownValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  creditBreakdownDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.separator,
    marginHorizontal: 16,
  },
  redeemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.accent}22`,
  },
  redeemIconWrap: {
    marginTop: 1,
    flexShrink: 0,
  },
  redeemTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.accent,
    marginBottom: 3,
  },
  redeemDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 2,
  },
  entriesList: {
    gap: 8,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  entryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 2,
  },
  entryDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  entryAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    flexShrink: 0,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.muted,
  },
});
