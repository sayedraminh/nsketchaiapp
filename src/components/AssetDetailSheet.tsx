import React, { useCallback, useMemo, forwardRef, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Alert,
  Share,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssetItem } from "../hooks/useAssets";

interface Props {
  asset: AssetItem | null;
  onClose: () => void;
  onDelete: (asset: AssetItem) => void;
  onToggleFavorite: (asset: AssetItem) => void;
}

const AssetDetailSheet = forwardRef<BottomSheetModal, Props>(
  ({ asset, onClose, onDelete, onToggleFavorite }, ref) => {
    const internalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const { height, width } = useWindowDimensions();
    const snapPoints = useMemo(
      () => [height - insets.top],
      [height, insets.top]
    );
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [detectedRatio, setDetectedRatio] = React.useState<string | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);

    // Video player for video assets
    const videoPlayer = useVideoPlayer(
      asset?.mediaType === "video" ? asset.url : null,
      (player) => {
        player.loop = true;
      }
    );

    // Reset detected ratio and video state when asset changes
    React.useEffect(() => {
      setDetectedRatio(null);
      setIsVideoPlaying(false);
    }, [asset?.id]);

    // Sync internal ref with forwarded ref
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
      internalRef.current?.dismiss();
      onClose();
    }, [onClose]);

    const handleDownload = useCallback(async () => {
      if (!asset) return;

      setIsDownloading(true);
      try {
        // Request permission to save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photo library to save images."
          );
          return;
        }

        // Download file to cache directory
        const fileExtension = asset.mediaType === "video" ? "mp4" : "jpg";
        const fileName = `nsketch_${Date.now()}.${fileExtension}`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const downloadResult = await FileSystem.downloadAsync(
          asset.url,
          fileUri
        );

        if (downloadResult.status !== 200) {
          throw new Error("Download failed");
        }

        // Save to gallery
        const savedAsset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        
        // Optionally create an album for the app
        const album = await MediaLibrary.getAlbumAsync("NSketch");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([savedAsset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("NSketch", savedAsset, false);
        }

        Alert.alert("Success", "Saved to your gallery!");
      } catch (error) {
        console.error("Download error:", error);
        Alert.alert("Error", "Failed to save to gallery. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    }, [asset]);

    const handleShare = useCallback(async () => {
      if (!asset) return;

      try {
        await Share.share({
          url: asset.url,
          message: asset.prompt || "Check out this image from NSketch!",
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }, [asset]);

    const handleDelete = useCallback(() => {
      if (!asset) return;

      Alert.alert(
        "Delete Asset",
        "Are you sure you want to delete this asset? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              onDelete(asset);
              handleClose();
            },
          },
        ]
      );
    }, [asset, onDelete, handleClose]);

    const handleToggleFavorite = useCallback(() => {
      if (!asset) return;
      onToggleFavorite(asset);
    }, [asset, onToggleFavorite]);

    const formatDate = (timestamp?: number) => {
      if (!timestamp) return "Unknown";
      const date = new Date(timestamp);
      return date.toISOString();
    };

    // Parse aspect ratio string (e.g., "16:9", "1:1", "9:16") to numeric ratio
    const parseAspectRatio = (ratio?: string): number => {
      if (!ratio) return 1; // Default to 1:1
      const parts = ratio.split(":");
      if (parts.length !== 2) return 1;
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (isNaN(w) || isNaN(h) || h === 0) return 1;
      return w / h;
    };

    // Convert dimensions to common aspect ratio string
    const dimensionsToRatio = (w: number, h: number): string => {
      const ratio = w / h;
      // Common aspect ratios with tolerance
      const commonRatios: [number, string][] = [
        [16/9, "16:9"],
        [9/16, "9:16"],
        [4/3, "4:3"],
        [3/4, "3:4"],
        [1, "1:1"],
        [3/2, "3:2"],
        [2/3, "2:3"],
        [21/9, "21:9"],
        [9/21, "9:21"],
      ];
      
      for (const [r, name] of commonRatios) {
        if (Math.abs(ratio - r) < 0.05) return name;
      }
      
      // Return simplified ratio if not common
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(Math.round(w), Math.round(h));
      return `${Math.round(w/divisor)}:${Math.round(h/divisor)}`;
    };

    // Handle image load to detect dimensions
    const handleImageLoad = (event: any) => {
      const { width: imgW, height: imgH } = event.source || {};
      if (imgW && imgH && !asset?.aspectRatio) {
        setDetectedRatio(dimensionsToRatio(imgW, imgH));
      }
    };

    const displayRatio = asset?.aspectRatio || detectedRatio;
    const aspectRatioValue = parseAspectRatio(displayRatio || undefined);
    const imageWidth = width - 40; // 20px margin on each side
    const imageHeight = imageWidth / aspectRatioValue;

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
        {asset ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <Pressable
              onPress={handleClose}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: "#333" }}
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
            <Text className="text-white font-bold text-lg">
              {asset.mediaType === "video" ? "Video Asset" : "Image Asset"}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Asset Preview */}
          <View
            style={{
              marginHorizontal: 20,
              height: imageHeight,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {asset.mediaType === "video" ? (
              <Pressable
                onPress={() => {
                  if (isVideoPlaying) {
                    videoPlayer.pause();
                  } else {
                    videoPlayer.play();
                  }
                  setIsVideoPlaying(!isVideoPlaying);
                }}
                style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
              >
                <VideoView
                  player={videoPlayer}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                  contentFit="cover"
                  nativeControls={false}
                />
                {!isVideoPlaying && (
                  <View
                    style={{
                      position: "absolute",
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="play" size={40} color="#fff" />
                  </View>
                )}
              </Pressable>
            ) : (
              <Image
                source={asset.url}
                style={{ width: "100%", height: "100%", borderRadius: 16 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onLoad={handleImageLoad}
              />
            )}
          </View>

          {/* Metadata Section */}
          <View className="px-5 mt-6">
            {/* Created */}
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-gray-400 text-base">Created</Text>
              <Text className="text-white text-base">
                {formatDate(asset.createdAt)}
              </Text>
            </View>

            {/* Type */}
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-gray-400 text-base">Type</Text>
              <Text className="text-white text-base capitalize">
                {asset.mediaType}
              </Text>
            </View>

            {/* Aspect Ratio */}
            {displayRatio && (
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-gray-400 text-base">Aspect Ratio</Text>
                <Text className="text-white text-base">
                  {displayRatio}
                </Text>
              </View>
            )}

            {/* Tool/Model */}
            {asset.isEnhanced && (
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-gray-400 text-base">Tool</Text>
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "#333" }}
                >
                  <Ionicons name="sparkles" size={14} color="#fff" />
                  <Text className="text-white text-sm ml-1.5">Enhanced</Text>
                </View>
              </View>
            )}

            {/* Prompt */}
            {asset.prompt && (
              <View className="py-4">
                <Text className="text-gray-400 text-base mb-2">Prompt</Text>
                <View 
                  style={{ 
                    maxHeight: 180, 
                    backgroundColor: "#2a2a2a",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <BottomSheetScrollView 
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    <Text className="text-white text-base leading-6">
                      {asset.prompt}
                    </Text>
                  </BottomSheetScrollView>
                </View>
              </View>
            )}

            {/* Preview/Style Images */}
            {asset.previewUrl && asset.previewUrl !== asset.url && (
              <View className="py-4">
                <Text className="text-gray-400 text-base mb-3">
                  Style Images
                </Text>
                <Image
                  source={{ uri: asset.previewUrl }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="px-5 mt-6">
            {/* Download & Favorite Row */}
            <View className="flex-row gap-3 mb-3">
              <Pressable
                onPress={handleDownload}
                disabled={isDownloading}
                className="flex-1 flex-row items-center justify-center py-4 rounded-full"
                style={{ backgroundColor: "#2a3a4a" }}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#4da6ff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="#4da6ff" />
                    <Text
                      className="text-base font-semibold ml-2"
                      style={{ color: "#4da6ff" }}
                    >
                      Download
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleToggleFavorite}
                className="flex-1 flex-row items-center justify-center py-4 rounded-full"
                style={{ backgroundColor: "#2a3a4a" }}
              >
                <Ionicons
                  name={asset.isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={asset.isFavorite ? "#ff4d6a" : "#4da6ff"}
                />
                <Text
                  className="text-base font-semibold ml-2"
                  style={{ color: "#4da6ff" }}
                >
                  {asset.isFavorite ? "Favorited" : "Favorite"}
                </Text>
              </Pressable>
            </View>

            {/* Share Button */}
            <Pressable
              onPress={handleShare}
              className="flex-row items-center justify-center py-4 rounded-full mb-3"
              style={{ backgroundColor: "#0066FF" }}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">
                Share
              </Text>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center py-4 rounded-full"
              style={{ backgroundColor: "#ff3b30" }}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">
                Delete
              </Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>
    );
  }
);

export default AssetDetailSheet;
