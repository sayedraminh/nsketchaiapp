/**
 * Attachment Upload Utilities
 * Handles presigned URL generation and direct R2 uploads for edit models
 */

import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { apiRequest } from "./api";

// Presign response from API
interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

// Attachment with uploaded URL
export interface UploadedAttachment {
  url: string;
  localUri?: string;
  key?: string;
}

// Image picker result
export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
  url?: string; // For images selected from assets (already uploaded)
  isFromAssets?: boolean; // Flag to skip upload for asset images
}

/**
 * Get presigned URL for uploading attachment to R2
 */
export async function getPresignedUrl(
  token: string,
  contentType: string = "image/jpeg"
): Promise<PresignResponse> {
  const response = await apiRequest<PresignResponse>("/api/mobile/r2-presign", {
    method: "POST",
    body: { contentType },
    token,
  });

  if (!response.uploadUrl || !response.publicUrl) {
    throw new Error("Failed to get presigned URL");
  }

  return response;
}

/**
 * Upload file to R2 using presigned URL
 */
export async function uploadToR2(
  localUri: string,
  uploadUrl: string,
  contentType: string = "image/jpeg"
): Promise<void> {
  // Read file info
  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error("File not found");
  }

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert to blob for upload
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}

/**
 * Upload a single attachment and return the public URL
 */
export async function uploadAttachment(
  token: string,
  localUri: string,
  contentType: string = "image/jpeg"
): Promise<UploadedAttachment> {
  // Get presigned URL
  const presign = await getPresignedUrl(token, contentType);

  // Upload to R2
  await uploadToR2(localUri, presign.uploadUrl, contentType);

  return {
    url: presign.publicUrl,
    localUri,
    key: presign.key,
  };
}

/**
 * Upload multiple attachments in parallel
 */
export async function uploadAttachments(
  token: string,
  localUris: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<UploadedAttachment[]> {
  const results: UploadedAttachment[] = [];
  let completed = 0;

  // Upload in parallel with concurrency limit
  const CONCURRENCY = 3;
  const chunks: string[][] = [];
  for (let i = 0; i < localUris.length; i += CONCURRENCY) {
    chunks.push(localUris.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (uri) => {
        const result = await uploadAttachment(token, uri);
        completed++;
        onProgress?.(completed, localUris.length);
        return result;
      })
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Pick images from device gallery
 */
export async function pickImages(options?: {
  allowsMultipleSelection?: boolean;
  maxSelection?: number;
  quality?: number;
}): Promise<SelectedImage[]> {
  const { allowsMultipleSelection = true, maxSelection = 10, quality = 0.8 } =
    options ?? {};

  // Request permission
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Gallery permission denied");
  }

  // Pick images
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection,
    selectionLimit: maxSelection,
    quality,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.type,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize ?? undefined,
  }));
}

/**
 * Take photo with camera
 */
export async function takePhoto(options?: {
  quality?: number;
}): Promise<SelectedImage | null> {
  const { quality = 0.8 } = options ?? {};

  // Request permission
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Camera permission denied");
  }

  // Take photo
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.type,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize ?? undefined,
  };
}

/**
 * Get content type from file extension
 */
export function getContentType(uri: string): string {
  const extension = uri.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

/**
 * Resize image if too large (for upload optimization)
 */
export async function resizeImageIfNeeded(
  uri: string,
  maxDimension: number = 2048
): Promise<string> {
  // expo-image-manipulator could be used here for resizing
  // For now, return original URI - the API will handle sizing
  return uri;
}

/**
 * Validate attachment constraints for a model
 */
export function validateAttachmentCount(
  count: number,
  minRequired: number,
  maxAllowed: number
): { valid: boolean; message?: string } {
  if (count < minRequired) {
    return {
      valid: false,
      message: `At least ${minRequired} image${minRequired > 1 ? "s" : ""} required`,
    };
  }

  if (count > maxAllowed) {
    return {
      valid: false,
      message: `Maximum ${maxAllowed} image${maxAllowed > 1 ? "s" : ""} allowed`,
    };
  }

  return { valid: true };
}
