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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Loader from "../Loader";

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme(); // Get theme from context
  const rideId = Array.isArray(params.rideId)
    ? params.rideId[0]
    : params.rideId;

  const [ride, setRide] = useState<any>(null);
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [eta, setEta] = useState("12 mins"); // You can calculate this based on distance

  const rideLocation = useRideListener(rideId);

  

  useEffect(() => {
    if (!rideId) {
      Alert.alert("Error", "Ride ID not provided");
      router.back();
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),
      async (snapshot) => {
        if (snapshot.exists()) {
          const rideData = snapshot.data();
          setRide(rideData);
          setLoading(false);

          // Fetch rider details if assigned
          const riderId = rideData.riderId;
          if (riderId) {
            try {
              const riderSnap = await getDoc(doc(db, "users", riderId));
              if (riderSnap.exists()) {
                setRider(riderSnap.data());
                console.log(rider.totalRides);
              }
            } catch (error) {
              console.error("Error fetching rider:", error);
            }
          }

          // Handle different ride statuses
          if (rideData.status === "completed") {
            router.replace({
              pathname: "/(passenger)/completedRide",
              params: { rideId },
            });
          }

          if (rideData.status === "cancelled") {
            Alert.alert("Ride Cancelled", "This ride has been cancelled");
            router.back();
          }
        } else {
          Alert.alert("Error", "Ride not found");
          router.back();
        }
      },
      (error) => {
        console.error("Error listening to ride:", error);
        Alert.alert("Error", "Failed to load ride details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  const callDriver = () => {
    if (ride?.riderInfo?.phone) {
      Linking.openURL(`tel:${ride.riderInfo.phone}`).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Driver phone number not available");
    }
  };

  const openMaps = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Could not open maps");
    });
  };

  const handleEmergency = () => {
    Alert.alert(
      "Emergency Assistance",
      "Would you like to call emergency services?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Call Emergency",
          onPress: () =>
            Linking.openURL("tel:911").catch(() => {
              Alert.alert("Error", "Could not make emergency call");
            }),
          style: "destructive",
        },
      ]
    );
  };

  const cancelRide = async () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? Cancellation fees may apply.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              await updateDoc(doc(db, "rides", rideId), {
                status: "cancelled",
                cancelledAt: serverTimestamp(),
                cancelledBy: "passenger",
                cancellationReason: "Passenger requested during trip",
              });
              Alert.alert("Ride Cancelled", "Your ride has been cancelled");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel ride");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusMessage = () => {
    if (!ride) return "Loading...";

    switch (ride.status) {
      case "accepted":
        return "Driver is on the way 🚗";
      case "picked_up":
        return "Ride in progress 🚗";
      case "completed":
        return "Ride completed ✅";
      case "cancelled":
        return "Ride cancelled ❌";
      default:
        return "Ride in progress";
    }
  };

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

  if (!ride) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Ride not found
        </Text>
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
        {/* <Text style={[styles.mapText, { color: theme.text }]}>
          {getStatusMessage()}
        </Text> */}

        {rideLocation ? (
          <MapView
            style={styles.map}
            // provider={provider === "google" ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: rideLocation.pickup.lat,
              longitude: rideLocation.pick.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
          >
            {/* Passenger pickup marker */}
            <Marker
              coordinate={{
                latitude: rideLocation.pickup.lat,
                longitude: rideLocation.pickup.lng,
              }}
              title="Pickup Location"
              pinColor="voilet"
            />

            {/* Rider Live location */}
            {rideLocation.rider && (
              <Marker coordinate={{
                latitude: rideLocation.riderLocation.lat,
                longitude: rideLocation.rider.riderLocation.lng,
              }}
                title="Rider Location"
                pinColor="green"
              />
            )}
          </MapView>
        ) : (
          <Loader msg="Loading ride data..." />
        )}
        
      </View>

      {/* Ride Info Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {/* Driver Row */}
        <View
          style={[styles.driverRow, { backgroundColor: theme.primary + "20" }]}
        >
          <Image
            source={
              ride.riderInfo?.profilePicture
                ? { uri: ride.riderInfo.profilePicture }
                : require("../../assets/images/defaultUserImg.png")
            }
            style={styles.driverPic}
            contentFit="cover"
          />
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, { color: theme.text }]}>
              {ride.riderInfo?.name || "Driver"}
            </Text>
            <Text style={[styles.driverRating, { color: theme.muted }]}>
              ⭐ {ride.riderInfo.rating?.toFixed(1) || "4.8"} (
              {ride.riderInfo.totalRides || "0"} rides)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={callDriver}
            disabled={!ride.riderInfo?.phone}
          >
            <Ionicons name="call-outline" size={28} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openMaps(ride.pickup?.address || ride.pickup)}
          >
            <Ionicons name="location-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>From:</Text>
            <Text
              style={[styles.value, { color: theme.text }]}
              numberOfLines={2}
            >
              {ride.pickup?.address || ride.pickup || "Current location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              openMaps(ride.dropoff?.address)
            }
          >
            <Ionicons name="flag-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>To:</Text>
            <Text
              style={[styles.value, { color: theme.text }]}
              numberOfLines={2}
            >
              {ride.dropoff?.address || "Destination"}
            </Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>Status:</Text>
            <Text
              style={[styles.value, { color: theme.text, fontWeight: "600" }]}
            >
              {getStatusMessage()}
            </Text>
          </View>

          {ride.estimatedDuration && (
            <View style={styles.row}>
              <Ionicons name="timer-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>ETA:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {ride.estimatedDuration}
              </Text>
            </View>
          )}
        </View>

        {/* Emergency + Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.sosBtn} onPress={handleEmergency}>
            <Ionicons name="warning-outline" size={20} color="#fff" />
            <Text style={styles.sosText}>Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.primary }]}
            onPress={cancelRide}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={[styles.cancelText, { color: theme.primary }]}>
                Cancel Ride
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    fontSize: 20,
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
  tripInfo: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    minWidth: 50,
  },
  value: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e63946",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  sosText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
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
