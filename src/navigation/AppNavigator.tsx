import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import AspectRatioModal from "../screens/AspectRatioModal";
import SettingsScreen from "../screens/SettingsScreen";

export type AppStackParamList = {
  Main: undefined;
  Settings: undefined;
  AspectRatioModal: {
    onSelect: (ratio: string) => void;
    currentRatio: string;
  };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Group screenOptions={{ presentation: "transparentModal" }}>
        <Stack.Screen name="AspectRatioModal" component={AspectRatioModal} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
