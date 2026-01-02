import React from "react";
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { Platform } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import ImagesScreen from "../screens/ImagesScreen";
import VideosScreen from "../screens/VideosScreen";
import EnhancerScreen from "../screens/EnhancerScreen";
import AssetsScreen from "../screens/AssetsScreen";

export type TabParamList = {
  Home: undefined;
  Images: { 
    sessionId?: string; 
    sessionTitle?: string;
    // Incoming generation data from Home screen
    incoming?: {
      prompt: string;
      modelId: string;
      modelLabel: string;
      aspectRatio: string;
      numImages: number;
      imageUrls?: string[];
      autoGenerate?: boolean;
    };
  } | undefined;
  Videos: { 
    sessionId?: string; 
    sessionTitle?: string;
  } | undefined;
  Enhancer: undefined;
  Assets: undefined;
};

const Tab = createNativeBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBarStyle={{
        backgroundColor: "#000000",
      }}
      translucent={false}
      screenOptions={{
        ...(Platform.OS === "ios" && {
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#8E8E93",
        }),
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: () => require("../../assets/homenav.png"),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Images"
        component={ImagesScreen}
        options={{
          tabBarIcon: () => require("../../assets/imagenav.png"),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          tabBarIcon: () => require("../../assets/videonav.png"),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Enhancer"
        component={EnhancerScreen}
        options={{
          tabBarIcon: () => require("../../assets/enhancernav.png"),
          tabBarLabel: "",
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{
          tabBarIcon: () => require("../../assets/assetnav.png"),
          tabBarLabel: "",
        }}
      />
    </Tab.Navigator>
  );
}
