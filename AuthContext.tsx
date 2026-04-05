import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { backendApi, BackendUser } from "../services/backend";
import { readJson, removeKeys, writeJson } from "../utils/storage";

const AUTH_STORAGE_KEY = "roamio.auth.session";

type AuthSession = {
  token: string;
  user: BackendUser;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: BackendUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (user: BackendUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function buildBackendSession(firebaseUser: FirebaseUser) {
  const email = firebaseUser.email?.trim();
  if (!email) {
    throw new Error("Firebase user is missing an email address.");
  }

  const session = await backendApi.firebaseSession({
    firebaseUid: firebaseUser.uid,
    email,
    name: firebaseUser.displayName || email.split("@")[0],
  });

  const loginState = await backendApi.recordGamificationAction(session.token, "daily_login").catch(() => null);
  return {
    token: session.token,
    user: loginState?.user || session.user,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (!firebaseUser) {
        setUser(null);
        setToken(null);
        await removeKeys([AUTH_STORAGE_KEY]);
        setLoading(false);
        return;
      }

      try {
        const session = await buildBackendSession(firebaseUser);
        if (!mounted) return;
        setToken(session.token);
        setUser(session.user);
        await writeJson(AUTH_STORAGE_KEY, session);
      } catch {
        const cached = await readJson<AuthSession | null>(AUTH_STORAGE_KEY, null);
        if (!mounted) return;
        if (cached?.token) {
          setToken(cached.token);
          setUser(cached.user);
        } else {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
        const session = await buildBackendSession(credentials.user);
        setToken(session.token);
        setUser(session.user);
        await writeJson(AUTH_STORAGE_KEY, session);
      },
      async register(payload) {
        const credentials = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
        if (payload.name.trim()) {
          await updateProfile(credentials.user, { displayName: payload.name.trim() });
        }
        const session = await buildBackendSession({
          ...credentials.user,
          displayName: payload.name.trim() || credentials.user.displayName,
        } as FirebaseUser);
        setToken(session.token);
        setUser(session.user);
        await writeJson(AUTH_STORAGE_KEY, session);
      },
      async logout() {
        await signOut(auth);
        setToken(null);
        setUser(null);
        await removeKeys([AUTH_STORAGE_KEY]);
      },
      async refreshProfile() {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const session = await buildBackendSession(firebaseUser);
        setToken(session.token);
        setUser(session.user);
        await writeJson(AUTH_STORAGE_KEY, session);
      },
      updateUser(nextUser) {
        setUser(nextUser);
        if (token) {
          void writeJson(AUTH_STORAGE_KEY, { token, user: nextUser });
        }
      },
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
