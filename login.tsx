import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/contexts/AuthContext";
import { gradients, palette } from "../../src/theme/palette";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Login failed", String(error instanceof Error ? error.message : error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={gradients.screen} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your Roamio travel workspace.</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={palette.textDim}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={palette.textDim}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={handleLogin} disabled={submitting}>
            <LinearGradient colors={gradients.accent} style={styles.button}>
              <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Enter Roamio"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.switchAction}>
          <Text style={styles.switchText}>Need an account? Create one</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1, justifyContent: "center", padding: 24 },
  title: { color: palette.text, fontSize: 34, fontWeight: "900" },
  subtitle: { color: palette.textMuted, marginTop: 8, marginBottom: 24, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 26,
    padding: 18,
    gap: 12,
  },
  input: {
    backgroundColor: palette.panelAlt,
    color: palette.text,
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  button: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: palette.text,
    fontWeight: "900",
  },
  switchAction: {
    marginTop: 18,
    alignItems: "center",
  },
  switchText: {
    color: palette.teal,
    fontWeight: "800",
  },
});
