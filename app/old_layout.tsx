// app/_layout.tsx
import { listenToAuthChanges } from "@/services/authListener";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function RootLayoutContent() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const lastNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    // Set a timeout to avoid infinite loading
    const timeoutId = setTimeout(() => {
      if (checkingAuth) {
        console.warn('Auth check timeout - proceeding without authentication');
        setCheckingAuth(false);
        setInitialAuthCheck(true);
        
        // Only navigate if we're not already on a valid screen
        const currentRoute = segments[0];
        if (currentRoute === undefined || currentRoute === 'index') {
          router.replace('/');
        }
      }
    }, 10000); // 10 second timeout

    const unsubscribe = listenToAuthChanges((user, role, error) => {
      // Clear the timeout since auth check completed
      clearTimeout(timeoutId);
      
      // Auth check is complete
      setCheckingAuth(false);
      setInitialAuthCheck(true);
      
      if (error) {
        console.error('Auth listener error:', error);
        // Navigate to auth screen on error
        const currentRoute = segments[0];
        if (currentRoute !== '(auth)' && currentRoute !== 'index') {
          router.replace('/');
        }
        return;
      }

      // Generate navigation target based on auth state
      let targetRoute = '/';
      if (user && role) {
        targetRoute = role === 'passenger' 
          ? '/(passenger)/passengerScreen' 
          : '/(rider)/riderHome';
      }

      // Check if we're already on the correct screen to avoid unnecessary navigation
      const currentRoute = segments.join('/');
      const isAlreadyOnTarget = currentRoute === targetRoute.replace('/', '');
      
      // Avoid duplicate navigation to the same screen
      if (!isAlreadyOnTarget && lastNavigationRef.current !== targetRoute) {
        lastNavigationRef.current = targetRoute;
        
        // Use setTimeout to ensure navigation happens after React has committed
        setTimeout(() => {
          try {
            router.replace(targetRoute as any);
          } catch (navigationError) {
            console.error('Navigation error:', navigationError);
            // Fallback to home if navigation fails
            router.replace('/');
          }
        }, 0);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router, segments, checkingAuth]);

  // Show loading indicator only for initial auth check
  if (checkingAuth && !initialAuthCheck) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: darkMode ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#7500fc" />
        <Text style={{ 
          marginTop: 16, 
          color: darkMode ? "#fff" : "#666",
          fontSize: 16 
        }}>
          Checking authentication...
        </Text>
      </View>
    );
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