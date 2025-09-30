import { db } from "@/lib/firebaseConfig"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

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