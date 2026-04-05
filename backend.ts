import { Platform } from "react-native";
import Constants from "expo-constants";

const REQUEST_TIMEOUT_MS = 12000;

function isPrivateIpv4Host(host: string) {
  return /^(10\.\d+\.\d+\.\d+|127\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(host);
}

function inferExpoHostUrl() {
  const possibleHost =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    (
      Constants as unknown as {
        manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
      }
    ).manifest2?.extra?.expoClient?.hostUri ||
    "";

  if (!possibleHost) return "";

  const host = possibleHost.split(":")[0]?.trim();
  if (!host) return "";
  if (host.endsWith(".exp.direct") || host.endsWith(".expo.dev") || host.includes("ngrok")) return "";
  if (!isPrivateIpv4Host(host)) return "";
  if (host === "localhost" || host === "127.0.0.1") return "";

  return `http://${host}:5000`;
}

function getBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  const sharedWebEnvUrl =
    typeof process.env.VITE_BACKEND_URL === "string"
      ? process.env.VITE_BACKEND_URL.trim()
      : "";
  const expoHostUrl = inferExpoHostUrl();

  if (envUrl) return envUrl.replace(/\/$/, "");
  if (sharedWebEnvUrl) return sharedWebEnvUrl.replace(/\/$/, "");
  if (expoHostUrl) return expoHostUrl.replace(/\/$/, "");

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
}

export const API_BASE_URL = getBaseUrl();

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Backend request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Current backend: ${API_BASE_URL}`);
    }

    throw new Error(`Cannot reach backend at ${API_BASE_URL}. Check that roamio-backend is running and reachable from this device.`);
  }

  clearTimeout(timeout);

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data as T;
}

export type BackendUser = {
  _id: string;
  email: string;
  name: string;
  username?: string;
  age?: number | string;
  bio?: string;
  hobby?: string;
  city?: string;
  hometown?: string;
  destination?: string;
  budget?: string;
  travelStyle?: string;
  interests?: string[];
  travelInterests?: string[];
  visitedStates?: string[];
  prompts?: { question: string; answer: string }[];
  travelerDNA?: {
    budgetStyle?: number;
    energyLevel?: number;
    planningStyle?: number;
    socialPreference?: number;
  };
  photos?: string[];
  profilePicture?: string;
  goal?: string;
  frequency?: string;
  religion?: string;
  gender?: string;
  level?: string;
  xp?: number;
  badges?: string[];
  streak?: number;
  dailyMissions?: {
    id: string;
    title: string;
    action: string;
    target: number;
    progress: number;
    rewardXp: number;
    completed: boolean;
    rewarded?: boolean;
  }[];
  gamificationStats?: {
    totalMatches?: number;
    totalPlacesAdded?: number;
    totalQuizCompleted?: number;
    totalMemoriesPosted?: number;
    profileCompletedAwarded?: boolean;
    lastLoginDay?: string;
    lastActiveDay?: string;
    lastMissionDay?: string;
    lastLevelUpAt?: string;
  };
  points?: number;
  emergencyContacts?: {
    id: string;
    name: string;
    phone: string;
    active: boolean;
  }[];
  sosContact?: string;
  profileCompleted?: boolean;
  matchScore?: number;
  matchDebug?: {
    commonInterests?: string[];
    interestScore?: number;
    budgetScore?: number;
    travelStyleScore?: number;
    locationScore?: number;
    travelerDNAScore?: number;
  };
};

export const backendApi = {
  baseUrl: API_BASE_URL,
  health() {
    return request<{ status: string; service: string }>("/api/health");
  },
  login(payload: { email: string; password: string }) {
    return request<{ user: BackendUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  register(payload: Record<string, unknown>) {
    return request<{ user: BackendUser; token: string }>("/api/auth/register", {
      method: "POST",
      body: payload,
    });
  },
  firebaseSession(payload: { firebaseUid: string; email: string; name?: string }) {
    return request<{ user: BackendUser; token: string }>("/api/auth/firebase-session", {
      method: "POST",
      body: payload,
    });
  },
  getProfile(token: string) {
    return request<BackendUser>("/api/auth/profile", { token });
  },
  updateProfile(token: string, payload: Record<string, unknown>) {
    return request<BackendUser>("/api/profile/me", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  recordGamificationAction(token: string, action: string) {
    return request<{
      user: BackendUser;
      result: {
        xpGained: number;
        unlockedBadges: string[];
        streak: number;
        streakBonusXp: number;
        leveledUp: boolean;
        level: string;
        nextLevelThreshold: { level: string; minXp: number } | null;
      };
    }>("/api/profile/gamification/action", {
      method: "POST",
      token,
      body: { action },
    });
  },
  getGamificationLeaderboard(token: string) {
    return request<{
      leaderboard: {
        id: string;
        name: string;
        profilePicture?: string;
        xp: number;
        level: string;
        badges: string[];
        streak: number;
        rank: number;
      }[];
      currentUserRank: number | null;
    }>("/api/profile/gamification/leaderboard", { token });
  },
  syncFirebaseProfile(payload: Record<string, unknown>) {
    return request<BackendUser>("/api/profile/firebase-sync", {
      method: "POST",
      body: payload,
    });
  },
  getFirebaseProfile(firebaseUid: string) {
    return request<BackendUser>(`/api/profile/firebase/${firebaseUid}`);
  },
  updateFirebaseProfile(firebaseUid: string, payload: Record<string, unknown>) {
    return request<BackendUser>(`/api/profile/firebase/${firebaseUid}`, {
      method: "PUT",
      body: payload,
    });
  },
  getDiscoverProfilesByFirebase(firebaseUid: string) {
    return request<BackendUser[]>(`/api/profile/firebase/discover/${firebaseUid}`);
  },
  getDiscoverProfiles(token: string) {
    return request<BackendUser[]>("/api/profile/discover", { token });
  },
  getTrips() {
    return request<{
      trips: {
        _id: string;
        destination: string;
        budgetRange?: string;
        tripType?: string;
        maxParticipants?: number;
        participants?: { _id: string; name: string }[];
      }[];
    }>("/api/trips");
  },
  createTrip(token: string, payload: Record<string, unknown>) {
    return request("/api/trips", {
      method: "POST",
      token,
      body: payload,
    });
  },
};
