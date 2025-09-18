import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const trips = [
  {
    id: "1",
    pickup: "Accra Mall",
    destination: "Kwame Nkrumah Circle",
    fare: "GHS 35.00",
    date: "Sep 5, 2025",
    status: "Completed",
  },
  {
    id: "2",
    pickup: "Tema Station",
    destination: "Osu Oxford Street",
    fare: "GHS 28.00",
    date: "Sep 2, 2025",
    status: "Completed",
  },
  {
    id: "3",
    pickup: "Madina",
    destination: "Legon Campus",
    fare: "GHS 18.00",
    date: "Aug 30, 2025",
    status: "Canceled",
  },
];

export default function RideHistoryScreen() {
  const renderTrip = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="location-outline" size={20} color="#7500fc" />
        <Text style={styles.label}>{item.pickup}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="flag-outline" size={20} color="#7500fc" />
        <Text style={styles.label}>{item.destination}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.fare}>{item.fare}</Text>
        <Text
          style={[
            styles.status,
            item.status === "Completed"
              ? { color: "green" }
              : { color: "red" },
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
        <View style={{padding: 15}}>

      <Text style={styles.title}>Your Trips</Text>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={{ paddingBottom: 20 }}
        />
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  label: { fontSize: 16, marginLeft: 8, color: "#333" },
  fare: { fontSize: 16, fontWeight: "600", color: "#000" },
  status: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 14, color: "#666", marginTop: 4 },
});
