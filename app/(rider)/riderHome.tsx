import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
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
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RiderHomeScreen() {
  const [status, setStatus] = useState<"online" | "offline">("offline");
  const { darkMode } = useTheme(); // Changed from theme to darkMode for consistency
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);


  useEffect(() => {
      const checkProfile = async () => {
        try {
          const profile = await getUserProfile();
  
          if (!profile) return; // safety check
  
          if (profile.onboardingStatus === "incomplete") {
            router.replace("/(rider)/OnboardingScreen2");
          } else if (profile.onboardingStatus === "approved") {
            router.replace("/(rider)/riderHome");
          } else {
            // still pending → stay on WaitingScreen
            setLoading(false);
          }
        } catch (err) {
          console.error("Error checking profile:", err);
          setLoading(false);
        }
      };
  
      checkProfile();
    }, [router]);

  // Update rider online status in Firestore
  useEffect(() => {
    const updateRiderStatus = async () => {
      if (!auth.currentUser) return;

      
      
      setUpdatingStatus(true);
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          isOnline: status === "online",
          lastOnline: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating rider status:", error);
        Alert.alert("Error", "Failed to update status");
      } finally {
        setUpdatingStatus(false);
      }
    };

    updateRiderStatus();
  }, [status]);

  // Listen for ride requests when online
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (status === "online") {
      const q = query(
        collection(db, "rides"),
        where("status", "==", "pending"),
        limit(1)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setRideRequest({ 
            id: doc.id, 
            ...doc.data(),
            // Add timestamp for UI
            receivedAt: new Date().toLocaleTimeString()
          });
        } else {
          setRideRequest(null);
        }
      }, (error) => {
        console.error("Error listening to ride requests:", error);
        Alert.alert("Error", "Failed to load ride requests");
      });

    } else {
      setRideRequest(null);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [status]);

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
          vehicle: riderData.vehicle || {
            model: "Unknown Model",
            color: "Unknown Color",
            plateNumber: "Unknown Plate",
          },
        },
        acceptedAt: serverTimestamp(),
        // Remove from pending queries
        // ... other fields you might want to update
      });

      Alert.alert("Ride Accepted", "You've accepted the ride request! 🚗");
      
      // Navigate to ride in progress screen or show directions
      router.push({
        pathname: "/(rider)/riderRideProgress",
        params: { rideId: rideRequest.id }
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
    // You might want to implement a proper ignore system
    // that prevents the same ride from showing up again immediately
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? "#000" : "#fff" }]}>
      
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.headerRight}>
          {/* Requests button */}
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push("/(rider)/requestedRide")}
          >
            <Ionicons name="list-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push("/(rider)/OnboardingScreen2")}
          >
            <Ionicons name="notifications-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push("/(rider)/riderProfileSettings")}
          >
            <Image
              source={
                auth.currentUser?.photoURL 
                  ? { uri: auth.currentUser.photoURL }
                  : require("../../assets/images/defaultUserImg2.png")
              }
              style={styles.profilePic}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={{ color: darkMode ? "#ccc" : "#666", fontSize: 20 }}>
          {status === "online" ? "🛵 Looking for rides..." : "📍 Map will be here"}
        </Text>
      </View>

      {/* Status Toggle */}
      <View style={[styles.statusContainer, { backgroundColor: darkMode ? "#1c1c1e" : "#fff" }]}>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              status === "online" && styles.radioSelected,
              updatingStatus && styles.radioDisabled
            ]}
            onPress={() => setStatus("online")}
            disabled={updatingStatus}
          >
            {updatingStatus && status === "online" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.radioText,
                status === "online" && styles.radioTextSelected,
              ]}>
                Online
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              status === "offline" && styles.radioSelected,
              updatingStatus && styles.radioDisabled
            ]}
            onPress={() => setStatus("offline")}
            disabled={updatingStatus}
          >
            {updatingStatus && status === "offline" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.radioText,
                status === "offline" && styles.radioTextSelected,
              ]}>
                Offline
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Indicator */}
        <Text style={[styles.statusText, { color: darkMode ? "#ccc" : "#666" }]}>
          {status === "online" ? "✅ Accepting ride requests" : "⏸️ Offline - not accepting rides"}
        </Text>

        {/* Ride Request Card */}
        {status === "online" && rideRequest && (
          <View style={[styles.card, { backgroundColor: darkMode ? "#2c2c2e" : "#fff" }]}>
            <Text style={[styles.cardTitle, { color: darkMode ? "#fff" : "#000" }]}>
              🚖 New Ride Request
            </Text>
            <Text style={[styles.cardTime, { color: darkMode ? "#ccc" : "#666" }]}>
              Received at {rideRequest.receivedAt}
            </Text>

            <View style={styles.row}>
              <Ionicons name="location-outline" size={20} color="#7500fc" />
              <Text style={[styles.label, { color: darkMode ? "#fff" : "#333" }]}>Pickup:</Text>
              <Text style={[styles.value, { color: darkMode ? "#ccc" : "#444" }]} numberOfLines={2}>
                {rideRequest.pickup || "Current location"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="flag-outline" size={20} color="#7500fc" />
              <Text style={[styles.label, { color: darkMode ? "#fff" : "#333" }]}>Destination:</Text>
              <Text style={[styles.value, { color: darkMode ? "#ccc" : "#444" }]} numberOfLines={2}>
                {rideRequest.dropoff || "Unknown destination"}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.ignoreBtn, { borderColor: darkMode ? "#555" : "#ccc" }]}
                onPress={ignoreRide}
                disabled={loading}
              >
                <Text style={[styles.ignoreText, { color: darkMode ? "#ccc" : "#666" }]}>
                  Ignore
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptBtn, loading && styles.acceptBtnDisabled]}
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
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 8,
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
    backgroundColor: "transparent",
  },
  logo: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  profilePic: { 
    width: 36, 
    height: 36, 
    borderRadius: 18 
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
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
    borderColor: "#7500fc",
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
    backgroundColor: "#7500fc",
  },
  radioDisabled: {
    opacity: 0.6,
  },
  radioText: {
    fontSize: 16,
    color: "#7500fc",
    fontWeight: "600",
  },
  radioTextSelected: {
    color: "#fff",
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
    flexWrap: 'wrap',
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
    backgroundColor: "#28a745",
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