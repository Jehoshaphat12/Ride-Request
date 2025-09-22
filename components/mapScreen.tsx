import Loader from "@/app/Loader";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Dimensions, StyleSheet, Text } from "react-native";
import CustomMap from "./CustomMap";

export default function MapScreen() {
  const { location, errorMsg } = useCurrentLocation();

  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  if (!location) {
    return <Loader msg="Loading map..." />;
  }

  return (
    <CustomMap
      latitude={location.coords.latitude}
      longitude={location.coords.longitude}
      provider="osm" // change to google later
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});
