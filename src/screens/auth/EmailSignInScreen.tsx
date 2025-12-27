import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/clerk-expo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type EmailSignInScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "EmailSignIn"
>;

interface EmailSignInScreenProps {
  navigation: EmailSignInScreenNavigationProp;
}

export default function EmailSignInScreen({
  navigation,
}: EmailSignInScreenProps) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
      } else {
        console.log("Sign in result:", result);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      Alert.alert(
        "Sign In Failed",
        err?.errors?.[0]?.message || "Failed to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [signIn, setActive, isLoaded, email, password, isLoading]);

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <View className="flex-1 bg-[#1a1a2e]">
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 pt-16">
              <Pressable
                onPress={() => navigation.goBack()}
                className="mb-8 w-10 h-10 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </Pressable>

              <Text className="text-white text-3xl font-bold mb-2">
                Welcome back
              </Text>
              <Text className="text-gray-400 text-base mb-8">
                Sign in to continue creating amazing images
              </Text>

              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2">Email</Text>
                <View className="bg-white/10 rounded-xl flex-row items-center px-4">
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 text-white py-4 px-3"
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 text-sm mb-2">Password</Text>
                <View className="bg-white/10 rounded-xl flex-row items-center px-4">
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                  <TextInput
                    className="flex-1 text-white py-4 px-3"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={handleForgotPassword} className="mb-6">
                <Text className="text-blue-400 text-sm text-right">
                  Forgot password?
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSignIn}
                disabled={isLoading}
                className="bg-blue-500 rounded-full py-4 items-center justify-center active:opacity-70"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Sign In
                  </Text>
                )}
              </Pressable>

              <View className="items-center mt-6">
                <Text className="text-gray-300 text-sm">
                  {"Don't have an account? "}
                  <Text
                    className="text-blue-400 font-semibold"
                    onPress={() => navigation.navigate("EmailSignUp")}
                  >
                    Sign up
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
