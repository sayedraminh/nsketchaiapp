import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from "react-native-reanimated";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useAssets, AssetItem } from "../hooks/useAssets";
import NetworkBanner from "../components/NetworkBanner";
import AssetDetailSheet from "../components/AssetDetailSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

type FilterType = "all" | "image" | "video" | "edit" | "favorites";

const filterOptions: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "edit", label: "Enhanced" },
  { id: "favorites", label: "Favorites" },
];

export default function AssetsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const assetDetailSheetRef = useRef<BottomSheetModal>(null);

  // Use the new useAssets hook with offline support
  const {
    assets,
    favorites,
    isLoading,
    isLoadingMore,
    isOffline,
    hasPendingActions,
    hasMore,
    deleteAsset,
    toggleFavorite,
    refreshAssets,
    loadMore,
  } = useAssets();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return { opacity };
  });

  // Filter assets
  const filteredAssets = useMemo(() => {
    if (selectedFilter === "all") return assets;
    if (selectedFilter === "image") return assets.filter((a) => a.mediaType === "image" && !a.isEnhanced);
    if (selectedFilter === "video") return assets.filter((a) => a.mediaType === "video");
    if (selectedFilter === "edit") return assets.filter((a) => a.isEnhanced);
    if (selectedFilter === "favorites") return assets.filter((a) => a.isFavorite);
    return assets;
  }, [assets, selectedFilter]);

  // Counts for header
  const imageCount = assets.filter((a) => a.mediaType === "image").length;
  const videoCount = assets.filter((a) => a.mediaType === "video").length;
  const favoritesCount = assets.filter((a) => a.isFavorite).length;

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshAssets();
    // Give time for sync to complete
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refreshAssets]);

  // Handle opening asset detail sheet
  const handleOpenAssetDetail = useCallback((asset: AssetItem) => {
    setSelectedAsset(asset);
    assetDetailSheetRef.current?.present();
  }, []);

  // Handle closing asset detail sheet
  const handleCloseAssetDetail = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  // Handle delete asset
  const handleDeleteAsset = useCallback(async (asset: AssetItem) => {
    try {
      await deleteAsset(asset.generationId, asset.mediaType, asset.index);
    } catch (error) {
      Alert.alert("Error", "Failed to delete asset. Please try again.");
    }
  }, [deleteAsset]);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(async (asset: AssetItem) => {
    try {
      await toggleFavorite(asset.generationId, asset.mediaType, asset.index);
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite. Please try again.");
    }
  }, [toggleFavorite]);

  const renderAssetTile = useCallback(({ item }: { item: AssetItem }) => (
    <Pressable
      onPress={() => handleOpenAssetDetail(item)}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: GRID_GAP / 2,
      }}
      className="active:opacity-80"
    >
      <Image
        source={item.previewUrl || item.url}
        style={{ width: "100%", height: "100%", borderRadius: 4 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      {/* Video indicator */}
      {item.mediaType === "video" && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="bg-black/50 rounded-full p-2">
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
      )}
      {/* Favorite indicator */}
      {item.isFavorite && (
        <View className="absolute top-1 left-1">
          <Ionicons name="heart" size={16} color="#ef4444" />
        </View>
      )}
      {/* Enhanced badge */}
      {item.isEnhanced && (
        <View className="absolute top-1 right-1 bg-purple-500 rounded px-1.5 py-0.5">
          <Text className="text-white text-[10px] font-semibold">Enhanced</Text>
        </View>
      )}
    </Pressable>
  ), [handleOpenAssetDetail]);

  return (
    <View className="flex-1 bg-black">
      {/* Network Banner */}
      <NetworkBanner />
      
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Blurred Header with Animated Opacity */}
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }, headerAnimatedStyle]}>
          <BlurView intensity={80} tint="dark" style={{ width: "100%", height: "100%" }}>
            <LinearGradient
              colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)", "transparent"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <SafeAreaView edges={["top"]}>
              <View className="px-4 py-3">
                <View className="flex-row items-center">
                  <Text className="text-white text-2xl font-bold">All Assets</Text>
                  {isOffline && (
                    <View className="ml-2 bg-yellow-600 rounded px-2 py-0.5">
                      <Text className="text-white text-xs font-medium">Offline</Text>
                    </View>
                  )}
                  {hasPendingActions && (
                    <View className="ml-2 bg-blue-600 rounded px-2 py-0.5">
                      <Text className="text-white text-xs font-medium">Syncing...</Text>
                    </View>
                  )}
                </View>
                {!isLoading && assets.length > 0 && (
                  <Text className="text-gray-500 text-sm mt-1">
                    {imageCount} images · {videoCount} videos · {favoritesCount} favorites
                  </Text>
                )}
              </View>
            </SafeAreaView>
          </BlurView>
        </Animated.View>

        {/* Static Header (always visible underneath) */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9 }}>
          <SafeAreaView edges={["top"]}>
            <View className="px-4 py-3">
              <View className="flex-row items-center">
                <Text className="text-white text-2xl font-bold">All Assets</Text>
                {isOffline && (
                  <View className="ml-2 bg-yellow-600 rounded px-2 py-0.5">
                    <Text className="text-white text-xs font-medium">Offline</Text>
                  </View>
                )}
                {hasPendingActions && (
                  <View className="ml-2 bg-blue-600 rounded px-2 py-0.5">
                    <Text className="text-white text-xs font-medium">Syncing...</Text>
                  </View>
                )}
              </View>
              {!isLoading && assets.length > 0 && (
                <Text className="text-gray-500 text-sm mt-1">
                  {imageCount} images · {videoCount} videos · {favoritesCount} favorites
                </Text>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* Filter Bar */}
        <View className="flex-row px-4 pb-3" style={{ marginTop: 70 }}>
        {filterOptions.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => setSelectedFilter(filter.id)}
            className="mr-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: selectedFilter === filter.id ? "#fff" : "#1a1a1a",
            }}
          >
            <Text
              style={{
                color: selectedFilter === filter.id ? "#000" : "#fff",
                fontWeight: selectedFilter === filter.id ? "600" : "400",
              }}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-gray-500 text-sm mt-3">Loading assets...</Text>
        </View>
      ) : assets.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="images-outline" size={64} color="#4b5563" />
          <Text className="text-white text-lg font-semibold mt-4">
            {isOffline ? "No cached assets" : "No assets yet"}
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            {isOffline
              ? "Connect to the internet to load your assets."
              : "Create images or videos and they'll appear here automatically."}
          </Text>
        </View>
      ) : filteredAssets.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="filter-outline" size={64} color="#4b5563" />
          <Text className="text-white text-lg font-semibold mt-4">No matching assets</Text>
          <Text className="text-gray-500 text-center mt-2">
            Try a different filter to see more assets.
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredAssets}
          renderItem={renderAssetTile}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{
            paddingHorizontal: GRID_GAP / 2,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReached={() => {
            if (hasMore && !isLoadingMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-gray-500 text-sm mt-2">Loading more...</Text>
              </View>
            ) : hasMore ? (
              <View className="py-6 items-center">
                <Text className="text-gray-600 text-sm">Scroll for more</Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
              colors={["#fff"]}
            />
          }
        />
      )}

      {/* Asset Detail Sheet */}
      <AssetDetailSheet
        ref={assetDetailSheetRef}
        asset={selectedAsset}
        onClose={handleCloseAssetDetail}
        onDelete={handleDeleteAsset}
        onToggleFavorite={handleToggleFavorite}
      />
      </SafeAreaView>
    </View>
  );
}
