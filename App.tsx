import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ClerkProviderWrapper } from "./src/lib/clerk";
import { ConvexProviderWithClerk } from "./src/lib/convex";
import RootNavigator from "./src/navigation/RootNavigator";
import NetworkBanner from "./src/components/NetworkBanner";

const linking = {
  prefixes: ["nsketchapp://"],
  config: {
    screens: {
      Welcome: "oauth-native-callback",
    },
  },
};

export default function App() {
  return (
    <ClerkProviderWrapper>
      <ConvexProviderWithClerk>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <NavigationContainer linking={linking} theme={{
                  ...DarkTheme,
                  colors: {
                    ...DarkTheme.colors,
                    background: "#000000",
                  },
                }}>
                <NetworkBanner />
                <RootNavigator />
                <StatusBar style="light" />
              </NavigationContainer>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProviderWrapper>
  );
}
