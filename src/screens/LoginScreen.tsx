import React from "react";
import { View, Text, Pressable, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const handleEmailSignIn = () => {
    // Frontend only - simulate sign in
    navigation.replace("Main");
  };

  const handleAppleSignIn = () => {
    // Frontend only - simulate sign in
    navigation.replace("Main");
  };

  const handleGoogleSignIn = () => {
    // Frontend only - simulate sign in
    navigation.replace("Main");
  };

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={{ flex: 1 }}
      >
        {/* Hero Image/3D Art Area */}
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center mb-8">
            {/* App Logo */}
            <Image
              source={require("../../assets/logo.png")}
              style={{
                width: 180,
                height: 180,
                resizeMode: "contain",
              }}
            />
            <Text className="text-white text-2xl font-bold mt-4">
              NSketch
            </Text>
          </View>
        </View>

        {/* Bottom Sign In Section */}
        <View className="px-6 pb-12">
          {/* Email Sign In */}
          <Pressable
            onPress={handleEmailSignIn}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-3"
          >
            <Ionicons name="mail-outline" size={20} color="#000" />
            <Text className="text-black text-base font-semibold ml-2">
              Sign in with email
            </Text>
          </Pressable>

          {/* Apple Sign In */}
          <Pressable
            onPress={handleAppleSignIn}
            className="bg-black rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-3"
            style={{ backgroundColor: "#000" }}
          >
            <Ionicons name="logo-apple" size={20} color="#fff" />
            <Text className="text-white text-base font-semibold ml-2">
              Continue with Apple
            </Text>
          </Pressable>

          {/* Google Sign In */}
          <Pressable
            onPress={handleGoogleSignIn}
            className="bg-white rounded-full py-4 px-6 flex-row items-center justify-center active:opacity-70 mb-6"
          >
            <Ionicons name="logo-google" size={20} color="#000" />
            <Text className="text-black text-base font-semibold ml-2">
              Continue with Google
            </Text>
          </Pressable>

          {/* Sign Up / Forgot Password Links */}
          <View className="items-center">
            <Text className="text-gray-300 text-sm">
              {"Don't have an account? "}
              <Text className="text-blue-400 font-semibold">Sign up</Text>
            </Text>
            <Text className="text-gray-400 text-xs mt-2">
              Forgot password?
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
