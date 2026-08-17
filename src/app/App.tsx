// =====================================================================
// APP — top-level routing map for the whole site.
// This is where every URL is wired to the page component that
// renders it, and where all the app-wide context providers
// (auth, dark mode, events, donations, notifications, job board)
// are stacked around the app once.
// =====================================================================

// -- React & routing ---------------------------------------------------
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// -- Third-party UI library (Material UI theme bridge) ----------------
import { ThemeProvider, createTheme } from "@mui/material/styles";

// -- Pages (one per route, see <Routes> below) -------------------------
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import AdminDashboard from "./components/AdminDashboard";
import AlumniDashboard from "./components/AlumniDashboard";
import UserDashboard from "./components/UserDashboard";
import RepresentativeDashboard from "./components/RepresentativeDashboard";

// -- App-wide context providers (wrap the whole app, see bottom of file) -
import { AuthProvider, useAuth } from "./components/AuthContext";
import { DarkModeProvider, useDarkMode } from "./components/shared/DarkModeContext";
import { EventsProvider } from "./components/shared/EventsContext";
import { DonationProvider } from "./components/shared/DonationContext";
import { NotificationProvider } from "./components/shared/NotificationContext";
import { JobBoardProvider } from "./components/shared/JobBoardContext";
import { AnnouncementProvider } from "./components/shared/AnnouncementContext";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, loading } = useAuth();

  // Accounts now come from Supabase, so restoring a session on page
  // load is an async check — wait for it instead of redirecting to
  // /login while it's still in flight.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Bridges our app-wide dark mode toggle into MUI's own theming system,
// so MUI components (TextField, Select, Chip, Card, Button, etc.) switch
// palettes instead of staying stuck on MUI's light-mode defaults.
function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const { dark } = useDarkMode();
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: dark ? "dark" : "light",
          ...(dark && {
            background: { default: "#0d1117", paper: "#1a2332" },
          }),
        },
      }),
    [dark]
  );
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <DarkModeProvider>
      <MuiThemeBridge>
      <EventsProvider>
      <DonationProvider>
      <NotificationProvider>
      <JobBoardProvider>
      <AnnouncementProvider>
        <Routes>
          {/* -- Public / auth routes -- */}
          <Route path="/login" element={<AuthPage initialMode="signin" />} />
          <Route path="/register" element={<AuthPage initialMode="signup" />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl mb-4">
                    Unauthorized Access
                  </h1>
                  <p className="text-gray-600">
                    You don't have permission to access this
                    page.
                  </p>
                </div>
              </div>
            }
          />
          {/* -- Role-protected dashboards (each has its own header color, see that file) -- */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumni/*"
            element={
              <ProtectedRoute allowedRoles={["alumni"]}>
                <AlumniDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/*"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/representative/*"
            element={
              <ProtectedRoute allowedRoles={["representative"]}>
                <RepresentativeDashboard />
              </ProtectedRoute>
            }
          />
          {/* -- Public marketing site (its own header lives inside LandingPage.tsx) -- */}
          <Route
            path="/"
            element={<LandingPage />}
          />
        </Routes>
      </AnnouncementProvider>
      </JobBoardProvider>
      </NotificationProvider>
      </DonationProvider>
      </EventsProvider>
      </MuiThemeBridge>
      </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}