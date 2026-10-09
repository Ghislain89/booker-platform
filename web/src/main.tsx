import { ReactElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/testMode";
import "./styles/app.css";
import { loadFlags } from "./lib/flags";
import { AuthProvider } from "./lib/auth";
import { EventsProvider } from "./lib/events";
import { PreferencesProvider } from "./lib/preferences";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toasts";
import { RequireAdmin, RequireAuth } from "./components/Guards";
import { Home } from "./pages/Home";
import { Rooms } from "./pages/Rooms";
import { RoomDetail } from "./pages/RoomDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Terms } from "./pages/Terms";
import { Contact } from "./pages/Contact";
import { BookingWizard } from "./pages/BookingWizard";
import { MyBookings } from "./pages/MyBookings";
import { MyMessages } from "./pages/MyMessages";
import { Profile } from "./pages/Profile";
import { AdminRooms } from "./pages/AdminRooms";
import { AdminBookings } from "./pages/AdminBookings";
import { AdminMessages } from "./pages/AdminMessages";
import { AdminReports } from "./pages/AdminReports";
import { AdminBranding } from "./pages/AdminBranding";
import { Trainer } from "./pages/Trainer";
import { NotFound } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    // No silent retries or background refetches: what the test sees is what the API returned.
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

const auth = (page: ReactElement) => <RequireAuth>{page}</RequireAuth>;
const admin = (page: ReactElement) => <RequireAdmin>{page}</RequireAdmin>;

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <AuthProvider>
            <EventsProvider>
              <ToastProvider>
                <BrowserRouter>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="rooms" element={<Rooms />} />
                      <Route path="rooms/:number" element={<RoomDetail />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="book/:number" element={auth(<BookingWizard />)} />
                      <Route path="my/bookings" element={auth(<MyBookings />)} />
                      <Route path="my/messages" element={auth(<MyMessages />)} />
                      <Route path="my/profile" element={auth(<Profile />)} />
                      <Route path="admin/rooms" element={admin(<AdminRooms />)} />
                      <Route path="admin/bookings" element={admin(<AdminBookings />)} />
                      <Route path="admin/messages" element={admin(<AdminMessages />)} />
                      <Route path="admin/reports" element={admin(<AdminReports />)} />
                      <Route path="admin/branding" element={admin(<AdminBranding />)} />
                      <Route path="__trainer" element={<Trainer />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </ToastProvider>
            </EventsProvider>
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

// Flags first: some of them change how the UI renders (see /__trainer).
loadFlags().then(() =>
  createRoot(document.getElementById("root")!).render(<App />),
);
