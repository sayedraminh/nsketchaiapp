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
import { useSignUp } from "@clerk/clerk-expo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type EmailSignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "EmailSignUp"
>;

interface EmailSignUpScreenProps {
  navigation: EmailSignUpScreenNavigationProp;
}

export default function EmailSignUpScreen({
  navigation,
}: EmailSignUpScreenProps) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Sign up error:", err);
      Alert.alert(
        "Sign Up Failed",
        err?.errors?.[0]?.message || "Failed to sign up. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [signUp, isLoaded, email, password, isLoading]);

  const handleVerification = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    if (!code.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
      } else {
        console.log("Verification result:", result);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      Alert.alert(
        "Verification Failed",
        err?.errors?.[0]?.message || "Invalid verification code"
      );
    } finally {
      setIsLoading(false);
    }
  }, [signUp, setActive, isLoaded, code, isLoading]);

  if (pendingVerification) {
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
                  onPress={() => setPendingVerification(false)}
                  className="mb-8 w-10 h-10 items-center justify-center"
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>

                <Text className="text-white text-3xl font-bold mb-2">
                  Verify your email
                </Text>
                <Text className="text-gray-400 text-base mb-8">
                  We sent a verification code to {email}
                </Text>

                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2">
                    Verification Code
                  </Text>
                  <View className="bg-white/10 rounded-xl flex-row items-center px-4">
                    <Ionicons
                      name="keypad-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <TextInput
                      className="flex-1 text-white py-4 px-3 text-center text-lg tracking-widest"
                      placeholder="Enter code"
                      placeholderTextColor="#9CA3AF"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleVerification}
                  disabled={isLoading}
                  className="bg-blue-500 rounded-full py-4 items-center justify-center active:opacity-70"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Verify Email
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    );
  }

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
                Create account
              </Text>
              <Text className="text-gray-400 text-base mb-8">
                Join NSketch to start creating AI images
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
                    placeholder="Create a password"
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

              <Pressable
                onPress={handleSignUp}
                disabled={isLoading}
                className="bg-blue-500 rounded-full py-4 items-center justify-center active:opacity-70"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Create Account
                  </Text>
                )}
              </Pressable>

              <View className="items-center mt-6">
                <Text className="text-gray-300 text-sm">
                  Already have an account?{" "}
                  <Text
                    className="text-blue-400 font-semibold"
                    onPress={() => navigation.navigate("EmailSignIn")}
                  >
                    Sign in
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
