import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import {
  ALL_GAMES,
  CARPOOL_MESSAGES,
  CarpoolMessage,
  CarpoolOffer,
  MY_GAMES_IDS,
  formatTimestamp,
} from "@/constants/mock";

const CURRENT_USER_ID = "p0";
const CURRENT_USER_NAME = "Maya";

const avatarColors = [Colors.primary, Colors.blue, Colors.teal, Colors.purple, Colors.amber];
function avatarBgForId(id: string) {
  return avatarColors[Math.abs((id.charCodeAt(1) || 0)) % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function CarpoolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const game = ALL_GAMES.find((g) => g.id === id);
  const isParticipant = MY_GAMES_IDS.has(id ?? "");

  const [offers, setOffers] = useState<CarpoolOffer[]>(game?.carpoolOffers ?? []);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [departure, setDeparture] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [seats, setSeats] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<CarpoolMessage[]>(
    CARPOOL_MESSAGES[id ?? ""] ?? []
  );
  const [chatText, setChatText] = useState("");

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  };

  const sendChatMessage = () => {
    if (!chatText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: CarpoolMessage = {
      id: `cm_${Date.now()}`,
      gameId: id ?? "",
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      text: chatText.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatText("");
  };

  if (!game) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Carpooling</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Game not found.</Text>
        </View>
      </View>
    );
  }

  const handleRequestSeat = (index: number) => {
    if (requestedIds.has(index)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequestedIds((prev) => new Set(prev).add(index));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`Seat requested from ${offers[index].driverName} · Chat to confirm details`);
  };

  const handleOfferRide = async () => {
    if (!departure.trim()) { Alert.alert("Missing info", "Please enter a departure time."); return; }
    if (!meetingPoint.trim()) { Alert.alert("Missing info", "Please enter a meeting point."); return; }
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 800));
    const newOffer: CarpoolOffer = { driverName: "Maya S.", seats, departure: departure.trim(), meetingPoint: meetingPoint.trim() };
    setOffers((prev) => [...prev, newOffer]);
    setShowOfferForm(false);
    setDeparture("");
    setMeetingPoint("");
    setSeats(2);
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Ride Offered! 🎉", "Your ride is now visible to other players in this game.");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPadding }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Carpooling</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.gameBadge}>
        <Ionicons name="football-outline" size={14} color={Colors.teal} />
        <Text style={styles.gameBadgeText}>{game.venue.name}</Text>
        <Text style={styles.gameBadgeSep}>·</Text>
        <Ionicons name="people-outline" size={14} color={Colors.muted} />
        <Text style={styles.gameBadgeCount}>{game.currentPlayers}/{game.maxPlayers} players</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AVAILABLE RIDES</Text>
            <Text style={styles.sectionCount}>{offers.length} offer{offers.length !== 1 ? "s" : ""}</Text>
          </View>

          {offers.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={40} color={Colors.muted} />
              <Text style={styles.emptyText}>No rides yet</Text>
              <Text style={styles.emptySub}>Be the first to offer a ride to your teammates!</Text>
            </View>
          )}

          {offers.map((offer, i) => {
            const initials = offer.driverName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isRequested = requestedIds.has(i);
            return (
              <View key={i} style={styles.offerCard}>
                <View style={styles.offerTop}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverInitials}>{initials}</Text>
                  </View>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{offer.driverName}</Text>
                    <Text style={styles.driverDeparture}>{offer.departure}</Text>
                  </View>
                  <View style={styles.seatsBadge}>
                    <Ionicons name="people-outline" size={12} color={Colors.teal} />
                    <Text style={styles.seatsText}>{offer.seats}</Text>
                  </View>
                </View>
                <View style={styles.meetRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.muted} />
                  <Text style={styles.meetText}>{offer.meetingPoint}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.requestBtn,
                    isRequested && styles.requestBtnDone,
                    pressed && !isRequested && { opacity: 0.85 },
                  ]}
                  onPress={() => handleRequestSeat(i)}
                  disabled={isRequested}
                >
                  <Ionicons
                    name={isRequested ? "checkmark-circle" : "hand-right-outline"}
                    size={15}
                    color={isRequested ? Colors.accent : Colors.teal}
                  />
                  <Text style={[styles.requestBtnText, isRequested && { color: Colors.accent }]}>
                    {isRequested ? "Seat Requested" : "Request Seat"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OFFER A RIDE</Text>
          {!showOfferForm ? (
            <Pressable
              style={({ pressed }) => [styles.offerBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOfferForm(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.teal} />
              <Text style={styles.offerBtnText}>Offer a Ride to Teammates</Text>
            </Pressable>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formLabel}>DEPARTURE TIME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 1h before kick-off, 6:30 PM"
                placeholderTextColor={Colors.muted}
                value={departure}
                onChangeText={setDeparture}
              />

              <Text style={styles.formLabel}>MEETING POINT</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Asok BTS Station Exit 3"
                placeholderTextColor={Colors.muted}
                value={meetingPoint}
                onChangeText={setMeetingPoint}
              />

              <Text style={styles.formLabel}>AVAILABLE SEATS</Text>
              <View style={styles.seatsStepper}>
                <Pressable
                  style={[styles.stepperBtn, seats <= 1 && { opacity: 0.4 }]}
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                  disabled={seats <= 1}
                >
                  <Ionicons name="remove" size={18} color={Colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>{seats}</Text>
                <Pressable
                  style={[styles.stepperBtn, seats >= 6 && { opacity: 0.4 }]}
                  onPress={() => setSeats((s) => Math.min(6, s + 1))}
                  disabled={seats >= 6}
                >
                  <Ionicons name="add" size={18} color={Colors.text} />
                </Pressable>
              </View>

              <View style={styles.formActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowOfferForm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.submitBtn, submitting && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
                  onPress={handleOfferRide}
                  disabled={submitting}
                >
                  <Ionicons name="car" size={15} color={Colors.text} />
                  <Text style={styles.submitBtnText}>{submitting ? "Posting..." : "Post Ride"}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {isParticipant && (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [styles.chatToggle, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChatOpen((o) => !o);
              }}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={Colors.accent} />
              <Text style={styles.chatToggleText}>Chat with your carpool 💬</Text>
              <Ionicons
                name={chatOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={Colors.muted}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>

            {chatOpen && (
              <View style={styles.chatPanel}>
                <ScrollView
                  style={styles.chatScroll}
                  contentContainerStyle={styles.chatMessages}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  ref={(ref) => {
                    if (ref && chatMessages.length > 0) {
                      ref.scrollToEnd({ animated: false });
                    }
                  }}
                >
                  {chatMessages.length === 0 ? (
                    <View style={styles.chatEmpty}>
                      <Text style={styles.chatEmptyText}>No messages yet. Start the conversation!</Text>
                    </View>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isMe = msg.senderId === CURRENT_USER_ID;
                      const prevMsg = chatMessages[i - 1];
                      const showName = !isMe && prevMsg?.senderId !== msg.senderId;
                      const avatarBg = avatarBgForId(msg.senderId);
                      return (
                        <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                          {!isMe && (
                            <View style={[styles.msgAvatar, { backgroundColor: avatarBg }]}>
                              <Text style={styles.msgAvatarText}>{getInitials(msg.senderName)}</Text>
                            </View>
                          )}
                          <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                            {showName && (
                              <Text style={styles.bubbleSender}>{msg.senderName}</Text>
                            )}
                            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                              {msg.text}
                            </Text>
                            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                              {formatTimestamp(msg.timestamp)}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Message your carpool..."
                    placeholderTextColor={Colors.muted}
                    value={chatText}
                    onChangeText={setChatText}
                    multiline
                    maxLength={400}
                    returnKeyType="send"
                    onSubmitEditing={sendChatMessage}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.chatSendBtn,
                      !chatText.trim() && styles.chatSendBtnDisabled,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={sendChatMessage}
                    disabled={!chatText.trim()}
                  >
                    <Ionicons name="send" size={16} color={Colors.text} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.muted} />
          <Text style={styles.infoText}>
            Carpooling is private and visible only to players in this game. Use the game chat to coordinate pickup details.
          </Text>
        </View>
      </ScrollView>

      {toastMsg.length > 0 && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
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
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  gameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: `${Colors.teal}18`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${Colors.teal}30`,
  },
  gameBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.teal, flex: 1 },
  gameBadgeSep: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted },
  gameBadgeCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  scroll: { paddingHorizontal: 16, gap: 20 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  offerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.teal}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitials: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.teal },
  driverInfo: { flex: 1, gap: 2 },
  driverName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  driverDeparture: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.teal}22`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seatsText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.teal },
  meetRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meetText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, flex: 1 },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: `${Colors.teal}22`,
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: `${Colors.teal}44`,
  },
  requestBtnDone: {
    backgroundColor: `${Colors.primary}33`,
    borderColor: `${Colors.accent}44`,
  },
  requestBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.teal,
  },
  offerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: `${Colors.teal}33`,
    borderStyle: "dashed",
  },
  offerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.teal },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  formInput: {
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  seatsStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    minWidth: 30,
    textAlign: "center",
  },
  formActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.muted },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  chatToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${Colors.accent}22`,
  },
  chatToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  chatPanel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  chatScroll: {
    maxHeight: 280,
  },
  chatMessages: {
    padding: 12,
    gap: 6,
  },
  chatEmpty: {
    paddingVertical: 20,
    alignItems: "center",
  },
  chatEmptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 4,
  },
  msgRowMe: { justifyContent: "flex-end" },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  msgAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.text,
  },
  bubble: {
    backgroundColor: Colors.overlay,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "78%",
    gap: 2,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  bubbleSender: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
    marginBottom: 1,
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  bubbleTextMe: { color: Colors.text },
  bubbleTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.muted,
    alignSelf: "flex-end",
  },
  bubbleTimeMe: { color: "rgba(255,255,255,0.45)" },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    maxHeight: 80,
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSendBtnDisabled: { backgroundColor: Colors.overlay },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
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
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
});
