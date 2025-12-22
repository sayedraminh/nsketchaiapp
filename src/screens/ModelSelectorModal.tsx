import React from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ModelSelectorRouteProp = RouteProp<RootStackParamList, "ModelSelector">;

export default function ModelSelectorModal() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ModelSelectorRouteProp>();
  const { onSelectModel, currentModel } = route.params;

  const handleSelectModel = (modelName: string) => {
    onSelectModel(modelName);
    navigation.goBack();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#1a1a1a" }}>
      <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: "#1a1a1a" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          bounces={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          <View className="px-5 py-6">
            {/* Seedream v4 */}
            <Pressable
              onPress={() => handleSelectModel("Seedream v4")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/decart.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Seedream v4</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    High-res 2K+ with strong text layout
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Seedream v4 Edit */}
            <Pressable
              onPress={() => handleSelectModel("Seedream v4 Edit")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/decart.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Seedream v4 Edit</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Multi-image editing (up to 10 refs)
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Edit</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Reve */}
            <Pressable
              onPress={() => handleSelectModel("Reve")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/donereve.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Reve</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Detailed visual output with strong aesthetic
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Reve Edit */}
            <Pressable
              onPress={() => handleSelectModel("Reve Edit")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/donereve.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Reve Edit</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Edit and transform images with text
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Edit</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Hunyuan Image 3.0 */}
            <Pressable
              onPress={() => handleSelectModel("Hunyuan Image 3.0")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/bytedance-color.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Hunyuan Image 3.0</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    {"Tencent's latest text-to-image model with fast generation"}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* FLUX Kontext Pro */}
            <Pressable
              onPress={() => handleSelectModel("FLUX Kontext Pro")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/flux.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">FLUX Kontext Pro</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Powerful image-to-image editing
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Edit</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Imagen 4 */}
            <Pressable
              onPress={() => handleSelectModel("Imagen 4")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Imagen 4</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Fast, reliable text-to-image
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Imagen 3 */}
            <Pressable
              onPress={() => handleSelectModel("Imagen 3")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Imagen 3</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    {"Google's most realistic image generation model"}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Nano Banana */}
            <Pressable
              onPress={() => handleSelectModel("Nano Banana")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Nano Banana</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Fast text-to-image generation with aspect ratios
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Nano Banana Edit */}
            <Pressable
              onPress={() => handleSelectModel("Nano Banana Edit")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Nano Banana Edit</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Edit with up to 10 reference images
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Edit</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* GPT-Image 1 */}
            <Pressable
              onPress={() => handleSelectModel("GPT-Image 1")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/openai.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">GPT-Image 1</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    OpenAI text-to-image
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* GPT-Image 1 Edit */}
            <Pressable
              onPress={() => handleSelectModel("GPT-Image 1 Edit")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/openai.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">GPT-Image 1 Edit</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    OpenAI image editing
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Edit</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3 credits</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
