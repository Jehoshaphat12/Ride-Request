import CrossPlatformMap from "@/components/CrossPlatformMap";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { listenToRideUpdates } from "@/hooks/useRideListener";
import { auth, db } from "@/lib/firebaseConfig";
import { addNotification } from "@/services/notifications";
import { updateRiderLocation } from "@/services/rides";
import { sendPushNotification } from "@/services/sendPushNotification";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Loader from "../Loader";

export default function RiderHomeScreen() {
  const [status, setStatus] = useState<"online" | "offline">("offline");
  const { theme, darkMode } = useTheme(); // Get theme from context
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { location } = useCurrentLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check profile on mount to see if we should be on this screen
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (!profile) return;

        setProfilePic(profile.profilePicture);

        // Only navigate if we need to LEAVE the current screen
        if (profile.onboardingStatus === "incomplete") {
          router.replace("/(rider)/OnboardingScreen2");
        } else if (profile.onboardingStatus === "pending") {
          router.replace("/(rider)/waitingScreen");
        }
        // If status is "approved", stay here (no navigation)
        setLoading(false);
      } catch (err) {
        console.error("Error checking profile:", err);
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  // Listen for ride requests when online
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (status === "online") {
      const q = query(
        collection(db, "rides"),
        where("status", "==", "pending"),
        limit(1)
      );

      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setRideRequest({
              id: doc.id,
              ...doc.data(),
              // Add timestamp for UI
              receivedAt: new Date().toLocaleTimeString(),
            });
            // 🔔 Notify Rider
            await addNotification(
              auth.currentUser!.uid,
              "ride_request",
              "New Ride Request 🚖",
              "A passenger is requesting a ride near your area",
              rideRequest?.uid
            );
          } else {
            setRideRequest(null);
          }
        },
        (error) => {
          console.error("Error listening to ride requests:", error);
          Alert.alert("Error", "Failed to load ride requests");
        }
      );
    } else {
      setRideRequest(null);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [status]);

  // Alert Rider of ride updates
  useEffect(() => {
    if (rideRequest) {
      const unsub = listenToRideUpdates(rideRequest.id, "rider");
      return () => unsub();
    }
  }, [rideRequest]);

  const acceptRide = async () => {
    if (!rideRequest) return;

    setLoading(true);
    try {
      const rider = auth.currentUser;
      if (!rider) throw new Error("No rider logged in");

      // Get rider details from Firestore
      const riderDoc = await getDoc(doc(db, "users", rider.uid));
      if (!riderDoc.exists()) throw new Error("Rider profile not found");

      const riderData = riderDoc.data();

      // Update the ride with rider information
      await updateDoc(doc(db, "rides", rideRequest.id), {
        status: "accepted",
        riderId: rider.uid,
        riderInfo: {
          name: riderData.name || riderData.userName || "Rider",
          phone: riderData.phone || null,
          profilePicture: riderData.profilePicture || null,
          rating: riderData.rating,
          totalRides: riderData.totalRides,
          vehicle: riderData.vehicle || {
            model: "Unknown Model",
            color: "Unknown Color",
            plateNumber: "Unknown Plate",
          },
        },
        acceptedAt: serverTimestamp(),
      });

      const passengerDoc = await getDoc(
        doc(db, "users", rideRequest.passengerId)
      );
      if (passengerDoc.exists()) {
        const passengerData = passengerDoc.data();

        // Send push notification if passenger has a token
        if (passengerData.expoPushToken) {
          await sendPushNotification(
            passengerData.expoPushToken,
            "Ride Accepted",
            `${riderData.userName || "Your rider"} is on the way!`
          );
        }
      }

      await updateRiderLocation(
        rideRequest.id,
        location?.coords.latitude!,
        location?.coords.longitude!
      );
      // Optionally, notify the rider too
      await addNotification(
        rider.uid!,
        "ride_accepted",
        "Ride Accepted ✅",
        "You are now assigned to a passenger",
        rideRequest.id
      );

      Alert.alert("Ride Accepted", "You've accepted the ride request! 🚗");

      // Navigate to ride in progress screen or show directions
      router.push({
        pathname: "/(rider)/riderRideProgress",
        params: { rideId: rideRequest.id },
      });
    } catch (error: any) {
      console.error("Error accepting ride:", error);
      Alert.alert("Error", error.message || "Failed to accept ride");
    } finally {
      setLoading(false);
    }
  };

  const ignoreRide = () => {
    setRideRequest(null);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.card }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.headerRight}>
          {/* Requests button */}
          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/requestedRide")}
          >
            <Ionicons name="list-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/riderProfileSettings")}
          >
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require("../../assets/images/defaultUserImg2.png")
              }
              style={styles.profilePic}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
        {/* <Text style={[styles.mapText, { color: theme.text }]}>
          🗺 Map View
        </Text> */}

        {!location || !mounted ? (
          <Loader msg="Loading map..." />
        ) : (
          <CrossPlatformMap
            latitude={location?.coords.latitude}
            longitude={location?.coords.longitude}
          />
        )}

        {/* Keeps rider’s location updating in Firestore */}
        {/* <RiderLocationUpdater rideId={rideRequest} /> */}
      </View>

      {/* Status Toggle */}
      <View style={[styles.statusContainer, { backgroundColor: theme.card }]}>
        <View style={[styles.radioGroup, { borderColor: theme.primary }]}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              status === "online" && [
                styles.radioSelected,
                { backgroundColor: theme.primary },
              ],
              updatingStatus && styles.radioDisabled,
            ]}
            onPress={() => {
              if (!updatingStatus) {
                setStatus("online");
              }
            }}
            disabled={updatingStatus}
          >
            {updatingStatus && status === "online" ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <Text
                style={[
                  styles.radioText,
                  status === "online"
                    ? { color: theme.primaryText }
                    : { color: theme.primary },
                ]}
              >
                Online
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              status === "offline" && [
                styles.radioSelected,
                { backgroundColor: theme.primary },
              ],
              updatingStatus && styles.radioDisabled,
            ]}
            onPress={() => {
              if (!updatingStatus) {
                setStatus("offline");
              }
            }}
            disabled={updatingStatus}
          >
            {updatingStatus && status === "offline" ? (
              <ActivityIndicator size="small" color={theme.primaryText} />
            ) : (
              <Text
                style={[
                  styles.radioText,
                  status === "offline"
                    ? { color: theme.primaryText }
                    : { color: theme.primary },
                ]}
              >
                Offline
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Indicator */}
        <Text style={[styles.statusText, { color: theme.muted }]}>
          {status === "online"
            ? "✅ Accepting ride requests"
            : "⏸️ Offline - not accepting rides"}
        </Text>

        {/* Ride Request Card */}
        {status === "online" && rideRequest && (
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              🚖 New Ride Request
            </Text>
            <Text style={[styles.cardTime, { color: theme.muted }]}>
              Received at {rideRequest.receivedAt}
            </Text>

            <View style={styles.row}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.label, { color: theme.muted }]}>
                Pickup:
              </Text>
              <Text
                style={[styles.value, { color: theme.text }]}
                numberOfLines={2}
              >
                {rideRequest.pickup?.address || "Current location"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>
                Destination:
              </Text>
              <Text
                style={[styles.value, { color: theme.text }]}
                numberOfLines={2}
              >
                {rideRequest.dropoff?.address || "Unknown destination"}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.ignoreBtn, { borderColor: theme.border }]}
                onPress={ignoreRide}
                disabled={loading}
              >
                <Text style={[styles.ignoreText, { color: theme.muted }]}>
                  Ignore
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.acceptBtn,
                  { backgroundColor: theme.success },
                  loading && styles.acceptBtnDisabled,
                ]}
                onPress={acceptRide}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.acceptText}>Accept Ride</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 45,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusContainer: {
    padding: 20,
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
        elevation: 8,
      },
    }),
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 30,
    padding: 4,
    marginBottom: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    // backgroundColor is set dynamically
  },
  radioDisabled: {
    opacity: 0.6,
  },
  radioText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  ignoreBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  ignoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptBtnDisabled: {
    opacity: 0.7,
  },
  acceptText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
