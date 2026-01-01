import React, {
  useCallback,
  useMemo,
  forwardRef,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAssets, AssetItem } from "../hooks/useAssets";

interface Props {
  maxSelection?: number;
  allowMultiple?: boolean;
  onSelectImages: (images: { url: string; uri: string }[]) => void;
  onClose: () => void;
}

type TabType = "favorites" | "all";

const AssetPickerSheet = forwardRef<BottomSheetModal, Props>(
  ({ maxSelection = 10, allowMultiple = true, onSelectImages, onClose }, ref) => {
    const internalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const { assets, favorites, isLoading, loadMore, hasMore, isLoadingMore } = useAssets();

    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const snapPoints = useMemo(
      () => [height - insets.top],
      [height, insets.top]
    );

    const setRef = useCallback(
      (instance: BottomSheetModal | null) => {
        internalRef.current = instance;
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref) {
          ref.current = instance;
        }
      },
      [ref]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleClose = useCallback(() => {
      setSelectedUrls(new Set());
      internalRef.current?.dismiss();
      onClose();
    }, [onClose]);

    const handleDone = useCallback(() => {
      const selectedImages = Array.from(selectedUrls).map((url) => ({
        url,
        uri: url,
      }));
      onSelectImages(selectedImages);
      setSelectedUrls(new Set());
      internalRef.current?.dismiss();
    }, [selectedUrls, onSelectImages]);

    const toggleSelection = useCallback(
      (url: string) => {
        // For single selection mode (maxSelection = 1), auto-select and submit
        if (maxSelection === 1) {
          onSelectImages([{ url, uri: url }]);
          internalRef.current?.dismiss();
          return;
        }

        setSelectedUrls((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(url)) {
            newSet.delete(url);
          } else {
            if (!allowMultiple) {
              // Single selection mode - replace
              newSet.clear();
              newSet.add(url);
            } else if (newSet.size < maxSelection) {
              newSet.add(url);
            }
          }
          return newSet;
        });
      },
      [allowMultiple, maxSelection, onSelectImages]
    );

    // Filter assets based on active tab
    const displayAssets = useMemo(() => {
      // Only show images, not videos
      const imageAssets = assets.filter((a) => a.mediaType === "image");
      
      if (activeTab === "favorites") {
        return imageAssets.filter((a) => a.isFavorite);
      }
      return imageAssets;
    }, [assets, activeTab]);

    const favoriteCount = useMemo(
      () => assets.filter((a) => a.mediaType === "image" && a.isFavorite).length,
      [assets]
    );

    // Grid dimensions
    const numColumns = 3;
    const gap = 4;
    const itemWidth = (width - 32 - gap * (numColumns - 1)) / numColumns;

    const renderItem = useCallback(
      ({ item }: { item: AssetItem }) => {
        const isSelected = selectedUrls.has(item.url);
        const selectionIndex = Array.from(selectedUrls).indexOf(item.url) + 1;

        return (
          <Pressable
            onPress={() => toggleSelection(item.url)}
            style={{
              width: itemWidth,
              height: itemWidth,
              marginBottom: gap,
            }}
            className="active:opacity-80"
          >
            <Image
              source={item.previewUrl || item.url}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 8,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {/* Selection border */}
            {isSelected && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 8,
                  borderWidth: 3,
                  borderColor: "#3b82f6",
                }}
              />
            )}
            {/* Checkmark badge - bottom right */}
            {isSelected && (
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#3b82f6",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#fff",
                }}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
            )}
          </Pressable>
        );
      },
      [itemWidth, selectedUrls, toggleSelection, allowMultiple]
    );

    const keyExtractor = useCallback((item: AssetItem) => item.id, []);

    const ListEmptyComponent = useCallback(
      () => (
        <View className="flex-1 items-center justify-center py-20">
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-500 text-sm mt-3">Loading assets...</Text>
            </>
          ) : (
            <>
              <Ionicons name="images-outline" size={48} color="#4b5563" />
              <Text className="text-gray-500 text-base mt-3">
                {activeTab === "favorites"
                  ? "No favorite images yet"
                  : "No images yet"}
              </Text>
            </>
          )}
        </View>
      ),
      [isLoading, activeTab]
    );

    const ListFooterComponent = useCallback(
      () => {
        if (isLoadingMore) {
          return (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          );
        }
        if (!hasMore && displayAssets.length > 0) {
          return (
            <View className="py-6 items-center">
              <Text className="text-gray-500 text-sm">You've reached the end</Text>
            </View>
          );
        }
        return null;
      },
      [isLoadingMore, hasMore, displayAssets.length]
    );

    const handleEndReached = useCallback(() => {
      if (hasMore && !isLoadingMore && activeTab === "all") {
        loadMore();
      }
    }, [hasMore, isLoadingMore, activeTab, loadMore]);

    // Backup scroll handler - onEndReached can be unreliable
    const handleMomentumScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 300;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isCloseToBottom && hasMore && !isLoadingMore && activeTab === "all") {
          loadMore();
        }
      },
      [hasMore, isLoadingMore, activeTab, loadMore]
    );

    return (
      <BottomSheetModal
        ref={setRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#1a1a1a" }}
        handleComponent={() => null}
        topInset={insets.top}
        onDismiss={onClose}
      >
        <View style={{ flex: 1 }}>
          {/* Tab Selector - below floating header */}
          <View className="flex-row items-center px-4 py-3" style={{ marginTop: 60 }}>
            <Pressable
              onPress={() => setActiveTab("favorites")}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                activeTab === "favorites" ? "bg-neutral-700" : "bg-transparent"
              }`}
            >
              <Ionicons
                name="heart"
                size={16}
                color={activeTab === "favorites" ? "#fff" : "#9ca3af"}
              />
              <Text
                className={`ml-1.5 text-sm ${
                  activeTab === "favorites" ? "text-white" : "text-gray-400"
                }`}
              >
                {favoriteCount} Favorites
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("all")}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                activeTab === "all" ? "bg-neutral-700" : "bg-transparent"
              }`}
            >
              <Ionicons
                name="folder-outline"
                size={16}
                color={activeTab === "all" ? "#fff" : "#9ca3af"}
              />
              <Text
                className={`ml-1.5 text-sm ${
                  activeTab === "all" ? "text-white" : "text-gray-400"
                }`}
              >
                All Assets
              </Text>
            </Pressable>

          </View>

          {/* Asset Grid */}
          <BottomSheetFlatList
            data={displayAssets}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            columnWrapperStyle={{
              paddingHorizontal: 16,
              justifyContent: "flex-start",
              gap: gap,
            }}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 16,
              flexGrow: displayAssets.length === 0 ? 1 : undefined,
            }}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={ListFooterComponent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.8}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />

          {/* Floating Header - separate buttons */}
          <View
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0,
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Pressable 
                onPress={handleClose} 
                className="active:opacity-70 px-4 py-2 rounded-full"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <Text className="text-white font-medium text-base">Cancel</Text>
              </Pressable>
              <Text className="text-white font-semibold text-lg">
                Select Images{selectedUrls.size > 0 ? ` (${selectedUrls.size}/${maxSelection})` : ""}
              </Text>
              <Pressable
                onPress={handleDone}
                disabled={selectedUrls.size === 0}
                className="active:opacity-70 px-4 py-2 rounded-full"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <Text className={`font-medium text-base ${selectedUrls.size > 0 ? "text-white" : "text-gray-500"}`}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheetModal>
    );
  }
);

export default AssetPickerSheet;
