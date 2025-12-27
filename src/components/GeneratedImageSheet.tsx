import React, { useCallback, useMemo, forwardRef, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GeneratedImage {
  url: string;
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  createdAt?: number;
}

interface Props {
  image: GeneratedImage | null;
  onClose: () => void;
}

const GeneratedImageSheet = forwardRef<BottomSheetModal, Props>(
  ({ image, onClose }, ref) => {
    const internalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const { height, width } = useWindowDimensions();
    const snapPoints = useMemo(
      () => [height - insets.top],
      [height, insets.top]
    );
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [detectedRatio, setDetectedRatio] = React.useState<string | null>(null);

    // Reset detected ratio when image changes
    React.useEffect(() => {
      setDetectedRatio(null);
    }, [image?.url]);

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

    const handleSaveToPhotos = useCallback(async () => {
      if (!image) return;

      setIsDownloading(true);
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photo library to save images."
          );
          return;
        }

        const fileName = `nsketch_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const downloadResult = await FileSystem.downloadAsync(
          image.url,
          fileUri
        );

        if (downloadResult.status !== 200) {
          throw new Error("Download failed");
        }

        const savedAsset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        
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
    }, [image]);

    const handleShare = useCallback(async () => {
      if (!image) return;

      try {
        await Share.share({
          url: image.url,
          message: image.prompt || "Check out this image from NSketch!",
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }, [image]);

    const formatDate = (timestamp?: number) => {
      if (!timestamp) return "Unknown";
      const date = new Date(timestamp);
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleDateString("en-US", options).replace(",", " at");
    };

    // Parse aspect ratio string to numeric ratio
    const parseAspectRatio = (ratio?: string): number => {
      if (!ratio) return 1;
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
      
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(Math.round(w), Math.round(h));
      return `${Math.round(w/divisor)}:${Math.round(h/divisor)}`;
    };

    // Handle image load to detect dimensions
    const handleImageLoad = (event: any) => {
      const { width: imgW, height: imgH } = event.source || {};
      if (imgW && imgH && !image?.aspectRatio) {
        setDetectedRatio(dimensionsToRatio(imgW, imgH));
      }
    };

    const displayRatio = image?.aspectRatio || detectedRatio;
    const aspectRatioValue = parseAspectRatio(displayRatio || undefined);
    const imageWidth = width - 40;
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
        {image ? (
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
                Generated Image
              </Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Image Preview */}
            <View
              style={{
                marginHorizontal: 20,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <Image
                source={image.url}
                style={{ width: imageWidth, height: imageHeight, borderRadius: 16 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onLoad={handleImageLoad}
              />
            </View>

            {/* Model Badge */}
            <View className="items-center mt-4">
              <View
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <Text className="text-white text-sm font-medium">
                  {image.model || "Nano Banana Pro"}
                </Text>
              </View>
            </View>

            {/* Prompt Section */}
            {image.prompt && (
              <View className="px-5 mt-6">
                <Text className="text-white text-lg font-bold mb-2">Prompt</Text>
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
                    <Text className="text-gray-400 text-base leading-6">
                      {image.prompt}
                    </Text>
                  </BottomSheetScrollView>
                </View>
              </View>
            )}

            {/* Details Section */}
            <View className="px-5 mt-6">
              <Text className="text-white text-lg font-bold mb-3">Details</Text>
              
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-base">Aspect Ratio</Text>
                <Text className="text-white text-base">
                  {displayRatio || "1:1"}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-400 text-base">Generated</Text>
                <Text className="text-white text-base">
                  {formatDate(image.createdAt)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="px-5 mt-8">
              {/* Save to Photos Button */}
              <Pressable
                onPress={handleSaveToPhotos}
                disabled={isDownloading}
                className="flex-row items-center justify-center py-4 rounded-full mb-3"
                style={{ backgroundColor: "#0066FF" }}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text className="text-white text-base font-semibold ml-2">
                      Save to Photos
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Share Button */}
              <Pressable
                onPress={handleShare}
                className="flex-row items-center justify-center py-4 rounded-full"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text className="text-white text-base font-semibold ml-2">
                  Share
                </Text>
              </Pressable>
            </View>
          </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>
    );
  }
);

export default GeneratedImageSheet;
