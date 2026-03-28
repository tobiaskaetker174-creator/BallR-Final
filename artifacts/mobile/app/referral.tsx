import { Ionicons, Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  MY_REFERRAL_CODE,
  MY_REFERRAL_CREDITS,
  MY_REFERRALS,
  ReferralEntry,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";

function ReferralRow({ entry }: { entry: ReferralEntry }) {
  const isPending = entry.status === "pending";
  return (
    <View style={styles.referralRow}>
      <View style={[styles.referralAvatar, { backgroundColor: isPending ? Colors.overlay : `${Colors.primary}44` }]}>
        <Ionicons
          name={isPending ? "time-outline" : "checkmark-circle"}
          size={16}
          color={isPending ? Colors.muted : Colors.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.referralName}>{entry.name}</Text>
        <Text style={styles.referralDate}>
          {isPending ? `Invited ${entry.invitedAt}` : `Joined ${entry.joinedAt}`}
        </Text>
      </View>
      {isPending ? (
        <View style={styles.pendingChip}>
          <Text style={styles.pendingChipText}>PENDING</Text>
        </View>
      ) : (
        <View style={styles.completedChip}>
          <Text style={styles.completedChipText}>+1 credit</Text>
        </View>
      )}
    </View>
  );
}

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }]}>
        <Ionicons name="lock-closed-outline" size={40} color={Colors.muted} />
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text, textAlign: "center" }}>
          Log in to access referrals
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, textAlign: "center" }}>
          Create an account or sign in to get your unique referral code.
        </Text>
        <Pressable
          style={{ backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12, marginTop: 4 }}
          onPress={() => router.replace("/auth")}
        >
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text }}>LOG IN</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const referralCode = user
    ? `${user.name.split(" ")[0].toUpperCase().slice(0, 4)}-7X2K`
    : MY_REFERRAL_CODE;

  const referralLink = `https://ballr.app/join?ref=${referralCode}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on BallR — the best way to find pickup football in Bangkok & Bali! Use my code ${referralCode} and we both earn a free game credit.\n\n${referralLink}`,
        title: "Play football with me on BallR",
      });
    } catch (err) {
      Alert.alert("Share failed", "Could not open the share sheet. Please try again.");
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const pending = MY_REFERRALS.filter((r) => r.status === "pending");
  const completed = MY_REFERRALS.filter((r) => r.status === "completed");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Refer a Friend</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Ionicons name="people" size={32} color={Colors.accent} />
        </View>
        <Text style={styles.heroTitle}>Invite Friends. Earn Credits.</Text>
        <Text style={styles.heroSub}>
          For every friend who joins BallR with your code, you both earn 1 free game credit.
        </Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
        <Text style={styles.codeText}>{referralCode}</Text>
        <Text style={styles.codeLinkText} numberOfLines={1}>{referralLink}</Text>

        <View style={styles.codeActions}>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }, copied && styles.copyBtnDone]}
            onPress={handleCopy}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={15}
              color={copied ? Colors.base : Colors.text}
            />
            <Text style={[styles.copyBtnText, copied && { color: Colors.base }]}>
              {copied ? "Copied!" : "Copy Link"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={15} color={Colors.base} />
            <Text style={styles.shareBtnText}>Share</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.creditsCard}>
        <View style={styles.creditsLeft}>
          <Ionicons name="gift-outline" size={20} color={Colors.amber} />
          <View>
            <Text style={styles.creditsLabel}>CREDITS EARNED</Text>
            <Text style={styles.creditsSub}>Redeemable at checkout</Text>
          </View>
        </View>
        <View style={styles.creditsRight}>
          <Text style={styles.creditsValue}>{MY_REFERRAL_CREDITS}</Text>
          <Text style={styles.creditsUnit}>free games</Text>
        </View>
      </View>

      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PENDING INVITES</Text>
          <View style={styles.referralList}>
            {pending.map((entry) => (
              <ReferralRow key={entry.id} entry={entry} />
            ))}
          </View>
        </View>
      )}

      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPLETED REFERRALS</Text>
          <View style={styles.referralList}>
            {completed.map((entry) => (
              <ReferralRow key={entry.id} entry={entry} />
            ))}
          </View>
        </View>
      )}

      {MY_REFERRALS.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="send-outline" size={36} color={Colors.muted} />
          <Text style={styles.emptyText}>No referrals yet.</Text>
          <Text style={styles.emptySub}>Share your code to get started!</Text>
        </View>
      )}

      <View style={styles.howItWorksCard}>
        <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
        {[
          { icon: "share-social-outline", label: "Share your code", desc: "Send your unique code or link to a friend." },
          { icon: "person-add-outline", label: "Friend signs up", desc: "They create a BallR account using your code." },
          { icon: "gift-outline", label: "Both earn a credit", desc: "Once they join their first game, you both get 1 free game credit." },
        ].map((step, i) => (
          <View key={i} style={styles.howItWorksRow}>
            <View style={styles.howItWorksNumBox}>
              <Text style={styles.howItWorksNum}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howItWorksLabel}>{step.label}</Text>
              <Text style={styles.howItWorksDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}44`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  codeCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
    gap: 6,
    marginBottom: 12,
  },
  codeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  codeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: Colors.accent,
    letterSpacing: 4,
    marginVertical: 4,
  },
  codeLinkText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 12,
  },
  codeActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  copyBtnDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  copyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  shareBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.base,
  },
  creditsCard: {
    marginHorizontal: 16,
    backgroundColor: `${Colors.amber}18`,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: `${Colors.amber}44`,
    marginBottom: 20,
  },
  creditsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creditsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.amber,
    letterSpacing: 1,
  },
  creditsSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  creditsRight: {
    alignItems: "flex-end",
  },
  creditsValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.amber,
  },
  creditsUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  referralList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  referralAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  referralName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  referralDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  pendingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  pendingChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  completedChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: `${Colors.accent}22`,
  },
  completedChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.muted,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  howItWorksCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    gap: 0,
  },
  howItWorksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  howItWorksNumBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}44`,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  howItWorksNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.accent,
  },
  howItWorksLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  howItWorksDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 17,
  },
});
