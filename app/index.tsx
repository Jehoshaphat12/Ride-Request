import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* You can add a logo or image here if needed */}
        <Image
          source={require("@/assets/images/welcome-img.png")}
          style={{ width: 350, height: 350 }}
        />
      </View>
      <View style={[styles.loginButtonsContainer, { width: "100%", gap: 12 }]}>
    <Text style={styles.title}>Welcome to RideRequest</Text>
    <Text style={styles.paragraph}>Lorem ipsum dolor sit amet consectetur adipisicing elit. it amet consectetur adipisicing elit.</Text>
      <TouchableOpacity style={styles.loginButtons}  onPress={() => router.push("./Login")}>
        <Text style={{textAlign: "center", fontSize: 20, fontWeight: "600", color: "#ffffffff"}}>Need a Ride</Text>
      </TouchableOpacity>
      <TouchableOpacity  style={styles.RegisterButtons} onPress={() => router.replace("./RiderLogin")}>
        <Text style={{textAlign: "center", fontSize: 20, fontWeight: "600", color: "#7500fcff"}}>Become a Rider</Text>
      </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 0,
    backgroundColor: "#e4d6ffff",
  },
  title: {
    fontSize: 32,
    marginBottom: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    },
    loginButtonsContainer: {
    flexDirection: "column",
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingBottom: 64,
    paddingHorizontal: 32,
    borderRadius: 20,
    },
  imageContainer: {
    flex: 1,
    height: 400,
    paddingTop: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtons: {
    backgroundColor: "#7500fcff",
    paddingVertical: 14,
    borderRadius: 10,
  },
    RegisterButtons: {
    backgroundColor: "#ffffffff",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7500fcff",
  },
});
