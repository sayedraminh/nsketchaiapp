import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated as RNAnimated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigation, CommonActions } from "@react-navigation/native";
import ReanimatedDrawerLayout, {
  DrawerType,
  DrawerPosition,
  DrawerLayoutMethods,
} from "react-native-gesture-handler/ReanimatedDrawerLayout";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

type SessionType = "image" | "video" | "edit" | "assets";
type FilterType = "all" | "image" | "video" | "edit";

export interface SessionsDrawerRef {
  openDrawer: () => void;
  closeDrawer: () => void;
}

interface SessionsDrawerProps {
  children: React.ReactNode;
  currentScreen?: "image" | "video" | "edit";
  onDrawerOpen?: () => void;
  onDrawerClose?: () => void;
}

const categoryIcons = [
  { id: "all", label: "All tools", gradient: ["#a855f7", "#6366f1", "#3b82f6"], icon: "apps" },
  { id: "image", label: "Image", gradient: ["#f59e0b", "#f97316"], icon: "image" },
  { id: "video", label: "Video", gradient: ["#f59e0b", "#f97316"], icon: "videocam" },
  { id: "mini", label: "Mini App", gradient: ["#6b7280", "#9ca3af"], icon: "grid" },
];

const filterPills: { id: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "image", label: "Image", icon: "image-outline" },
  { id: "video", label: "Video", icon: "videocam-outline" },
  { id: "edit", label: "Edit", icon: "sparkles-outline" },
];

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "last week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "last month";
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "image": return "image-outline";
    case "video": return "videocam-outline";
    case "edit": return "sparkles-outline";
    case "assets": return "folder-outline";
    default: return "document-outline";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "image": return "Image";
    case "video": return "Video";
    case "edit": return "Enhance";
    case "assets": return "Assets";
    default: return "Other";
  }
}

export { DRAWER_WIDTH };

const SessionsDrawer = forwardRef<SessionsDrawerRef, SessionsDrawerProps>(
  ({ children, currentScreen, onDrawerOpen, onDrawerClose }, ref) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const drawerRef = useRef<DrawerLayoutMethods>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    openDrawer: () => drawerRef.current?.openDrawer(),
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }));

  // Auto-select filter based on current screen
  useEffect(() => {
    if (currentScreen) {
      setSelectedFilter(currentScreen);
    }
  }, [currentScreen]);

  // Fetch sessions from Convex
  const sessions = useQuery(api.sessions.getUserSessions);
  const isLoading = sessions === undefined;

  const handleSessionPress = (session: any) => {
    drawerRef.current?.closeDrawer();
    // Navigate to the appropriate tab with session data
    if (session.type === "image") {
      navigation.dispatch(
        CommonActions.navigate({
          name: "Main",
          params: {
            screen: "Images",
            params: {
              sessionId: session._id,
              sessionTitle: session.title,
            },
          },
        })
      );
    }
    // TODO: Add navigation for video/edit types
  };

  // Filter out assets sessions, TTS/audio-only edit sessions, and deduplicate empty "New" sessions
  const processedSessions = React.useMemo(() => {
    if (!sessions) return [];
    
    // Filter out assets type and TTS/audio-only edit sessions
    const filteredSessions = sessions.filter((s) => {
      // Always filter out assets
      if (s.type === "assets") return false;
      
      // For edit/enhance sessions, ONLY show ones with actual image previews
      // This filters out all TTS/audio sessions since they have no image output
      if (s.type === "edit") {
        // Must have a valid preview URL (not null, undefined, or empty string)
        if (!s.preview || s.preview.trim() === "") return false;
        
        // Filter out specific non-image enhance features by title
        const title = s.title?.toLowerCase() || "";
        if (title.includes("talking photo") || 
            title.includes("add more details") ||
            title.includes("talking")) return false;
        
        // Preview must look like an image URL (contains common image extensions or CDN patterns)
        const preview = s.preview.toLowerCase();
        const isImageUrl = preview.includes(".jpg") || 
                          preview.includes(".jpeg") || 
                          preview.includes(".png") || 
                          preview.includes(".webp") ||
                          preview.includes(".gif") ||
                          preview.includes("cloudinary") ||
                          preview.includes("storage.googleapis") ||
                          preview.includes("convex") ||
                          preview.includes("blob");
        if (!isImageUrl) return false;
      }
      return true;
    });
    
    // Track seen empty session types to deduplicate
    const seenEmptyTypes = new Set<string>();
    const deduplicated = filteredSessions.filter((s) => {
      const isNewSession = s.title?.startsWith("New ") || s.title?.includes("New Session");
      if (isNewSession && !s.preview) {
        // This is likely an empty "new" session
        if (seenEmptyTypes.has(s.type)) {
          return false; // Skip duplicate empty session
        }
        seenEmptyTypes.add(s.type);
      }
      return true;
    });
    
    return deduplicated;
  }, [sessions]);

  const filteredSessions = selectedFilter && processedSessions
    ? processedSessions.filter((s) => {
        if (selectedFilter === "image") return s.type === "image";
        if (selectedFilter === "video") return s.type === "video";
        if (selectedFilter === "edit") return s.type === "edit";
        return true;
      })
    : processedSessions;

  const handleFilterPress = useCallback((filter: FilterType) => {
    setSelectedFilter(prev => prev === filter ? null : filter);
  }, []);

  // Memoized drawer content for performance
  const renderDrawerContent = useCallback(() => (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-lg bg-white items-center justify-center mr-2">
            <Text className="text-black font-bold text-lg">N</Text>
          </View>
          <View className="bg-green-500 rounded-full px-2 py-0.5">
            <Text className="text-black text-xs font-semibold">Basic</Text>
          </View>
        </View>
        <Pressable className="p-2">
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Category Icons */}
      <View className="flex-row px-4 py-4">
        {categoryIcons.map((cat) => (
          <Pressable key={cat.id} className="items-center mr-4 active:opacity-70">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
                backgroundColor: cat.gradient[0],
              }}
            >
              <Ionicons name={cat.icon as any} size={26} color="#fff" />
            </View>
            <Text className="text-white text-xs">{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Filter Pills */}
      <View className="flex-row px-4 pb-4">
        {filterPills.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => handleFilterPress(filter.id)}
            className="flex-row items-center rounded-full px-3 py-1.5 mr-2"
            style={{
              backgroundColor: selectedFilter === filter.id ? "#fff" : "#1a1a1a",
              borderWidth: 1,
              borderColor: selectedFilter === filter.id ? "#fff" : "#333",
            }}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={selectedFilter === filter.id ? "#000" : "#fff"}
            />
            <Text
              className="ml-1 text-sm"
              style={{ color: selectedFilter === filter.id ? "#000" : "#fff" }}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sessions List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="text-gray-500 text-sm mt-3">Loading sessions...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Ionicons name="folder-open-outline" size={48} color="#4b5563" />
            <Text className="text-gray-500 text-sm mt-3">No sessions yet</Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <Pressable
              key={session._id}
              className="flex-row items-center px-4 py-3 active:bg-white/5"
              onPress={() => handleSessionPress(session)}
            >
              {/* Thumbnail */}
              <View
                className="w-12 h-12 rounded-xl mr-3 items-center justify-center overflow-hidden"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                {session.preview ? (
                  <Image
                    source={{ uri: session.preview }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name={getTypeIcon(session.type)} size={20} color="#6b7280" />
                )}
              </View>

              {/* Content */}
              <View className="flex-1">
                <Text className="text-white text-base font-medium" numberOfLines={1}>
                  {session.title}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name={getTypeIcon(session.type)} size={12} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1">{getTypeLabel(session.type)}</Text>
                </View>
                <Text className="text-gray-600 text-xs mt-0.5">
                  {getRelativeTime(session.updatedAt || session.createdAt)}
                </Text>
              </View>

              {/* Chevron */}
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  ), [insets.top, insets.bottom, selectedFilter, isLoading, filteredSessions, handleSessionPress, handleFilterPress]);

  return (
    <ReanimatedDrawerLayout
      ref={drawerRef}
      drawerWidth={DRAWER_WIDTH}
      drawerPosition={DrawerPosition.LEFT}
      drawerType={DrawerType.SLIDE}
      overlayColor="transparent"
      edgeWidth={40}
      renderNavigationView={renderDrawerContent}
      onDrawerOpen={onDrawerOpen}
      onDrawerClose={onDrawerClose}
    >
      {children}
    </ReanimatedDrawerLayout>
  );
});

export default SessionsDrawer;
