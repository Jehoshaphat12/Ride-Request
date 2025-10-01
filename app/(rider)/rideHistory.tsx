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
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type Ride = {
  id: string;
  pickup: any;
  dropoff: any;
  status: string;
  createdAt: any;
  fare?: number;
};

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme, darkMode } = useTheme();

  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    console.log("Rider's ID: ", riderId);

    const q = query(
      collection(db, "rides"),
      where("riderId", "==", riderId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const fetchRides: Ride[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              pickup: data.pickup,
              dropoff: data.dropoff,
              status: data.status,
              createdAt: data.createdAt,
              fare: data.fare,
            };
          });

          console.log("Fetched rides:", fetchRides.length);
          setRides(fetchRides);
          setError(null);
        } catch (err) {
          console.error("Error processing rides:", err);
          setError("Error loading rides");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
        setError("Failed to load ride history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper function to safely extract address text
  const getAddressText = (address: any): string => {
    if (!address) return "Location not specified";
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      if (address.address) return address.address;
      if (address.formattedAddress) return address.formattedAddress;
      if (address.street && address.city) return `${address.street}, ${address.city}`;
      if (address.name) return address.name;
      
      return "Location details available";
    }
    
    return "Location not specified";
  };

  // Helper function to format date safely
  const formatDate = (timestamp: any): string => {
    if (!timestamp?.toDate) return "Date not available";
    
    try {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderTrip = ({ item }: { item: Ride }) => (
    <TouchableOpacity style={[
      styles.card,
      { backgroundColor: theme.card }
    ]}>
      <View style={styles.row}>
        <Ionicons name="location-outline" size={20} color={theme.primary} />
        <Text style={[styles.label, { color: theme.text }]}>
          {getAddressText(item.pickup)}
        </Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="flag-outline" size={20} color={theme.primary} />
        <Text style={[styles.label, { color: theme.text }]}>
          {getAddressText(item.dropoff)}
        </Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={[styles.fare, { color: theme.text }]}>
          GHC {item.fare ? item.fare.toFixed(2) : "0.00"}
        </Text>
        <Text
          style={[
            styles.status,
            item.status === "completed" || item.status === "Completed" ? 
              { color: theme.success } : 
              { color: theme.danger }
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={[styles.date, { color: theme.muted }]}>
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={darkMode ? "light-content" : "dark-content"} 
          backgroundColor={theme.background}
        />
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

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={darkMode ? "light-content" : "dark-content"} 
          backgroundColor={theme.background}
        />
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setLoading(true);
              setError(null);
              // The useEffect will re-run automatically
            }}
          >
            <Text style={[styles.retryButtonText, { color: theme.primaryText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background}
      />

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
          Ride History ({rides.length})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
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
            contentContainerStyle={styles.listContent}
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 45,
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
  listContent: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    flex: 1,
    flexWrap: 'wrap',
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
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});