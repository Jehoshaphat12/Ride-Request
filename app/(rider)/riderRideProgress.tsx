import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import { addNotification } from "@/services/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
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

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme(); // Get theme from context
  const rideId = Array.isArray(params.rideId)
    ? params.rideId[0]
    : params.rideId;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

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
          setCurrentStatus(rideData.status || "accepted");
          setLoading(false);

          // If ride is completed, navigate to completed screen
          if (rideData.status === "completed") {
            await addNotification(
              rideData.riderId,
              "ride",
              "Ride Completed ✅",
              "You successfully finished a ride",
              rideId
            );
            router.replace({
              pathname: "/rideCompleted",
              params: { rideId },
            });
          }

          // If ride is cancelled, go back
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

  const updateRideStatus = async (newStatus: string) => {
    if (!rideId) return;

    setUpdating(true);
    try {
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // Add timestamp based on status
      if (newStatus === "picked_up") {
        updates.pickedUpAt = serverTimestamp();
      } else if (newStatus === "completed") {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "rides", rideId), updates);

      if (newStatus === "completed") {
        router.replace({
          pathname: "/rideCompleted",
          params: { rideId },
        });
      }
    } catch (error) {
      console.error("Error updating ride status:", error);
      Alert.alert("Error", "Failed to update ride status");
    } finally {
      setUpdating(false);
    }
  };

  const callPassenger = () => {
    if (ride?.passengerInfo?.phone || ride?.passengerPhone) {
      Linking.openURL(
        `tel:${ride.passengerInfo?.phone || ride.passengerPhone}`
      ).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Passenger phone number not available");
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

  // Helper function to safely extract address text
  // const getAddressText = (address: any): string => {
  //   if (!address) return "Location not specified";

  //   if (typeof address === 'string') return address;

  //   if (typeof address === 'object') {
  //     if (address.address) return address.address;
  //     if (address.formattedAddress) return address.formattedAddress;
  //     if (address.street && address.city) return `${address.street}, ${address.city}`;
  //     if (address.name) return address.name;

  //     return "Location details available";
  //   }

  //   return "Location not specified";
  // };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "accepted":
        return "Heading to Pickup 🚗";
      case "picked_up":
        return "On Trip 🚗";
      case "completed":
        return "Trip Completed ✅";
      case "cancelled":
        return "Trip Cancelled ❌";
      default:
        return status;
    }
  };

  const getActionButton = () => {
    switch (currentStatus) {
      case "accepted":
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.primaryBtn,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => updateRideStatus("picked_up")}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                Passenger Picked Up
              </Text>
            )}
          </TouchableOpacity>
        );

      case "picked_up":
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.successBtn,
              { backgroundColor: theme.success },
            ]}
            onPress={() => updateRideStatus("completed")}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Complete Trip</Text>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
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
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}>
        <Text style={[styles.mapText, { color: theme.text }]}>
          {currentStatus === "accepted"
            ? "📍 Navigating to pickup..."
            : currentStatus === "picked_up"
            ? "🚗 On the way to destination"
            : "🗺 Navigation Map"}
        </Text>
      </View>

      {/* Ride Status Card */}
      <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
        {/* Passenger Info */}
        <View
          style={[
            styles.passengerRow,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Image
            source={
              ride.passengerInfo?.profilePicture || ride.passengerPhoto
                ? {
                    uri:
                      ride.passengerInfo?.profilePicture || ride.passengerPhoto,
                  }
                : require("../../assets/images/defaultUserImg.png")
            }
            style={styles.profilePic}
            contentFit="cover"
          />
          <View style={styles.passengerInfo}>
            <Text style={[styles.passengerName, { color: theme.text }]}>
              {ride.passengerInfo?.name || ride.passengerName || "Passenger"}
            </Text>
            <Text style={[styles.passengerRating, { color: theme.muted }]}>
              ⭐ {ride.passengerInfo?.rating?.toFixed(1) || "4.8"}
            </Text>
          </View>
          {(ride.passengerInfo?.phone || ride.passengerPhone) && (
            <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
              <Ionicons name="call-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ride Details */}
        <View style={styles.detailsSection}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openMaps(ride.pickup.address)}
          >
            <Ionicons name="location-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>Pickup:</Text>
            <Text
              style={[styles.value, { color: theme.text }]}
              numberOfLines={2}
            >
              {ride.pickup.address}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openMaps(ride.dropoff.address)}
          >
            <Ionicons name="flag-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>
              Destination:
            </Text>
            <Text
              style={[styles.value, { color: theme.text }]}
              numberOfLines={2}
            >
              {ride.dropoff.address}
            </Text>
          </TouchableOpacity>

          {/* Ride Status */}
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.label, { color: theme.muted }]}>Status:</Text>
            <Text
              style={[
                styles.value,
                styles.statusText,
                { color: theme.primary },
              ]}
            >
              {getStatusDisplay(currentStatus)}
            </Text>
          </View>

          {/* Trip Duration/Distance (if available) */}
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

        {/* Action Buttons */}
        <View style={styles.actions}>
          {getActionButton()}

          {/* Emergency/Cancel Button */}
          <TouchableOpacity
            style={[
              styles.btn,
              styles.dangerBtn,
              { backgroundColor: theme.danger },
            ]}
            onPress={() => {
              Alert.alert(
                "Cancel Trip",
                "Are you sure you want to cancel this trip?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes",
                    onPress: () => updateRideStatus("cancelled"),
                    style: "destructive",
                  },
                ]
              );
            }}
            disabled={updating}
          >
            <Text style={styles.btnText}>Cancel Trip</Text>
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
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
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
  statusCard: {
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
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
  },
  passengerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  passengerRating: {
    fontSize: 14,
    marginTop: 2,
  },
  callButton: {
    padding: 8,
  },
  detailsSection: {
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
    minWidth: 70,
  },
  value: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  statusText: {
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryBtn: {
    // backgroundColor set dynamically
  },
  successBtn: {
    // backgroundColor set dynamically
  },
  dangerBtn: {
    // backgroundColor set dynamically
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
});
