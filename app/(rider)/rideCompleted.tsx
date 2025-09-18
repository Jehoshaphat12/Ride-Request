import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RideCompletedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Image */}
        <Image
          source={require("../../assets/images/confirm.png")}
          style={{ width: 220, height: 220, marginBottom: 24 }}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Ride Completed 🎉</Text>
        <Text style={styles.subtitle}>
          Great job! Your passenger has reached their destination safely.
        </Text>

        {/* Ride Summary */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Fare:</Text>
            <Text style={styles.value}>GHS 45.00</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>25 min</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="bicycle-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Distance:</Text>
            <Text style={styles.value}>8.4 km</Text>
          </View>
        </View>

        {/* Back to Home */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/riderHome")}
        >
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    gap: 12,
    width: "100%",
    marginBottom: 32,
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
  btn: {
    backgroundColor: "#7500fc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
});
