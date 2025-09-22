import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Ride = {
  id: string;
  pickup: string;
  dropoff: string;
  status: string;
  createdAt: any;
  fare?: number; // Added fare field
};

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme, darkMode } = useTheme(); // Get theme from context

  useEffect(() => {
    const passengerId = auth.currentUser?.uid;
    if (!passengerId) return;

    const q = query(
      collection(db, "rides"),
      where("passengerId", "==", passengerId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchRides: Ride[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Ride, "id">),
      }));

      setRides(fetchRides);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderTrip = ({ item }: { item: Ride }) => (
    <TouchableOpacity style={[
      styles.card,
      { backgroundColor: theme.card }
    ]}>
      <View style={styles.row}>
        <Ionicons name="location-outline" size={20} color={theme.primary} />
        <Text style={[styles.label, { color: theme.text }]}>{item.pickup}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="flag-outline" size={20} color={theme.primary} />
        <Text style={[styles.label, { color: theme.text }]}>{item.dropoff}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={[styles.fare, { color: theme.text }]}>
          GHC {item.fare ? item.fare.toFixed(2) : "0.00"}
        </Text>
        <Text
          style={[
            styles.status,
            item.status === "Completed" ? 
              { color: theme.success } : 
              { color: theme.danger }
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={[styles.date, { color: theme.muted }]}>
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit"
            })
          : ""}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ride History
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading your rides...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          borderBottomColor: theme.border,
          backgroundColor: theme.card
        }
      ]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ride History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: 15 }}>
        <Text style={[styles.title, { color: theme.text }]}>Your Trips</Text>
        
        {rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              No ride history yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.muted }]}>
              Your completed rides will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderTrip}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 30 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700", 
    marginBottom: 16 
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 3,
  },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 6 
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  label: { 
    fontSize: 16, 
    marginLeft: 8,
  },
  fare: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
  status: { 
    fontSize: 14, 
    fontWeight: "600" 
  },
  date: { 
    fontSize: 14, 
    marginTop: 4 
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});