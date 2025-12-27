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

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pendingReset, setPendingReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestReset = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setPendingReset(true);
    } catch (err: any) {
      console.error("Reset request error:", err);
      Alert.alert(
        "Error",
        err?.errors?.[0]?.message || "Failed to send reset code"
      );
    } finally {
      setIsLoading(false);
    }
  }, [signIn, isLoaded, email, isLoading]);

  const handleResetPassword = useCallback(async () => {
    if (!isLoaded || isLoading) return;
    if (!code.trim() || !newPassword.trim()) {
      Alert.alert("Error", "Please enter the code and new password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });

      if (result?.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      Alert.alert(
        "Error",
        err?.errors?.[0]?.message || "Failed to reset password"
      );
    } finally {
      setIsLoading(false);
    }
  }, [signIn, setActive, isLoaded, code, newPassword, isLoading]);

  if (pendingReset) {
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
                  onPress={() => setPendingReset(false)}
                  className="mb-8 w-10 h-10 items-center justify-center"
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>

                <Text className="text-white text-3xl font-bold mb-2">
                  Reset password
                </Text>
                <Text className="text-gray-400 text-base mb-8">
                  Enter the code sent to {email} and your new password
                </Text>

                <View className="mb-4">
                  <Text className="text-gray-300 text-sm mb-2">
                    Reset Code
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

                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2">
                    New Password
                  </Text>
                  <View className="bg-white/10 rounded-xl flex-row items-center px-4">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      value={newPassword}
                      onChangeText={setNewPassword}
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
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  className="bg-blue-500 rounded-full py-4 items-center justify-center active:opacity-70"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Reset Password
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
                Forgot password?
              </Text>
              <Text className="text-gray-400 text-base mb-8">
                Enter your email and we'll send you a reset code
              </Text>

              <View className="mb-6">
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

              <Pressable
                onPress={handleRequestReset}
                disabled={isLoading}
                className="bg-blue-500 rounded-full py-4 items-center justify-center active:opacity-70"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Send Reset Code
                  </Text>
                )}
              </Pressable>

              <View className="items-center mt-6">
                <Text className="text-gray-300 text-sm">
                  Remember your password?{" "}
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
