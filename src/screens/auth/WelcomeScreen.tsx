import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSSO, useAuth } from "@clerk/clerk-expo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Welcome"
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { startSSOFlow } = useSSO();
  const { isSignedIn } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      Alert.alert(
        "Sign In Failed",
        err?.errors?.[0]?.message || "Failed to sign in with Google"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  }, [startSSOFlow, isGoogleLoading]);

  const handleAppleSignIn = useCallback(async () => {
    if (isAppleLoading) return;
    setIsAppleLoading(true);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error("Apple OAuth error:", err);
      Alert.alert(
        "Sign In Failed",
        err?.errors?.[0]?.message || "Failed to sign in with Apple"
      );
    } finally {
      setIsAppleLoading(false);
    }
  }, [startSSOFlow, isAppleLoading]);

  const handleEmailSignIn = () => {
    navigation.navigate("EmailSignIn");
  };

  const handleSignUp = () => {
    navigation.navigate("EmailSignUp");
  };

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center mb-8">
            <Image
              source={require("../../../assets/logo.png")}
              style={{
                width: 180,
                height: 180,
              }}
              contentFit="contain"
            />
            <Text className="text-white text-2xl font-bold mt-4">NSketch</Text>
            <Text className="text-gray-400 text-center mt-2">
              Create stunning AI-generated images
            </Text>
          </View>
        </View>

        <View className="px-6 pb-12">
          <Pressable
            onPress={handleEmailSignIn}
            disabled={isGoogleLoading || isAppleLoading}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-3"
          >
            <Ionicons name="mail-outline" size={20} color="#000" />
            <Text className="text-black text-base font-semibold ml-2">
              Sign in with email
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAppleSignIn}
            disabled={isGoogleLoading || isAppleLoading}
            className="bg-black rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-3"
            style={{ backgroundColor: "#000" }}
          >
            {isAppleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text className="text-white text-base font-semibold ml-2">
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || isAppleLoading}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-6"
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text className="text-black text-base font-semibold ml-2">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <View className="items-center">
            <Text className="text-gray-300 text-sm">
              {"Don't have an account? "}
              <Text
                className="text-blue-400 font-semibold"
                onPress={handleSignUp}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
