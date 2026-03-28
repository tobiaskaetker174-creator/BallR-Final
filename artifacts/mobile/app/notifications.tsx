import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { ComponentProps, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  NOTIFICATIONS,
  Notification,
  NotificationType,
  formatTimestamp,
} from "@/constants/mock";
import { useBallrData } from "@/context/BallrDataContext";

function getNotifIcon(type: NotificationType): { name: ComponentProps<typeof Ionicons>["name"]; color: string; bg: string } {
  switch (type) {
    case "game_confirmed": return { name: "checkmark-circle", color: Colors.accent, bg: `${Colors.primary}33` };
    case "teams_ready": return { name: "people", color: Colors.blue, bg: `${Colors.blue}22` };
    case "rating_reminder": return { name: "star", color: Colors.amber, bg: `${Colors.amber}22` };
    case "potm": return { name: "trophy", color: Colors.amber, bg: `${Colors.amber}22` };
    case "no_show": return { name: "alert-circle", color: Colors.red, bg: `${Colors.red}22` };
    case "game_full": return { name: "close-circle", color: Colors.red, bg: `${Colors.red}22` };
    case "new_game": return { name: "football", color: Colors.accent, bg: `${Colors.primary}33` };
    case "carpool_invite": return { name: "car", color: Colors.teal, bg: `${Colors.teal}22` };
    case "game_reminder": return { name: "alarm", color: Colors.blue, bg: `${Colors.blue}22` };
    default: return { name: "notifications", color: Colors.muted, bg: Colors.overlay };
  }
}

function NotifRow({ item, onRead }: { item: Notification; onRead: (id: string) => void }) {
  const iconInfo = getNotifIcon(item.type);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notifRow,
        !item.read && styles.notifRowUnread,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => {
        onRead(item.id);
        if (item.gameId) {
          if (item.type === "carpool_invite") {
            router.push({ pathname: "/carpool/[id]", params: { id: item.gameId } });
          } else {
            router.push({ pathname: "/game/[id]", params: { id: item.gameId } });
          }
        }
      }}
    >
      <View style={[styles.notifIcon, { backgroundColor: iconInfo.bg }]}>
        <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { notifications: liveNotifications } = useBallrData();
  const baseNotifs = liveNotifications.length > 0 ? liveNotifications : NOTIFICATIONS;
  const [notifs, setNotifs] = useState(baseNotifs);

  // Sync when live data arrives
  React.useEffect(() => {
    if (liveNotifications.length > 0) {
      setNotifs((prev) => {
        const readIds = new Set(prev.filter((n) => n.read).map((n) => n.id));
        return liveNotifications.map((n) => ({ ...n, read: readIds.has(n.id) || n.read }));
      });
    }
  }, [liveNotifications.length]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push("/notification-settings")}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.muted} />
        </Pressable>
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={14} color={Colors.accent} />
          <Text style={styles.unreadBannerText}>{unreadCount} new notification{unreadCount > 1 ? "s" : ""}</Text>
          <Pressable onPress={markAllRead} style={{ marginLeft: "auto" }}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotifRow item={item} onRead={markRead} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.muted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
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
  settingsBtn: {
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
  },
  markAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.accent,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.primary}22`,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  unreadBannerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.accent,
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  notifRowUnread: {
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
    backgroundColor: `${Colors.primary}14`,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  notifBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  notifTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.overlay,
    marginTop: 2,
  },
  sep: { height: 8 },
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
