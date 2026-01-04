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
import { LinearGradient } from "expo-linear-gradient";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface VideoGeneration {
  _id: string;
  _creationTime: number;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: string;
  modelId: string;
  aspectRatio?: string;
  duration?: string;
  startFrameImageUrl?: string;
  endFrameImageUrl?: string;
}

interface Props {
  video: VideoGeneration | null;
  onClose: () => void;
  onDelete: (video: VideoGeneration) => void;
}

const VideoDetailSheet = forwardRef<BottomSheetModal, Props>(
  ({ video, onClose, onDelete }, ref) => {
    const internalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const { height, width } = useWindowDimensions();
    const snapPoints = useMemo(
      () => [height - insets.top],
      [height, insets.top]
    );
    const [isDownloading, setIsDownloading] = React.useState(false);

    // Video player
    const videoPlayer = useVideoPlayer(
      video?.videoUrl || null,
      (player) => {
        player.loop = true;
      }
    );

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
      if (!video?.videoUrl) return;

      setIsDownloading(true);
      try {
        // Request permission to save to gallery
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photo library to save videos."
          );
          return;
        }

        // Download file to cache directory
        const fileName = `nsketch_video_${Date.now()}.mp4`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const downloadResult = await FileSystem.downloadAsync(
          video.videoUrl,
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

        Alert.alert("Success", "Video saved to your gallery!");
      } catch (error) {
        console.error("Download error:", error);
        Alert.alert("Error", "Failed to save video. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    }, [video]);

    const handleShare = useCallback(async () => {
      if (!video?.videoUrl) return;

      try {
        await Share.share({
          url: video.videoUrl,
          message: video.prompt || "Check out this video from NSketch!",
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }, [video]);

    const handleDelete = useCallback(() => {
      if (!video) return;

      Alert.alert(
        "Delete Video",
        "Are you sure you want to delete this video? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              onDelete(video);
              handleClose();
            },
          },
        ]
      );
    }, [video, onDelete, handleClose]);

    const formatDate = (timestamp?: number) => {
      if (!timestamp) return "Unknown";
      const date = new Date(timestamp);
      return date.toISOString();
    };

    // Parse aspect ratio string to numeric ratio
    const parseAspectRatio = (ratio?: string): number => {
      if (!ratio) return 16/9;
      const parts = ratio.split(":");
      if (parts.length !== 2) return 16/9;
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (isNaN(w) || isNaN(h) || h === 0) return 16/9;
      return w / h;
    };

    const aspectRatioValue = parseAspectRatio(video?.aspectRatio);
    const videoWidth = width - 40;
    const videoHeight = videoWidth / aspectRatioValue;

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
        {video ? (
          <View style={{ flex: 1 }}>
            <BottomSheetScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 60 }}
            >
              {/* Video Preview */}
              <View
                style={{
                  marginHorizontal: 20,
                  height: videoHeight,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <VideoView
                  player={videoPlayer}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                  contentFit="cover"
                  nativeControls={true}
                  allowsPictureInPicture={true}
                />
              </View>

              {/* Metadata Section */}
              <View className="px-5 mt-6">
                {/* Created */}
                <View className="flex-row justify-between items-center py-3">
                  <Text className="text-gray-400 text-base">Created</Text>
                  <Text className="text-white text-base">
                    {formatDate(video._creationTime)}
                  </Text>
                </View>

                {/* Type */}
                <View className="flex-row justify-between items-center py-3">
                  <Text className="text-gray-400 text-base">Type</Text>
                  <Text className="text-white text-base">Video</Text>
                </View>

                {/* Aspect Ratio */}
                {video.aspectRatio && (
                  <View className="flex-row justify-between items-center py-3">
                    <Text className="text-gray-400 text-base">Aspect Ratio</Text>
                    <Text className="text-white text-base">
                      {video.aspectRatio}
                    </Text>
                  </View>
                )}

                {/* Prompt */}
                {video.prompt && (
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
                          {video.prompt}
                        </Text>
                      </BottomSheetScrollView>
                    </View>
                  </View>
                )}

                {/* Style Images */}
                {(video.startFrameImageUrl || video.endFrameImageUrl) && (
                  <View className="py-4">
                    <Text className="text-gray-400 text-base mb-3">
                      Style Images
                    </Text>
                    <View className="flex-row gap-3">
                      {video.startFrameImageUrl && (
                        <Image
                          source={video.startFrameImageUrl}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                          }}
                          contentFit="cover"
                        />
                      )}
                      {video.endFrameImageUrl && (
                        <Image
                          source={video.endFrameImageUrl}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                          }}
                          contentFit="cover"
                        />
                      )}
                    </View>
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
                    onPress={() => {}}
                    className="flex-1 flex-row items-center justify-center py-4 rounded-full"
                    style={{ backgroundColor: "#2a3a4a" }}
                  >
                    <Ionicons
                      name="heart-outline"
                      size={20}
                      color="#4da6ff"
                    />
                    <Text
                      className="text-base font-semibold ml-2"
                      style={{ color: "#4da6ff" }}
                    >
                      Favorite
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
            
            {/* Floating Header with vignette gradient */}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.2)', 'transparent']}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0,
                height: 100,
              }}
            >
              <View 
                className="flex-row items-center justify-between px-5 py-4"
              >
                <Pressable
                  onPress={handleClose}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: "rgba(51, 51, 51, 0.8)" }}
                >
                  <Text className="text-white font-semibold">Close</Text>
                </Pressable>
                <Text className="text-white font-bold text-lg">
                  Video Asset
                </Text>
                <View style={{ width: 60 }} />
              </View>
            </LinearGradient>
          </View>
        ) : null}
      </BottomSheetModal>
    );
  }
);

export default VideoDetailSheet;
