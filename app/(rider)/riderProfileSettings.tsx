import { useTheme } from "@/contexts/ThemeContext";
import { darkTheme } from "@/hooks/theme";
import { auth } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { signOut } from "firebase/auth";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RiderProfileScreen() {
//   const [darkMode, setDarkMode] = useState(false);
  const {darkMode, toggleDarkMode} = useTheme()

  // Logout rider function
  const handleLogout = async () => {
        try {
          await signOut(auth);
          console.log('User signed out successfully!');
          // Navigate the user to the login screen or another appropriate screen
          // using your navigation library (e.g., React Navigation)
        } catch (error) {
          console.error('Error signing out:', error);
        }
      };

  return (
    <SafeAreaView
      style={[styles.container, darkMode && { backgroundColor: "#121212" }]}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Header */}
        <View
          style={[
            styles.header,
            darkMode && { backgroundColor: "#1e1e1e", borderColor: "#333" },
          ]}
        >
          <Image
            source={require("../../assets/images/defaultUserImg.png")}
            style={styles.profilePic}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.name, darkMode && { color: "#fff" }]}>
              Kofi Mensah
            </Text>
            <Text style={[styles.vehicle, darkMode && { color: "#aaa" }]}>
              Yamaha MT-15 • AS 543-20
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Options */}
        <View
          style={[
            styles.section,
            darkMode && { backgroundColor: "#1e1e1e", borderColor: "#333" },
          ]}
        >
          <OptionRow icon="person-outline" label="Account Info" darkMode={darkMode} />
          <OptionRow icon="bicycle-outline" label="Vehicle Info" darkMode={darkMode} />
          <OptionRow icon="time-outline" label="Ride History" darkMode={darkMode} />
          <OptionRow icon="cash-outline" label="Earnings" darkMode={darkMode} />
          <OptionRow icon="wallet-outline" label="Payment Setup" darkMode={darkMode} />
          <OptionRow icon="help-circle-outline" label="Help & Support" darkMode={darkMode} />

          {/* Dark Mode Toggle */}
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={22} color="#7500fc" />
            <Text
              style={[styles.rowText, darkMode && { color: "#fff" }]}
            >
              Dark Mode
            </Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              thumbColor={darkMode ? "#7500fc" : "#f4f3f4"}
              trackColor={{ false: "#ccc", true: "#a580ff" }}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable row
function OptionRow({
  icon,
  label,
  darkMode,
}: {
  icon: any;
  label: string;
  darkMode?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.row, darkMode && {borderColor: darkTheme.border}]}>
      <Ionicons name={icon} size={22} color="#7500fc" />
      <Text style={[styles.rowText, darkMode && { color: "#fff" }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#999"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f6ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eee",
  },
  profilePic: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  vehicle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  editBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7500fc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff3b30",
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});
