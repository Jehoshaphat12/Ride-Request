import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

// Configure handler (how notifications behave when received)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // show pop-up
    shouldPlaySound: true,   // play sound
    shouldSetBadge: false,   // iOS app badge
  }),
});




// Ask permission + prepare channel (Android needs a channel)
export async function registerNotificationPermissions() {
  if (!Device.isDevice) {
    alert("Must use physical device for Notifications");
    return;
  }

   if (Platform.OS === "web") return; // no system permissions needed on web

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission not granted for notifications!");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

export function showNotification(title: string, body: string) {
  if (Platform.OS === "web") {
    // ✅ Web fallback: toast
    Toast.show({
      type: "info",
      text1: title,
      text2: body,
      position: "top",
      visibilityTime: 4000,
    });
  } else {
    // ✅ Mobile: expo-notifications
    Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  }
}

// Utility function to show notification
export async function showLocalNotification(
  title: string,
  body: string
) {
  if(Platform.OS === "web") {
    console.log("[WEB] Notification:", title, body);
    return
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // null = show immediately
  });
}

// Predefined helpers for ride flow
export const notifyRideRequested = () =>
  showLocalNotification("Ride Requested 🚕", "Looking for a driver…");

export const notifyRideAccepted = () =>
  showLocalNotification("Driver Found 🎉", "Your driver is on the way!");

export const notifyDriverArrived = () =>
  showLocalNotification("Driver Arrived ✅", "Your driver is waiting at pickup.");

export const notifyRideCompleted = () =>
  showLocalNotification("Ride Completed 🎊", "Thanks for riding with us!");
export const notifyRideCancelled = () =>
  showLocalNotification("Ride Cancelled ❌", "Your ride has been cancelled.");


export async function notifyNewRideRequest() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🚖 New Ride Request",
      body: "A passenger is looking for a ride near you!",
    },
    trigger: null,
  });
}

export async function notifyPassengerCancelled() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "❌ Ride Cancelled",
      body: "The passenger has cancelled this ride.",
    },
    trigger: null,
  });
}