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
  Images: { sessionId?: string; sessionTitle?: string } | undefined;
  Videos: undefined;
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
        }}
      />
      <Tab.Screen
        name="Images"
        component={ImagesScreen}
        options={{
          tabBarIcon: () => require("../../assets/imagenav.png"),
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          tabBarIcon: () => require("../../assets/videonav.png"),
        }}
      />
      <Tab.Screen
        name="Enhancer"
        component={EnhancerScreen}
        options={{
          tabBarIcon: () => require("../../assets/enhancernav.png"),
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{
          tabBarIcon: () => require("../../assets/assetnav.png"),
        }}
      />
    </Tab.Navigator>
  );
}
