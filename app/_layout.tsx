// app/_layout.tsx
import { listenToAuthChanges } from "@/services/authListener";
import { getUserProfile } from "@/services/users";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import Loader from "./Loader";

function RootLayoutContent() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const lastNavigationRef = useRef<string | null>(null);
  const authListenerInitialized = useRef(false);

  const checkProfileAndNavigate = async (user: any, role: string | null) => {
  try {
    if (!user || !role) {
      router.replace('/'); // or router.replace('/(auth)/login')
      return;
    }

    const profile = await getUserProfile();

    if (!profile) {
      console.error("No profile found for authenticated user");
      router.replace('/'); 
      return;
    }

    let targetRoute = '/';

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

    // Current route string from expo-router segments
    const currentRoute = "/" + segments.join("/");

    // Only navigate if not already there
    if (currentRoute !== targetRoute && lastNavigationRef.current !== targetRoute) {
      lastNavigationRef.current = targetRoute;
      router.replace(targetRoute as any);
    }
  } catch (err) {
    console.error("Error checking profile:", err);
    router.replace('/'); 
  }
};


  useEffect(() => {
    // Prevent multiple listeners in development with Fast Refresh
    if (authListenerInitialized.current) {
      return;
    }
    authListenerInitialized.current = true;

    // Set a timeout to avoid infinite loading
    const timeoutId = setTimeout(() => {
      if (checkingAuth) {
        console.warn('Auth check timeout - proceeding without authentication');
        setCheckingAuth(false);
        setInitialAuthCheck(true);
        
        const currentRoute = segments[0];
        if (currentRoute === undefined && currentRoute === 'index') {
          router.replace('/');
        }
      }
    }, 10000); // 10 second timeout

    const unsubscribe = listenToAuthChanges(async (user, role) => {
      // Clear the timeout since auth check completed
      clearTimeout(timeoutId);
      
      // Auth check is complete
      setCheckingAuth(false);
      setInitialAuthCheck(true);
      
      if (!user) {
        // No user, go to auth screen
        const currentRoute = segments[0];
        if (currentRoute !== '(auth)' && currentRoute !== "(auth) 2") {
          router.replace('/');
        }
        return;
      }

      // User is authenticated, check profile and navigate accordingly
      await checkProfileAndNavigate(user, role);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      authListenerInitialized.current = false;
    };
  }, [router, segments]);

  // Show loading indicator only for initial auth check
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
    </ThemeProvider>
  );
}