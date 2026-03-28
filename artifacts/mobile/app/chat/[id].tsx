import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { CHAT_MESSAGES, ChatMessage, GAMES, formatTimestamp } from "@/constants/mock";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const game = GAMES.find((g) => g.id === id);
  const flatRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

  const initial = CHAT_MESSAGES[id ?? ""] ?? [];
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: ChatMessage = {
      id: `m_${Date.now()}`,
      gameId: id ?? "",
      senderId: "p0",
      senderName: "Maya",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setText("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const avatarColors = [Colors.primary, Colors.blue, Colors.teal, Colors.purple, Colors.amber];

  function MessageRow({ msg, prevMsg }: { msg: ChatMessage; prevMsg?: ChatMessage }) {
    const isMe = msg.senderId === "p0";
    const isSystem = msg.isSystem;
    const showName = !isMe && !isSystem && prevMsg?.senderId !== msg.senderId;
    const avatarBg = avatarColors[Math.abs(msg.senderId.charCodeAt(1) || 0) % avatarColors.length];

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <View style={styles.systemMsgLine} />
          <Text style={styles.systemMsgText}>{msg.text}</Text>
          <View style={styles.systemMsgLine} />
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{getInitials(msg.senderName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
          {showName && <Text style={styles.senderName}>{msg.senderName}</Text>}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.text}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTimestamp(msg.timestamp)}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPadding }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{game?.venue.name ?? "Game Chat"}</Text>
          <Text style={styles.headerSub}>{game?.bookings.length ?? 0} players in chat</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageRow msg={item} prevMsg={messages[index - 1]} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(bottomPadding, 8) + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={({ pressed }) => [styles.sendBtn, !text.trim() && styles.sendBtnDisabled, pressed && { opacity: 0.8 }]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.text} />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  list: { padding: 16, gap: 6 },
  systemMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
  },
  systemMsgLine: { flex: 1, height: 1, backgroundColor: Colors.separator },
  systemMsgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
    flexShrink: 1,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  msgRowMe: { justifyContent: "flex-end" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.text,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: "75%",
    gap: 3,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
    marginBottom: 1,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  msgTextMe: { color: Colors.text },
  msgTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.muted,
    alignSelf: "flex-end",
  },
  msgTimeMe: { color: "rgba(255,255,255,0.5)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.overlay },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
});
