import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BlurView } from "expo-blur";

type AspectRatioModalRouteProp = RouteProp<
  {
    AspectRatioModal: {
      onSelect: (ratio: string) => void;
      currentRatio: string;
    };
  },
  "AspectRatioModal"
>;

export default function AspectRatioModal() {
  const navigation = useNavigation();
  const route = useRoute<AspectRatioModalRouteProp>();
  const { onSelect, currentRatio } = route.params;

  const aspectRatios = [
    { label: "21:9", width: 70, height: 28 },
    { label: "1:1", width: 50, height: 50 },
    { label: "4:3", width: 54, height: 40 },
    { label: "3:2", width: 60, height: 40 },
    { label: "2:3", width: 40, height: 60 },
    { label: "5:4", width: 50, height: 40 },
    { label: "4:5", width: 40, height: 50 },
    { label: "3:4", width: 40, height: 54 },
    { label: "16:9", width: 64, height: 36 },
    { label: "9:16", width: 36, height: 64 },
  ];

  const handleSelect = (ratio: string) => {
    onSelect(ratio);
    navigation.goBack();
  };

  return (
    <Pressable
      className="flex-1"
      onPress={() => navigation.goBack()}
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <View className="absolute" style={{ top: 120, left: 20, right: 20, bottom: 100 }}>
        {/* Pointer arrow */}
        <View className="items-center" style={{ marginLeft: 140 }}>
          <View
            style={{
              width: 0,
              height: 0,
              backgroundColor: "transparent",
              borderStyle: "solid",
              borderLeftWidth: 12,
              borderRightWidth: 12,
              borderBottomWidth: 12,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: "rgba(60, 60, 60, 0.95)",
            }}
          />
        </View>

        <BlurView
          intensity={100}
          tint="dark"
          style={{
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "rgba(60, 60, 60, 0.7)",
            flex: 1,
          }}
        >
          <View className="flex-1 p-6">
            <Text className="text-white text-center text-lg font-semibold mb-4">
              Select Aspect Ratio
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="flex-row flex-wrap justify-center">
                {aspectRatios.map((ratio) => (
                  <Pressable
                    key={ratio.label}
                    onPress={() => handleSelect(ratio.label)}
                    className="items-center mb-5 mx-2"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: ratio.width,
                        height: ratio.height,
                        borderWidth: 2,
                        borderColor: ratio.label === currentRatio ? "#fff" : "#888",
                        borderRadius: 8,
                        backgroundColor: ratio.label === currentRatio
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      }}
                    />
                    <Text className="text-white text-center text-sm font-medium mt-2">
                      {ratio.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}
