import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/testMode";
import "./styles/app.css";
import { AuthProvider } from "./lib/auth";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toasts";
import { RequireAdmin, RequireAuth } from "./components/Guards";
import { Home } from "./pages/Home";
import { Rooms } from "./pages/Rooms";
import { RoomDetail } from "./pages/RoomDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Terms } from "./pages/Terms";
import { BookingWizard } from "./pages/BookingWizard";
import { MyBookings } from "./pages/MyBookings";
import { AdminRooms } from "./pages/AdminRooms";
import { AdminBookings } from "./pages/AdminBookings";
import { NotFound } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    // No silent retries or background refetches: what the test sees is what the API returned.
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                <Route
                  path="book/:number"
                  element={
                    <RequireAuth>
                      <BookingWizard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="my/bookings"
                  element={
                    <RequireAuth>
                      <MyBookings />
                    </RequireAuth>
                  }
                />
                <Route
                  path="admin/rooms"
                  element={
                    <RequireAdmin>
                      <AdminRooms />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="admin/bookings"
                  element={
                    <RequireAdmin>
                      <AdminBookings />
                    </RequireAdmin>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
