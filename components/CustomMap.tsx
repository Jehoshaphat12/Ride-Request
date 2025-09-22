import { Dimensions, StyleSheet, View } from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"

type Props = {
    latitude: number
    longitude: number
    provider?: "osm" | "google"
}

export default function CustomMap({latitude, longitude, provider = "osm"}: Props) {
    return (
        <View style={styles.container}>
            <MapView style={styles.map}
            provider={provider === "google" ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            }}
            showsUserLocation={true}
            >
                <Marker coordinate={{latitude, longitude}} title="You are here"/>
            </MapView>
        </View>
    )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});