import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export async function requestRide(pickup: string, dropoff: string, passengerId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const rideRef = await addDoc(collection(db, "rides"), {
    passengerId: user.uid,
    pickup,
    dropoff,
    //   pickup: { lat: 0, lng: 0, address: pickup }, // TODO: connect geocoding later
      //   destination: { lat: 0, lng: 0, address: destination }
    status: "pending",
    riderId: null,
    createdAt: serverTimestamp(),
  });

  console.log("Ride created with ID: ", rideRef.id);
  return rideRef.id
  
}


export async function acceptRide(requestId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

//   Get rider details from firestore "Users" collection
const riderDoc = await getDoc(doc(db, "riders", user.uid))
if(!riderDoc.exists()) throw new Error("Rider profile not found")

const riderData = riderDoc.data()

  const requestRef = doc(db, "rides", requestId);
  await updateDoc(requestRef, {
    status: "accepted",
    riderId: user.uid,
    rider: {
        ridername: riderData.userName || "Rider",
        profilePic: riderData.profilePic || null,
        phone: riderData.phone,
        vehicle: {
            model: riderData.vehicleModel || "",
            plateNumber: riderData.vehiclePlate || "",
            color: riderData.vehicleColor || "",
        }
    }
  });
}

