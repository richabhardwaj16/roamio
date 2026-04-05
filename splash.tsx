import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";

export default function Splash() {
  const { user, loading } = useAuth();
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [loadingText, setLoadingText] = useState("Analyzing your travel DNA...");

  const loaderOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const blurAnim = useRef(new Animated.Value(8)).current;
  const sweepAnim = useRef(new Animated.Value(-300)).current;
  const fadeOut = useRef(new Animated.Value(0)).current;

  const [displayText, setDisplayText] = useState("");
  const fullText = "Your trip, your tribe.";

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          Animated.timing(loaderOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            setPhase("brand");
            startBrandAnimation();
          });

          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const animateSparkle = (anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -30,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateSparkle(sparkle1);
    animateSparkle(sparkle2);
    animateSparkle(sparkle3);

    return () => clearInterval(interval);
  }, [loading, loaderOpacity, sparkle1, sparkle2, sparkle3]);

  useEffect(() => {
    let newText = "";

    if (percent < 40) {
      newText = "Analyzing your travel DNA...";
    } else if (percent < 80) {
      newText = "Finding your tribe...";
    } else {
      newText = "Welcome to Roamio.";
    }

    Animated.sequence([
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setLoadingText(newText);
  }, [percent, textOpacity]);

  const startBrandAnimation = () => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(blurAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(sweepAnim, {
        toValue: 300,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      let i = 0;
      const interval = setInterval(() => {
        setDisplayText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(interval);

          setTimeout(() => {
            Animated.timing(fadeOut, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }).start(() => {
              router.replace(user ? "/(tabs)/home" : "/(auth)/welcome");
            });
          }, 2000);
        }
      }, 60);
    });
  };

  const angle = percent * 3.6 - 90; // Start at top

  return (
    <View style={styles.container}>
      {phase === "loading" && (
        <Animated.View style={{ opacity: loaderOpacity, alignItems: "center" }}>
          <View style={styles.circle}>
            <Text style={styles.percent}>{percent}%</Text>
          </View>

          <View
            style={[
              styles.orbitWrapper,
              { transform: [{ rotate: `${angle}deg` }] },
            ]}
          >
            <View style={styles.planeContainer}>
              <Ionicons name="airplane" size={22} color="#4FD1C5" />
            </View>
          </View>

          <Animated.View style={[styles.sparkle, {
            top: "35%",
            left: "25%",
            transform: [{ translateY: sparkle1 }]
          }]} />

          <Animated.View style={[styles.sparkle, {
            top: "55%",
            right: "20%",
            transform: [{ translateY: sparkle2 }]
          }]} />

          <Animated.View style={[styles.sparkle, {
            top: "45%",
            left: "70%",
            transform: [{ translateY: sparkle3 }]
          }]} />

          <Animated.Text
            style={[styles.loadingText, { opacity: textOpacity }]}
          >
            {loadingText}
          </Animated.Text>
        </Animated.View>
      )}

      {phase === "brand" && (
        <>
          <Image
            source={require("../assets/splash.png")}
            style={styles.bgLogo}
            resizeMode="contain"
          />

          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Animated.Image
              source={require("../assets/splash.png")}
              style={styles.logo}
              blurRadius={blurAnim}
              resizeMode="contain"
            />

            <Animated.View
              style={[
                styles.sweep,
                { transform: [{ translateX: sweepAnim }] },
              ]}
            />

            <Text style={styles.tagline}>{displayText}</Text>
          </Animated.View>
        </>
      )}

      <Animated.View
        style={[
          styles.fadeOverlay,
          { opacity: fadeOut },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1320",
    justifyContent: "center",
    alignItems: "center",
  },

  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: "#4FD1C5",
    justifyContent: "center",
    alignItems: "center",
  },

  percent: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4FD1C5",
  },

  orbitWrapper: {
    position: "absolute",
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },

  planeContainer: {
    position: "absolute",
    top: -8,
  },

  loadingText: {
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 14,
  },

  sparkle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4FD1C5",
    opacity: 0.4,
  },

  bgLogo: {
    position: "absolute",
    width: 500,
    height: 500,
    opacity: 0.05,
  },

  logoContainer: {
    alignItems: "center",
  },

  logo: {
    width: 200,
    height: 200,
  },

  tagline: {
    marginTop: 30,
    fontSize: 16,
    color: "#9CA3AF",
    letterSpacing: 1,
  },

  sweep: {
    position: "absolute",
    width: 60,
    height: 220,
    backgroundColor: "rgba(79,209,197,0.25)",
    transform: [{ rotate: "20deg" }],
  },

  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
});
