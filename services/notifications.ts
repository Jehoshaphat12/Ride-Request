import { auth, db } from "@/lib/firebaseConfig"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore"

export async function addNotification(userId: string, type: string, title: string, body: string, rideId?: string) {
    const notifRef = collection(db, "users", userId, "notifications")

    await addDoc(notifRef, {
        type,
        title,
        body,
        rideId: rideId || null,
        createdAt: serverTimestamp(),
        read: false
    })
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if(Device.isDevice) {
        const {status: existingStatus} = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if(existingStatus !== "granted") {
            const {status} = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        token = (await Notifications.getExpoPushTokenAsync()).data

        // Save token to Firestore under user's document
        if(auth.currentUser) {
            const useRef = doc(db, "users", auth.currentUser.uid)
            await setDoc(useRef, {expoPushToken: token}, {merge: true})
        }
    } else {
        alert("Must use physical device for push notifications")
    }

    return token
}