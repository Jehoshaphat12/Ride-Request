import CrossPlatformMap from "@/components/CrossPlatformMap";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { auth } from "@/lib/firebaseConfig";
import { addNotification } from "@/services/notifications";
import { notifyRideRequested, registerNotificationPermissions } from "@/services/NotificationService";
import { requestRide } from "@/services/rides";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Loader from "../Loader";

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
}

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme(); // Use the theme from context
  
  const [pickup, setPickup] = useState<LocationPoint | null>();
  const [destination, setDestination] = useState<LocationPoint | null>(null)
  const [loading, setLoading] = useState(false);
  const {location} = useCurrentLocation()
  const [profilePic, setProfilePic] = useState("")


  // Get user's Profile Picture
  useEffect(() => {
    const getProfilePic = async () => {
      const profile = await getUserProfile()
      if(!profile) return
      setProfilePic(profile.profilePicture)
    }
    getProfilePic()
  }, [])


  // Ride Request function
  const handleRequestRide = async () => {
    if (!pickup?.address.trim() || !destination?.address.trim()) {
      Alert.alert("Missing Info", "Please enter both pickup and destination.");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "Please sign in to request a ride");
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const passengerId = auth.currentUser.uid;

      const rideId = await requestRide(pickup, destination, passengerId);
      notifyRideRequested()
      await addNotification(
        passengerId,
        "ride_requested",
        "Your ride request has been sent.",
        "looking for a rider...",
        rideId
      )
      Alert.alert("Ride Requested", "Waiting for a rider to accept...");
      router.push({ 
        pathname: "/(passenger)/waitForRide", 
        params: { rideId } 
      });
      
    } catch (error: any) {
      console.error("Error requesting ride:", error);
      Alert.alert(
        "Error", 
        error.message || "Could not request ride. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Ask for notification permissions when the screen loads
  useEffect(() => {
    registerNotificationPermissions();
  }, []);

  

  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: theme.background }
    ]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[
          styles.header,
          { backgroundColor: theme.card }
        ]}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.iconWrapper,
                { backgroundColor: theme.card }
              ]}
              onPress={() => router.push("/(passenger)/notifications")}
            >
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconWrapper,
                { backgroundColor: theme.card }
              ]}
              onPress={() => router.push("/(passenger)/passengerSettings")}
            >
              <Image
                source={
                  profilePic
                    ? { uri: profilePic }
                    : require("../../assets/images/defaultUserImg.png")
                }
                style={styles.profilePic}
                contentFit="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Container - Takes most of the screen */}
        <View style={styles.mapContainer}>
          {/* <MapScreen /> */}
          {!location ? (
                    <Loader msg="Loading map..." />
                  ) : (
                    <CrossPlatformMap
                      latitude={location?.coords.latitude}
                      longitude={location?.coords.longitude}
                    />
                  )}
        </View>

        {/* Content Area - Fixed at the bottom */}
        <View style={[
          styles.content, 
          { backgroundColor: theme.background }
        ]}>
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Pickup & Destination Inputs */}
            <View style={styles.searchBox}>
              {/* Pickup */}
              <View style={[
                styles.searchContainer,
                { backgroundColor: theme.card }
              ]}>
                <Ionicons
                  name="locate-outline"
                  size={20}
                  color={theme.primary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.text }
                  ]}
                  value={pickup?.address}
                  onChangeText={(address) => setPickup({...pickup!, address})}
                  placeholder="Pickup location"
                  placeholderTextColor={theme.muted}
                  editable={!loading}
                />
              </View>

              {/* Destination */}
              <View style={[
                styles.searchContainer,
                { backgroundColor: theme.card }
              ]}>
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={theme.muted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.text }
                  ]}
                  value={destination?.address}
                  onChangeText={(address) => setDestination({...destination!, address})}
                  placeholder="Enter destination"
                  placeholderTextColor={theme.muted}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Request Ride Button */}
            <TouchableOpacity
              onPress={handleRequestRide}
              style={[
                styles.rideButton,
                { backgroundColor: theme.primary },
                loading && styles.rideButtonDisabled
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text style={[styles.rideButtonText, { color: theme.primaryText }]}>
                  Request Ride
                </Text>
              )}
            </TouchableOpacity>

            {/* Rider info / shortcuts */}
            <View style={[
              styles.infoSection,
              { borderColor: theme.border }
            ]}>
              <TouchableOpacity
                onPress={() => router.push("/(passenger)/rideHistory")}
                style={[
                  styles.historyButton,
                  { borderColor: theme.primary }
                ]}
                disabled={loading}
              >
                <Text style={[
                  styles.historyButtonText,
                  { color: theme.primary }
                ]}>
                  View Ride History
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 45,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mapContainer: {
    flex: 1, // Takes all available space
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  scrollContent: {
    paddingTop: 20,
  },
  searchBox: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  rideButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#7500fc",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  rideButtonDisabled: {
    opacity: 0.7,
  },
  rideButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  historyButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  map: {
      width: Dimensions.get("window").width,
      height: Dimensions.get("window").height,
    },
});