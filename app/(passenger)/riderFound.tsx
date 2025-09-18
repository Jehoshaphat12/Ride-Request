import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function DriverFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={{ fontSize: 28, color: "#555" }}>🗺 Map Loading...</Text>
      </View>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
  },
  driverRating: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#444",
    flexShrink: 1,
  },
  cancelBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7500fc",
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: "#7500fc",
    fontSize: 16,
    fontWeight: "600",
  },
});
