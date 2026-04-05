import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import SOSButton from "./components/SOSButton";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import IntroSplash from "./pages/IntroSplash";
import { AppDataProvider } from "./contexts/AppDataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import "./styles/layout.css";
import { applyStateTheme } from "./theme/stateTheme";
import { useAppData } from "./contexts/AppDataContext";

const Home = lazy(() => import("./pages/Home"));
const Arena = lazy(() => import("./pages/Arena"));
const Explore = lazy(() => import("./pages/Explore"));
const Friends = lazy(() => import("./pages/Friends"));
const Blends = lazy(() => import("./pages/Blends"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const Security = lazy(() => import("./pages/Security"));
const Settings = lazy(() => import("./pages/Settings"));
const EmergencyContacts = lazy(() => import("./pages/EmergencyContacts"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

function ThemeSync({ mode }) {
  const { profile, destinations } = useAppData();

  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("roamio-last-state") || "null");
    const selected = localStorage.getItem("roamio-selected-state") === "true";
    if (!selected) {
      applyStateTheme("", mode);
      return;
    }

    const destinationName = savedState || profile?.destination || "";
    const matched =
      destinations.find(
        (place) => place.name.toLowerCase() === destinationName.toLowerCase()
      ) || null;
    const state = matched?.state || destinationName;
    localStorage.setItem("roamio-last-state", JSON.stringify(state || ""));
    applyStateTheme(state, mode);
  }, [profile?.destination, destinations, mode]);

  return null;
}

function DashboardLayout({
  isSidebarOpen,
  onSidebarToggle,
  onSidebarClose,
  theme,
  onThemeToggle,
  isMobile,
}) {
  return (
    <div className={`dashboard-shell ${isSidebarOpen ? "sidebar-open" : "sidebar-collapsed-shell"}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={onSidebarToggle}
        onClose={onSidebarClose}
        isMobile={isMobile}
      />

      {isMobile && isSidebarOpen && (
        <button className="sidebar-backdrop" onClick={onSidebarClose} />
      )}

      <div className="dashboard-main">
        <Navbar
          isMobile={isMobile}
        />

        <div className="dashboard-content">
          <Suspense fallback={<div className="screen-loader">Loading page...</div>}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="arena" element={<Arena />} />
              <Route path="explore" element={<Explore />} />
              <Route path="friends" element={<Friends />} />
              <Route path="blends" element={<Blends />} />
              <Route path="chat" element={<Chat />} />
              <Route path="profile" element={<Profile />} />
              <Route path="security" element={<Security />} />
              <Route path="emergency-contacts" element={<EmergencyContacts />} />
              <Route
                path="settings"
                element={<Settings theme={theme} onThemeToggle={onThemeToggle} />}
              />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </Suspense>
        </div>
        <SOSButton />
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("roamio-theme") || "light");

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 980 : false
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const storedValue = localStorage.getItem("roamio-sidebar-open");
    return storedValue === null ? true : storedValue === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("roamio-theme", theme);
    const selected = localStorage.getItem("roamio-selected-state") === "true";
    const stateValue = selected
      ? (JSON.parse(localStorage.getItem("roamio-last-state")) || "").toString()
      : "";
    applyStateTheme(stateValue, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("roamio-sidebar-open", String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 980;
      setIsMobile(mobile);

      if (mobile) {
        setIsSidebarOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppDataProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="screen-loader">Loading Roamio...</div>}>
              <Routes>

                {/* Intro Splash → Landing Page */}
                <Route path="/" element={<IntroSplash />} />

                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected App */}
                <Route
                  path="/app/*"
                  element={
                    <ProtectedRoute>
                      <>
                        <ThemeSync mode={theme} />
                        <DashboardLayout
                          isSidebarOpen={isSidebarOpen}
                          onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
                          onSidebarClose={() => setIsSidebarOpen(false)}
                          theme={theme}
                          onThemeToggle={() =>
                            setTheme((current) => (current === "light" ? "dark" : "light"))
                          }
                          isMobile={isMobile}
                        />
                      </>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppDataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
