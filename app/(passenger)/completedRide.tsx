import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RideCompletedScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ride, setRide] = useState<any>(null);
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { darkMode } = useTheme();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;

  useEffect(() => {
    if (!rideId) {
      Alert.alert("Error", "Ride ID not provided");
      router.back();
      return;
    }

    const fetchRideData = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data();
          setRide(rideData);

          // Fetch rider details
          if (rideData.riderId) {
            const riderDoc = await getDoc(doc(db, "users", rideData.riderId));
            if (riderDoc.exists()) {
              setRider(riderDoc.data());
            }
          }
        } else {
          Alert.alert("Error", "Ride not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching ride data:", error);
        Alert.alert("Error", "Failed to load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId]);

  const calculateFare = (baseFare: number = 5, distance: number = 10, duration: number = 22) => {
    // Simple fare calculation - you can replace with your actual logic
    const distanceRate = 1.5; // GHS per km
    const timeRate = 0.5; // GHS per minute
    return baseFare + (distance * distanceRate) + (duration * timeRate);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert("Please Rate", "Please select a star rating before submitting");
      return;
    }

    if (!rideId || !ride?.riderId) {
      Alert.alert("Error", "Cannot submit rating - missing ride information");
      return;
    }

    setSubmitting(true);
    try {
      // Update ride with rating and feedback
      await updateDoc(doc(db, "rides", rideId), {
        passengerRating: rating,
        passengerFeedback: feedback,
        ratedAt: serverTimestamp(),
        status: "rated", // Mark as rated
      });

      // Update rider's overall rating
      if (rider) {
        const currentRating = rider.rating || 0;
        const totalRatings = rider.totalRatings || 0;
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

        await updateDoc(doc(db, "users", ride.riderId), {
          rating: newRating,
          totalRatings: newTotalRatings,
          updatedAt: serverTimestamp(),
        });
      }

      // Create notification for rider
      const passengerName = ride.passengerInfo?.name || "A passenger";
      await updateDoc(doc(db, "notifications", `rating_${rideId}`), {
        type: "new_rating",
        rideId: rideId,
        riderId: ride.riderId,
        passengerId: ride.passengerId,
        rating: rating,
        message: `${passengerName} rated you ${rating} stars`,
        createdAt: serverTimestamp(),
        read: false,
      });

      Alert.alert(
        "Thank You!", 
        "Your rating has been submitted successfully.",
        [{ text: "OK", onPress: () => router.replace("/(passenger)/passengerScreen") }]
      );

    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: darkMode ? "#000" : "#fff" }]}>
        <ActivityIndicator size="large" color="#7500fc" />
        <Text style={[styles.loadingText, { color: darkMode ? "#fff" : "#666" }]}>
          Loading ride summary...
        </Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: darkMode ? "#000" : "#fff" }]}>
        <Ionicons name="alert-circle" size={48} color="#ff3b30" />
        <Text style={[styles.errorText, { color: darkMode ? "#fff" : "#ff3b30" }]}>
          Ride not found
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fare = ride.fare || calculateFare();
  const duration = ride.duration || 22;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? "#000" : "#fff" }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={80} color="#28a745" />
          <Text style={[styles.successText, { color: darkMode ? "#fff" : "#000" }]}>
            Ride Completed
          </Text>
          <Text style={[styles.subtitle, { color: darkMode ? "#ccc" : "#666" }]}>
            Thank you for riding with us!
          </Text>
        </View>

        {/* Ride Info */}
        <View style={[styles.card, { backgroundColor: darkMode ? "#1c1c1e" : "#f8f9fa" }]}>
          <Text style={[styles.title, { color: darkMode ? "#fff" : "#000" }]}>
            Trip Summary
          </Text>
          
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color="#7500fc" />
            <Text style={[styles.value, { color: darkMode ? "#ccc" : "#666" }]}>
              {ride.pickup?.address || ride.pickup || "Pickup location"}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="flag-outline" size={20} color="#7500fc" />
            <Text style={[styles.value, { color: darkMode ? "#ccc" : "#666" }]}>
              {ride.destination?.address || ride.dropoff || "Destination"}
            </Text>
          </View>

          {/* <View style={styles.row}>
            <Ionicons name="cash-outline" size={20} color="#7500fc" />
            <Text style={[styles.value, { color: darkMode ? "#ccc" : "#666" }]}>
              Fare: {formatCurrency(fare)}
            </Text>
          </View> */}

          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#7500fc" />
            <Text style={[styles.value, { color: darkMode ? "#ccc" : "#666" }]}>
              Duration: {formatDuration(duration)}
            </Text>
          </View>

          {/* {ride.completedAt && (
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={20} color="#7500fc" />
              <Text style={[styles.value, { color: darkMode ? "#ccc" : "#666" }]}>
                Completed: {new Date(ride.completedAt.toDate()).toLocaleDateString()}
              </Text>
            </View>
          )} */}
        </View>

        {/* Driver Info */}
        <View style={[styles.driverCard, { backgroundColor: darkMode ? "#1c1c1e" : "#f8f9fa" }]}>
          <Image
            source={
              ride.riderInfo?.profilePicture || rider?.profilePicture
                ? { uri: ride.riderInfo?.profilePicture || rider?.profilePicture }
                : require("../../assets/images/defaultUserImg.png")
            }
            style={styles.driverPic}
            contentFit="cover"
          />
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, { color: darkMode ? "#fff" : "#000" }]}>
              {ride.riderInfo?.name || rider?.name || "Driver"}
            </Text>
            <Text style={[styles.driverRating, { color: darkMode ? "#ccc" : "#666" }]}>
              ⭐ {rider?.rating?.toFixed(1) || "4.8"} ({rider?.totalRatings || "200"} ratings)
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={[styles.ratingBox, { backgroundColor: darkMode ? "#1c1c1e" : "#f8f9fa" }]}>
          <Text style={[styles.label, { color: darkMode ? "#fff" : "#000" }]}>
            Rate Your Driver
          </Text>
          
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity 
                key={num} 
                onPress={() => setRating(num)}
                disabled={submitting}
              >
                <Ionicons
                  name={num <= rating ? "star" : "star-outline"}
                  size={36}
                  color="#f5c518"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingHint, { color: darkMode ? "#ccc" : "#666" }]}>
            {rating === 0 ? "Tap a star to rate" : `You rated ${rating} star${rating !== 1 ? 's' : ''}`}
          </Text>

          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: darkMode ? "#333" : "#ddd", 
                color: darkMode ? "#fff" : "#000",
                backgroundColor: darkMode ? "#2c2c2e" : "#fff"
              }
            ]}
            placeholder="Leave a comment (optional)..."
            placeholderTextColor={darkMode ? "#666" : "#999"}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={3}
            editable={!submitting}
          />
          

          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              submitting && styles.submitBtnDisabled
            ]} 
            onPress={handleSubmitRating}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {rating === 0 ? "Select Rating First" : "Submit Rating"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.skipButton, { borderColor: darkMode ? "#333" : "#ddd" }]}
            onPress={() => router.replace("/(passenger)/passengerScreen")}
            disabled={submitting}
          >
            <Text style={[styles.skipText, { color: darkMode ? "#ccc" : "#666" }]}>
              Skip Rating
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  successBox: { 
    alignItems: "center", 
    marginVertical: 20,
    marginBottom: 30,
  },
  successText: { 
    fontSize: 28, 
    fontWeight: "700", 
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 16,
  },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
  },
  value: { 
    fontSize: 16, 
    marginLeft: 12,
    flex: 1,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  driverPic: { 
    width: 60, 
    height: 60, 
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  driverInfo: {
    marginLeft: 16,
    flex: 1,
  },
  driverName: { 
    fontSize: 18, 
    fontWeight: "700",
    marginBottom: 2,
  },
  driverRating: { 
    fontSize: 14,
  },
  ratingBox: { 
    padding: 20, 
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 16,
    textAlign: "center",
  },
  starRow: { 
    flexDirection: "row", 
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  ratingHint: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#7500fc",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  skipButton: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#7500fc",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});