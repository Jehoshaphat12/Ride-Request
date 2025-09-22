import Loader from "@/app/Loader";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function IncomingRideScreen() {
  const { darkMode } = useTheme();

  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for pending rides
    const q = query(collection(db, "rides"), where("status", "==", "pending"));

    const unsub = onSnapshot(q, (snap) => {
      const rides: any[] = [];
      snap.forEach((doc) => rides.push({ id: doc.id, ...doc.data() }));
      setRequests(rides);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const acceptRide = async (rideId: string) => {
    if (!auth.currentUser) return;
    try {
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        status: "accepted",
        rideId: auth.currentUser.uid,
      });
    } catch (err) {
      console.error("Error accepting ride:", err);
    }
  };

  if (loading) {
    return <Loader msg="Request Loading..." />;
  }

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.navheader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={darkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: darkMode ? "#fff" : "#000" }]}
          >
            Ride Requests
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ride requests right now 🚘</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.navheader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={darkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: darkMode ? "#fff" : "#000" }]}
        >
          Ride Requests
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Pickup: {item.pickup}</Text>
            <Text style={styles.title}>Destination: {item.dropoff}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => acceptRide(item.id)}
            >
              <Text style={styles.buttonText}>Accept Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  requestCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#bbb",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  passengerRating: {
    fontSize: 14,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#444",
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#7500fc",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
  },

  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40, // Same as back button for balance
  },
});
