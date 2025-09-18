import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function requestRide(pickup: string, dropoff: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  await addDoc(collection(db, "rideRequests"), {
    passengerId: user.uid,
    pickup,
    dropoff,
    status: "pending",
    riderId: null,
    createdAt: serverTimestamp(),
  });
}
