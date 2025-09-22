import { db } from "@/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";


export function useRideListener(rideId: string) {
    const [rideData, setRideData] = useState<any>(null)

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rides", rideId), (docSnap) => {
            if(docSnap.exists()) {
                setRideData(docSnap.data())
            }
        })

        return () => unsub()
    }, [rideId])

    return rideData
}