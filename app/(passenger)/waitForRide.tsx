import { useTheme } from "@/contexts/ThemeContext";
import { useRideListener } from "@/hooks/useRideListener";
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
  Dimensions,
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
  const { theme, darkMode } = useTheme(); // Get theme from context
  const rideId = Array.isArray(params.rideId)
    ? params.rideId[0]
    : params.rideId;

  const [ride, setRide] = useState<any | null>(null);
  const [rider, setRider] = useState<any | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rideLocation = useRideListener(rideId);

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
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Ionicons name="alert-circle" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading ride details...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
        
      </View>

      {/* PENDING STATE */}
      {status === "pending" && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            Looking for a Rider...
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            We're finding the best Rider for you
          </Text>

          {/* Ride Details */}
          <View style={styles.details}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => ride?.pickup && openMaps(ride.pickup)}
            >
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
                {ride?.pickup?.address || "Current location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => ride?.destination && openMaps(ride.destination)}
            >
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>
                Destination:
              </Text>
              <Text
                style={[styles.value, { color: theme.text }]}
                numberOfLines={2}
              >
                {ride?.dropoff?.address || "Loading..."}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Ride Button */}
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.danger }]}
            onPress={cancelRide}
          >
            <Text style={[styles.cancelText, { color: theme.danger }]}>
              Cancel Ride
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACCEPTED STATE */}
      {status === "accepted" && ride && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {/* Driver Header */}
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Ionicons name="car-sport" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Driver Assigned
            </Text>
          </View>

          {/* Driver Row */}
          <View
            style={[
              styles.driverRow,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
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
              <Text style={[styles.driverName, { color: theme.text }]}>
                {ride.riderInfo?.name || rider?.name || "Driver"}
              </Text>
              <Text style={[styles.driverRating, { color: theme.muted }]}>
                ⭐ {rider?.rating?.toFixed(1) || "4.8"} (
                {rider?.totalRides || "0"} rides)
              </Text>
            </View>
            {ride.riderInfo?.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callDriver(ride.riderInfo.phone)}
              >
                <Ionicons name="call-outline" size={28} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Ionicons name="car-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>
                Vehicle:
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {ride.riderInfo?.vehicle?.model ||
                  rider?.vehicle?.model ||
                  "Not available"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.label, { color: theme.muted }]}>Color:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {ride.riderInfo?.vehicle?.color ||
                  rider?.vehicle?.color ||
                  "N/A"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="document-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.label, { color: theme.muted }]}>Plate:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {ride.riderInfo?.vehicle?.plateNumber ||
                  rider?.vehicle?.plateNumber ||
                  "Not available"}
              </Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <View
              style={[
                styles.sectionHeader,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Trip Details
              </Text>
            </View>

            <TouchableOpacity
              style={styles.row}
              onPress={() => openMaps(ride.pickup?.address || ride.pickup)}
            >
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
                {ride.pickup?.address}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                openMaps(ride.destination?.address || ride.dropoff)
              }
            >
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>
                Destination:
              </Text>
              <Text
                style={[styles.value, { color: theme.text }]}
                numberOfLines={2}
              >
                {ride.dropoff?.address}
              </Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>ETA:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                5-10 mins
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { borderColor: theme.primary },
              ]}
              onPress={() => rider?.phone && callDriver(rider.phone)}
            >
              <Ionicons name="call" size={20} color={theme.primary} />
              <Text
                style={[styles.secondaryButtonText, { color: theme.primary }]}
              >
                Call Driver
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.danger }]}
              onPress={cancelRide}
            >
              <Text style={[styles.cancelText, { color: theme.danger }]}>
                Cancel Ride
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* COMPLETED STATE */}
      {status === "completed" && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Ionicons name="checkmark-circle" size={48} color={theme.success} />
          <Text style={[styles.title, { color: theme.text }]}>
            Ride Completed!
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Thank you for riding with us
          </Text>
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Returning to home screen...
          </Text>
        </View>
      )}

      {/* CANCELLED STATE */}
      {status === "cancelled" && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Ionicons name="close-circle" size={48} color={theme.danger} />
          <Text style={[styles.title, { color: theme.text }]}>
            Ride Cancelled
          </Text>
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Returning to home screen...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "600",
  },
  card: {
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
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    borderBottomColor: "rgba(0,0,0,0.1)",
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
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
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
  },
  driverRating: {
    fontSize: 14,
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
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});
