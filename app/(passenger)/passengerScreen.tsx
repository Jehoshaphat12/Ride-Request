import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebaseConfig";
import { requestRide } from "@/services/rides";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PassengerHomeScreen() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  // Ride Request function
  const handleRequestRide = async () => {
    if (!pickup || !destination) {
      alert("Error, Please enter both pickup and destination.");
      return;
    }

    try {
      setLoading(true);
      const passengerId = auth.currentUser!.uid;

      const rideId = await requestRide(pickup, destination, passengerId);

      // await addDoc(collection(db, "rides"), {
      //   passengerId,
      //   pickup: { lat: 0, lng: 0, address: pickup }, // TODO: connect geocoding later
      //   destination: { lat: 0, lng: 0, address: destination },
      //   status: "pending",
      //   riderId: null,
      //   createdAt: serverTimestamp()
      // })
      setLoading(false);
      alert("Ride Requested, Waiting for a rider to accept");
      router.push({ pathname: "/(passenger)/waitForRide", params: { rideId } });
    } catch (error) {
      console.error("Error requesting ride:", error);
      Alert.alert("Error", "Could not request ride.");
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully!");
      // Navigate the user to the login screen or another appropriate screen
      // using your navigation library (e.g., React Navigation)
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push("/(passenger)/waitForRide")}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push("/(passenger)/waitForRide")}
          >
            <Image
              source={require("../../assets/images/defaultUserImg.png")}
              style={styles.profilePic}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>🗺 Map will be here</Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Pickup & Destination Inputs */}
        <View style={styles.searchBox}>
          {/* Pickup */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="locate-outline"
              size={20}
              color="#7500fc"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={pickup}
              onChangeText={setPickup}
              placeholder="Pickup location"
              placeholderTextColor="#999"
              // defaultValue="Current location"
            />
          </View>

          {/* Destination */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="flag-outline"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={destination}
              onChangeText={setDestination}
              placeholder="Enter destination"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Request Ride Button */}
        <TouchableOpacity onPress={handleRequestRide} style={styles.rideButton}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.rideButtonText}>Request Ride</Text>
          )}
        </TouchableOpacity>

        {/* Rider info / shortcuts */}
        <View style={styles.infoSection}>
          <TouchableOpacity onPress={handleLogout} style={styles.historyButton}>
            <Text style={styles.historyButtonText}>View Ride History</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : StatusBar.currentHeight,
    paddingBottom: 8,
    backgroundColor: "#fff",
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
    gap: 16,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
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
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: {
    color: "#666",
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchBox: {
    marginTop: -60,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  rideButton: {
    backgroundColor: "#7500fc",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
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
  rideButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  historyButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7500fc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 16,
    color: "#7500fc",
    fontWeight: "600",
  },
});
