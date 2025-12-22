import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";
import AspectRatioModal from "../screens/AspectRatioModal";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AspectRatioModal: {
    onSelect: (ratio: string) => void;
    currentRatio: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Group screenOptions={{ presentation: "transparentModal" }}>
        <Stack.Screen name="AspectRatioModal" component={AspectRatioModal} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
