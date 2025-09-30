import { useTheme } from "@/contexts/ThemeContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme(); // Get theme from context

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#b475fcff" }]}>
      <StatusBar 
        barStyle={darkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background}
      />
      
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/welcome-img.png")}
            style={{ width: 350, height: 350 }}
            contentFit="contain"
          />
        </View>
        
        <View style={[
          styles.loginButtonsContainer, 
          { 
            backgroundColor: theme.card,
            shadowColor: darkMode ? "#000" : "#7500fc",
            shadowOpacity: darkMode ? 0.3 : 0.1,
          }
        ]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome to RideRequest
          </Text>
          <Text style={[styles.paragraph, { color: theme.muted }]}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. it amet consectetur adipisicing elit.
          </Text>
          
          <TouchableOpacity 
            style={[styles.loginButtons, { backgroundColor: theme.primary }]} 
            onPress={() => router.push("./Login")}
          >
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              Need a Ride
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity  
            style={[
              styles.RegisterButtons, 
              { 
                backgroundColor: theme.card,
                borderColor: theme.primary 
              }
            ]} 
            onPress={() => router.replace("./RiderLogin")}
          >
            <Text style={[styles.registerButtonText, { color: theme.primary }]}>
              Become a Rider
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 0,
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
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  loginButtonsContainer: {
    flexDirection: "column",
    paddingTop: 32,
    paddingBottom: 64,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: "100%",
    gap: 12,
    // Shadow effects
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    height: 400,
    paddingTop: 28,
    alignItems: "center",
    justifyContent: "center",
    maxHeight: 400,
  },
  loginButtons: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  RegisterButtons: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  registerButtonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});