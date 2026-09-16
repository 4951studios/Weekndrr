import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/Layout";
import SplashGate from "@/components/SplashGate";
import { SearchProvider } from "@/hooks/useSearch";
import { AuthProvider } from "@/hooks/useAuth";
import { listenForAppUrlOpen } from "@/lib/native";
import AuthScreen from "@/pages/AuthScreen";
import Home from "@/pages/Home";
import TripDetails from "@/pages/TripDetails";
import Checkout from "@/pages/Checkout";
import Confirmation from "@/pages/Confirmation";
import SavedTrips from "@/pages/SavedTrips";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// Auth email links open the native app via a custom URL scheme; route them to
// the matching in-app screen (with the original query/hash) once opened.
function DeepLinkHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribe;
    listenForAppUrlOpen((path) => navigate(path, { replace: true })).then(
      (fn) => (unsubscribe = fn)
    );
    return () => unsubscribe?.();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = location.hash || "";
    const isRecoveryLink =
      hash.includes("access_token") ||
      hash.includes("type=recovery") ||
      params.has("code") ||
      params.get("type") === "recovery";

    if (isRecoveryLink && location.pathname !== "/reset-password") {
      navigate(`/reset-password${location.search}${location.hash}`, {
        replace: true,
      });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DeepLinkHandler />
        <AuthProvider>
          <SearchProvider>
            <SplashGate>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/trip/:id" element={<TripDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route
                    path="/confirmation/:bookingId"
                    element={<Confirmation />}
                  />
                  <Route path="/saved" element={<SavedTrips />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="/signin"
                    element={<AuthScreen key="signin" mode="signin" />}
                  />
                  <Route
                    path="/signup"
                    element={<AuthScreen key="signup" mode="signup" />}
                  />
                  <Route
                    path="/reset-password"
                    element={<AuthScreen key="reset" mode="reset" />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </SplashGate>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
