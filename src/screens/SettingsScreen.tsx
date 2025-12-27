import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "Settings"
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  showChevron?: boolean;
  showExternalLink?: boolean;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({
  icon,
  iconColor = "#fff",
  title,
  subtitle,
  rightText,
  showChevron = false,
  showExternalLink = false,
  onPress,
  danger = false,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-4 active:opacity-70"
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: danger ? "rgba(239, 68, 68, 0.15)" : "#2a2a2a" }}
      >
        <Ionicons name={icon} size={18} color={danger ? "#ef4444" : iconColor} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${danger ? "text-red-500" : "text-white"}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      {rightText && (
        <Text className="text-gray-400 text-sm mr-2">{rightText}</Text>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
      )}
      {showExternalLink && (
        <Ionicons name="open-outline" size={16} color="#6b7280" />
      )}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-gray-500 text-sm font-medium px-4 pt-6 pb-2 uppercase tracking-wide">
      {title}
    </Text>
  );
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const userInitials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`
    : user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || "?";

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <View style={{ width: 40 }} />
          <Text className="text-white text-lg font-semibold">Settings</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
            style={{ backgroundColor: "#2a2a2a" }}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View className="items-center py-6">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#4a5568",
                }}
              >
                <Text className="text-white text-2xl font-semibold">
                  {userInitials}
                </Text>
              </View>
            )}
            <Text className="text-white text-xl font-semibold mt-3">
              {user?.fullName || user?.firstName || "User"}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </Text>
          </View>

          {/* Account Section */}
          <SectionHeader title="Account" />
          <View
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <SettingsRow
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              showChevron
              onPress={() => {}}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="diamond-outline"
              title="Subscription"
              subtitle="Manage your plan"
              rightText="Free"
              showChevron
              onPress={() => {}}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="refresh-outline"
              title="Restore Purchases"
              onPress={() => {}}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="log-out-outline"
              title="Sign Out"
              subtitle="Sign out of your account"
              showChevron
              onPress={handleSignOut}
              danger
            />
          </View>

          {/* Community Section */}
          <SectionHeader title="Community" />
          <View
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <SettingsRow
              icon="logo-discord"
              iconColor="#5865F2"
              title="Discord"
              subtitle="Join our community server"
              showExternalLink
              onPress={() => handleOpenLink("https://discord.gg/nsketch")}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="logo-instagram"
              iconColor="#E4405F"
              title="Instagram"
              subtitle="Follow us for updates and inspiration"
              showExternalLink
              onPress={() => handleOpenLink("https://instagram.com/nsketchai")}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="logo-twitter"
              title="X (Twitter)"
              subtitle="Get the latest news and updates"
              showExternalLink
              onPress={() => handleOpenLink("https://x.com/nsketchai")}
            />
          </View>

          {/* Support & Info Section */}
          <SectionHeader title="Support & Info" />
          <View
            className="mx-4 rounded-2xl overflow-hidden mb-8"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <SettingsRow
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help and contact support"
              showChevron
              onPress={() => {}}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="document-text-outline"
              title="Terms of Use"
              subtitle="Read our terms and conditions"
              showExternalLink
              onPress={() => handleOpenLink("https://nsketch.ai/terms")}
            />
            <View className="h-px bg-gray-800 mx-4" />
            <SettingsRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Learn how we protect your data"
              showExternalLink
              onPress={() => handleOpenLink("https://nsketch.ai/privacy")}
            />
          </View>

          {/* App Version */}
          <View className="items-center pb-8">
            <Text className="text-gray-600 text-xs">NSketch v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
