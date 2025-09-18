import { db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WaitForRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = Array.isArray(params.rideId)
    ? params.rideId[0]
    : params.rideId;

  const [ride, setRide] = useState<any | null>(null);
  const [rider, setRider] = useState<any | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) {
      setError("Ride ID is missing");
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "rides", rideId),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRide(data);
          setStatus(data.status);

          

          // Fetch rider details if assigned
          if (data.riderId) {
            try {
              const riderSnap = await getDoc(doc(db, "users", data.riderId));
              if (riderSnap.exists()) {
                setRider(riderSnap.data());
              }
            } catch (error) {
              console.error("Error fetching rider:", error);
            }
          }


          // navigate to rideInProgress Screen
          if (data.status === "picked_up") {
            router.replace({
              pathname: "/(passenger)/rideProgress",
              params: { rideId: rideId },
            });
          }

          // If ride is completed or cancelled, navigate back after a delay
          if (data.status === "completed" || data.status === "cancelled") {
            setTimeout(() => {
              router.replace("/(passenger)/passengerScreen");
            }, 3000);
          }
        } else {
          setError("Ride not found");
          setTimeout(() => {
            router.back();
          }, 2000);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to ride:", error);
        setError("Failed to load ride details");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [rideId]);

  const cancelRide = async () => {
    if (!rideId) return;

    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "rides", rideId), {
              status: "cancelled",
              cancelledAt: serverTimestamp(),
              cancelledBy: "passenger",
            });
            // Don't navigate immediately - let the listener handle it
          } catch (error) {
            Alert.alert("Error", "Failed to cancel ride");
          }
        },
      },
    ]);
  };

  const callDriver = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Error", "Could not make phone call");
    });
  };

  const openMaps = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Could not open maps");
    });
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7500fc" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          {status === "pending"
            ? "🔍 Searching for drivers..."
            : status === "accepted"
            ? "🚗 Driver on the way"
            : "🗺 Map Loading..."}
        </Text>
      </View>

      {/* PENDING STATE */}
      {status === "pending" && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#7500fc" />
          <Text style={styles.title}>Looking for a Rider...</Text>
          <Text style={styles.subtitle}>
            We're finding the best driver for you
          </Text>

          {/* Ride Details */}
          <View style={styles.details}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => ride?.pickup && openMaps(ride.pickup)}
            >
              <Ionicons name="location-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Pickup:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {ride?.pickup?.address || ride?.pickup || "Current location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => ride?.destination && openMaps(ride.destination)}
            >
              <Ionicons name="flag-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {ride?.destination?.address || ride?.dropoff || "Loading..."}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Ride Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRide}>
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACCEPTED STATE */}
      {status === "accepted" && ride && (
        <View style={styles.card}>
          {/* Driver Header */}
          <View style={styles.sectionHeader}>
            <Ionicons name="car-sport" size={24} color="#7500fc" />
            <Text style={styles.sectionTitle}>Driver Assigned</Text>
          </View>

          {/* Driver Row */}
          <View style={styles.driverRow}>
            <Image
              source={
                ride.riderInfo?.profilePicture || rider?.profilePicture
                  ? {
                      uri:
                        ride.riderInfo?.profilePicture || rider?.profilePicture,
                    }
                  : require("../../assets/images/defaultUserImg.png")
              }
              style={styles.driverPic}
              contentFit="cover"
            />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {ride.riderInfo?.name || rider?.name || "Driver"}
              </Text>
              <Text style={styles.driverRating}>
                ⭐ {rider?.rating?.toFixed(1) || "4.8"} (
                {rider?.totalRides || "200"} rides)
              </Text>
            </View>
            {ride.riderInfo?.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callDriver(ride.riderInfo.phone)}
              >
                <Ionicons name="call-outline" size={28} color="#7500fc" />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Ionicons name="car-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Vehicle:</Text>
              <Text style={styles.value}>
                {ride.riderInfo?.vehicle?.model ||
                  rider?.vehicle?.model ||
                  "Not available"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="pricetag-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Color:</Text>
              <Text style={styles.value}>
                {ride.riderInfo?.vehicle?.color ||
                  rider?.vehicle?.color ||
                  "N/A"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="document-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Plate:</Text>
              <Text style={styles.value}>
                {ride.riderInfo?.vehicle?.plateNumber ||
                  rider?.vehicle?.plateNumber ||
                  "Not available"}
              </Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="navigate" size={20} color="#7500fc" />
              <Text style={styles.sectionTitle}>Trip Details</Text>
            </View>

            <TouchableOpacity
              style={styles.row}
              onPress={() => openMaps(ride.pickup?.address || ride.pickup)}
            >
              <Ionicons name="location-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Pickup:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {ride.pickup?.address || ride.pickup}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                openMaps(ride.destination?.address || ride.dropoff)
              }
            >
              <Ionicons name="flag-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {ride.destination?.address || ride.dropoff}
              </Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <Ionicons name="time-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>ETA:</Text>
              <Text style={styles.value}>5-10 mins</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => rider?.phone && callDriver(rider.phone)}
            >
              <Ionicons name="call" size={20} color="#7500fc" />
              <Text style={styles.secondaryButtonText}>Call Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={cancelRide}>
              <Text style={styles.cancelText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* COMPLETED STATE */}
      {status === "completed" && (
        <View style={styles.card}>
          <Ionicons name="checkmark-circle" size={48} color="#34c759" />
          <Text style={styles.title}>Ride Completed!</Text>
          <Text style={styles.subtitle}>Thank you for riding with us</Text>
          <Text style={styles.loadingText}>Returning to home screen...</Text>
        </View>
      )}

      {/* CANCELLED STATE */}
      {status === "cancelled" && (
        <View style={styles.card}>
          <Ionicons name="close-circle" size={48} color="#ff3b30" />
          <Text style={styles.title}>Ride Cancelled</Text>
          <Text style={styles.loadingText}>Returning to home screen...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    textAlign: "center",
    marginVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
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
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 8,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    // borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  details: {
    width: "100%",
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    minWidth: 80,
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    flexWrap: "wrap",
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f3f0faff",
    borderRadius: 12,
  },
  driverPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  driverRating: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  callButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#7500fc",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#7500fc",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ff3b30",
    alignItems: "center",
    flex: 1,
  },
  cancelText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#7500fc",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
