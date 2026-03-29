import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (mode === "signup" && name.trim().length < 2) return "Please enter your name";
    if (!email.includes("@")) return "Enter a valid email address";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          {/* BallR icon — green circle with dark cutout */}
          <View style={styles.logoBall}>
            <View style={styles.logoCutout} />
          </View>
          <View style={styles.logoNameRow}>
            <Text style={styles.logoTextBall}>Ball</Text>
            <Text style={styles.logoTextR}>R</Text>
          </View>
          <Text style={styles.logoSub}>Pickup football, perfected.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.modeTabs}>
            {(["login", "signup"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                style={[styles.modeTab, mode === m && styles.modeTabActive]}
                onPress={() => { setMode(m); setError(""); }}
              >
                <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                  {m === "login" ? "Log In" : "Sign Up"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "signup" && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={16} color={Colors.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="Alex Thompson"
                  placeholderTextColor={Colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={16} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.muted} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={Colors.muted} />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {mode === "login" && (
            <Pressable style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {mode === "login" ? "Log In" : "Create Account"}
                </Text>
                <Feather name="arrow-right" size={16} color={Colors.text} />
              </>
            )}
          </Pressable>

          {mode === "signup" && (
            <Text style={styles.termsText}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>
          )}
        </View>

        <Pressable
          style={styles.guestBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.guestBtnText}>Continue as guest →</Text>
        </Pressable>

        <Pressable
          style={styles.demoBtn}
          onPress={() => {
            loginAsDemo();
            router.replace("/(tabs)");
          }}
        >
          <Ionicons name="flash-outline" size={14} color={Colors.accent} />
          <Text style={styles.demoBtnText}>Try as Demo User</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    alignItems: "center",
    marginBottom: 32,
    gap: 6,
  },
  logoBall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent,
    marginBottom: 6,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  logoCutout: {
    position: "absolute" as const,
    top: 3,
    left: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2D5A27",
  },
  logoNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  logoTextBall: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.text,
    letterSpacing: 3,
  },
  logoTextR: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.accent,
    letterSpacing: 3,
  },
  logoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    gap: 16,
    marginBottom: 20,
  },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.muted,
  },
  modeTabTextActive: {
    color: Colors.text,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.overlay,
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
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.red,
    textAlign: "center",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.accent,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  termsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 16,
  },
  dignityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  dignityNoteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  guestBtn: {
    alignItems: "center",
  },
  guestBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: `${Colors.primary}33`,
    borderRadius: 10,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  demoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },
});
