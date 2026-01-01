import React, { useCallback, useMemo, forwardRef, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  onSelectAssets: () => void;
  onSelectGallery: () => void;
  onClose: () => void;
}

const ImageSourcePickerSheet = forwardRef<BottomSheetModal, Props>(
  ({ onSelectAssets, onSelectGallery, onClose }, ref) => {
    const internalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();

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

    const handleSelectAssets = useCallback(() => {
      internalRef.current?.dismiss();
      onSelectAssets();
    }, [onSelectAssets]);

    const handleSelectGallery = useCallback(() => {
      internalRef.current?.dismiss();
      onSelectGallery();
    }, [onSelectGallery]);

    return (
      <BottomSheetModal
        ref={setRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#1e1e1e" }}
        handleIndicatorStyle={{ backgroundColor: "#666", width: 40 }}
        onDismiss={onClose}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-5 pt-2 pb-4">
            <Text className="text-white text-lg font-semibold text-center mb-6">
              Select Image Source
            </Text>

            {/* Assets Option */}
            <Pressable
              onPress={handleSelectAssets}
              className="flex-row items-center py-4 px-4 rounded-xl mb-3 active:opacity-70"
              style={{ backgroundColor: "#2a2a2a" }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: "#3a3a3a" }}
              >
                <Ionicons name="folder-outline" size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-medium">Assets</Text>
                <Text className="text-gray-400 text-sm">
                  Select from your saved images
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            {/* Phone Gallery Option */}
            <Pressable
              onPress={handleSelectGallery}
              className="flex-row items-center py-4 px-4 rounded-xl active:opacity-70"
              style={{ backgroundColor: "#2a2a2a" }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: "#3a3a3a" }}
              >
                <Ionicons name="images-outline" size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-medium">
                  Phone Gallery
                </Text>
                <Text className="text-gray-400 text-sm">
                  Select from your device photos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default ImageSourcePickerSheet;
