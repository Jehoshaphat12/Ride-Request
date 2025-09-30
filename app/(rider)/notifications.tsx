import { useTheme } from "@/contexts/ThemeContext";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function NotificationsScreen() {
  const { theme, darkMode } = useTheme(); // Get theme from context
  const notifications = useUserNotifications();
  const router = useRouter();

  if (!notifications || notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar 
          barStyle={darkMode ? "light-content" : "dark-content"} 
          backgroundColor={theme.background}
        />
        
        {/* Header with Back Button */}
        <View style={[styles.navheader, { 
          borderBottomColor: theme.border,
          backgroundColor: theme.card 
        }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.muted} />
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.muted }]}>
            Your notifications will appear here
          </Text>
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
      
      {/* Header with Back Button */}
      <View style={[styles.navheader, { 
        borderBottomColor: theme.border,
        backgroundColor: theme.card 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications ({notifications.length})
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.notificationHeader}>
              <Ionicons 
                name={getNotificationIcon(item.type)} 
                size={20} 
                color={getNotificationColor(item.type, theme)} 
              />
              <Text style={[styles.title, { color: theme.text }]}>
                {item.title}
              </Text>
            </View>
            <Text style={[styles.body, { color: theme.muted }]}>
              {item.body}
            </Text>
            <Text style={[styles.date, { color: theme.muted }]}>
              {item.createdAt?.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// Helper function to get appropriate icon based on notification type
const getNotificationIcon = (type?: string) => {
  switch (type) {
    case 'ride_accepted':
      return 'car-sport';
    case 'ride_completed':
      return 'checkmark-circle';
    case 'payment':
      return 'card';
    case 'promotion':
      return 'gift';
    case 'system':
      return 'information-circle';
    default:
      return 'notifications';
  }
};

// Helper function to get appropriate color based on notification type
const getNotificationColor = (type: string, theme: any) => {
  switch (type) {
    case 'ride_accepted':
      return theme.success;
    case 'ride_completed':
      return theme.primary;
    case 'payment':
      return theme.info;
    case 'promotion':
      return theme.warning;
    case 'system':
      return theme.muted;
    default:
      return theme.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 45,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
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
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  body: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    marginTop: 8,
  },
});