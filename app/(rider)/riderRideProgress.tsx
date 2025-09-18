import { db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;
  
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

    const unsubscribe = onSnapshot(doc(db, "rides", rideId), (snapshot) => {
      if (snapshot.exists()) {
        const rideData = snapshot.data();
        setRide(rideData);
        setCurrentStatus(rideData.status || "accepted");
        setLoading(false);
        
        // If ride is completed, navigate to completed screen
        if (rideData.status === "completed") {
          router.replace({
            pathname: "/rideCompleted",
            params: { rideId }
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
    }, (error) => {
      console.error("Error listening to ride:", error);
      Alert.alert("Error", "Failed to load ride details");
      setLoading(false);
    });

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
          params: { rideId }
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
    if (ride?.passengerPhone) {
      Linking.openURL(`tel:${ride.passengerPhone}`).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Passenger phone number not available");
    }
  };

  const openMaps = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Could not open maps");
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "accepted": return "Heading to Pickup 🚗";
      case "picked_up": return "On Trip 🚗";
      case "completed": return "Trip Completed ✅";
      case "cancelled": return "Trip Cancelled ❌";
      default: return status;
    }
  };

  const getActionButton = () => {
    switch (currentStatus) {
      case "accepted":
        return (
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => updateRideStatus("picked_up")}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Passenger Picked Up</Text>
            )}
          </TouchableOpacity>
        );
      
      case "picked_up":
        return (
          <TouchableOpacity
            style={[styles.btn, styles.successBtn]}
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7500fc" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          {currentStatus === "accepted" ? "📍 Navigating to pickup..." :
           currentStatus === "picked_up" ? "🚗 On the way to destination" :
           "🗺 Navigation Map"}
        </Text>
      </View>

      {/* Ride Status Card */}
      <View style={styles.statusCard}>
        {/* Passenger Info */}
        <View style={styles.passengerRow}>
          <Image
            source={
              ride.passengerInfo?.profilePicture || ride.passengerPhoto
                ? { uri: ride.passengerInfo?.profilePicture || ride.passengerPhoto }
                : require("../../assets/images/defaultUserImg.png")
            }
            style={styles.profilePic}
            contentFit="cover"
          />
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {ride.passengerInfo?.name || ride.passengerName || "Passenger"}
            </Text>
            <Text style={styles.passengerRating}>
              ⭐ {ride.passengerInfo?.rating?.toFixed(1) || "4.8"}
            </Text>
          </View>
          {ride.passengerInfo?.phone && (
            <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
              <Ionicons name="call-outline" size={24} color="#7500fc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Ride Details */}
        <View style={styles.detailsSection}>
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => openMaps(ride.pickup?.address || ride.pickup)}
          >
            <Ionicons name="location-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value} numberOfLines={2}>
              {ride.pickup?.address || ride.pickup || "Loading..."}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.row} 
            onPress={() => openMaps(ride.destination?.address || ride.destination)}
          >
            <Ionicons name="flag-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.value} numberOfLines={2}>
              {ride.destination?.address || ride.dropoff || "Loading..."}
            </Text>
          </TouchableOpacity>

          {/* Ride Status */}
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.statusText]}>
              {getStatusDisplay(currentStatus)}
            </Text>
          </View>

          {/* Trip Duration/Distance (if available) */}
          {ride.estimatedDuration && (
            <View style={styles.row}>
              <Ionicons name="timer-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>ETA:</Text>
              <Text style={styles.value}>{ride.estimatedDuration}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {getActionButton()}
          
          {/* Emergency/Cancel Button */}
          <TouchableOpacity
            style={[styles.btn, styles.dangerBtn]}
            onPress={() => {
              Alert.alert(
                "Cancel Trip",
                "Are you sure you want to cancel this trip?",
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes",
                    onPress: () => updateRideStatus("cancelled"),
                    style: "destructive"
                  }
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
    backgroundColor: "#fff",
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ff3b30",
    marginBottom: 20,
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
  statusCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f3f0faff",
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
    color: "#333",
  },
  passengerRating: {
    fontSize: 14,
    color: "#666",
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
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    flexWrap: 'wrap',
  },
  statusText: {
    fontWeight: "600",
    color: "#7500fc",
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
    backgroundColor: "#7500fc",
  },
  successBtn: {
    backgroundColor: "#28a745",
  },
  dangerBtn: {
    backgroundColor: "#ff3b30",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
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