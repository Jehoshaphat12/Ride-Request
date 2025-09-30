// app/_layout.tsx
import { listenToAuthChanges } from "@/services/authListener";
import { getUserProfile } from "@/services/users";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import Loader from "./Loader";

function RootLayoutContent() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);

  // Use a ref to track the current navigation "ticket"
  const navigationTicketRef = useRef(0);
  const authListenerInitialized = useRef(false);

  const checkProfileAndNavigate = async (user: any, role: string | null, ticket: number) => {
    // Only proceed if this is the most recent navigation request
    if (ticket !== navigationTicketRef.current) {
      console.log("Cancelling stale navigation request");
      return;
    }

    try {
      if (!user || !role) {
        router.replace("/");
        return;
      }

      const profile = await getUserProfile();
      if (!profile) {
        console.error("No profile found for authenticated user");
        router.replace("/");
        return;
      }

      let targetRoute = "/";

      if (profile.role === "rider") {
        if (profile.onboardingStatus === "pending") {
          targetRoute = "/(rider)/waitingScreen";
        } else if (profile.onboardingStatus === "incomplete") {
          targetRoute = "/(rider)/OnboardingScreen2";
        } else if (profile.onboardingStatus === "approved") {
          targetRoute = "/(rider)/riderHome";
        }
      } else if (profile.role === "passenger") {
        targetRoute = "/(passenger)/passengerScreen";
      }

      // Check ticket again right before navigating
      if (ticket === navigationTicketRef.current) {
        router.replace(targetRoute as any);
      }
    } catch (err) {
      console.error("Error checking profile:", err);
      // Check ticket again right before navigating
      if (ticket === navigationTicketRef.current) {
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    if (authListenerInitialized.current) return;
    authListenerInitialized.current = true;

    const timeoutId = setTimeout(() => {
      if (checkingAuth) {
        console.warn("Auth check timeout - proceeding without authentication");
        setCheckingAuth(false);
        setInitialAuthCheck(true);
        // Increment the ticket for the timeout navigation
        navigationTicketRef.current++;
        router.replace("/");
      }
    }, 10000);

    const unsubscribe = listenToAuthChanges(async (user, role) => {
      clearTimeout(timeoutId);

      setCheckingAuth(false);
      setInitialAuthCheck(true);

      // Increment the ticket and get the new value for THIS auth change
      navigationTicketRef.current++;
      const currentTicket = navigationTicketRef.current;

      // Introduce a small delay to batch rapid successive changes
      // This is a form of debouncing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if we are still the most recent ticket after the delay
      if (currentTicket !== navigationTicketRef.current) {
        return; // A newer auth change happened, abort.
      }

      if (!user) {
        router.replace("/");
        return;
      }

      await checkProfileAndNavigate(user, role, currentTicket);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      authListenerInitialized.current = false;
    };
  }, []);

  if (checkingAuth && !initialAuthCheck) {
    return <Loader msg="Loading..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
      <Toast />
    </ThemeProvider>
  );
}