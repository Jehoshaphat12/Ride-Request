import { updateRiderLocation } from "@/services/rides"
import * as Location from "expo-location"
import { useEffect } from "react"

export default function RiderTracking({rideId} : {rideId: string}) {
    useEffect(() => {
        let locationSub: Location.LocationSubscription

        (async () => {
            let {status} = await Location.requestForegroundPermissionsAsync()
            if(status !== "granted") {
                console.log("Permission to access location was denied");
                return
                
            }

            locationSub = await Location.watchPositionAsync({accuracy: Location.Accuracy.High, distanceInterval: 10},
                (loc) => {
                    updateRiderLocation(rideId, loc.coords.latitude, loc.coords.longitude)
                }
            )
        }) ()

        return () => {
            if(locationSub) locationSub.remove()
        }
    }, [rideId])

    return null // Or show a map for the rider
}