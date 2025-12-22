import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Alert } from 'react-native';
import { api } from '@/lib/api-client';

export type OptimizedImage = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  fileSize?: number;
};

const TARGET_WIDTH = 1024; // Standard HD-ish width for profile photos

/**
 * Picks an image from gallery or camera and optimizes it.
 */
export const pickOrCaptureImage = async (source: 'gallery' | 'camera'): Promise<OptimizedImage | null> => {
  try {
    const permissionMethod = source === 'gallery'
      ? ImagePicker.requestMediaLibraryPermissionsAsync
      : ImagePicker.requestCameraPermissionsAsync;

    const { status } = await permissionMethod();

    if (status !== 'granted') {
      Alert.alert('Permission needed', `Please allow ${source} access to set a student photo.`);
      return null;
    }

    const launchMethod = source === 'gallery'
      ? ImagePicker.launchImageLibraryAsync
      : ImagePicker.launchCameraAsync;

    const result = await launchMethod({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disabling this as it's a common cause of crashes on Android + New Architecture
      quality: 0.8, 
    });

    if (!result || result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset || !asset.uri) return null;

    return await compressAndResize(asset.uri);
  } catch (error) {
    console.error('Error during image selection:', error);
    Alert.alert('Error', 'Failed to pick or capture image.');
    return null;
  }
};

/**
 * Compresses and resizes image to meet PRD requirements (70% quality, JPEG).
 */
export const compressAndResize = async (uri: string): Promise<OptimizedImage> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: TARGET_WIDTH } }],
      {
        compress: 0.7, // 70% quality as requested
        format: ImageManipulator.SaveFormat.JPEG
      }
    );

    const fileInfo = await FileSystem.getInfoAsync(result.uri);

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: fileInfo.exists ? fileInfo.size : 0,
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
};

/**
 * Complete flow: Compress -> S3 Upload -> Return CloudFront URL.
 */
export const uploadImageToCloud = async (localUri: string): Promise<string> => {
  try {
    // 1. Optimization already happened in pickOrCaptureImage, but we ensure it's JPEG
    const fileExtension = localUri.split('.').pop() || 'jpg';
    const fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    const fileName = `student-${Date.now()}.${fileExtension}`;

    // 2. Get Presigned URL from Backend
    const { data: s3Data } = await api.get('/students/presigned-url', {
      params: { fileName, fileType }
    });

    // 3. Convert Local URI to Blob for Upload
    const response = await fetch(localUri);
    const blob = await response.blob();

    // 4. Upload directly to S3
    const uploadResponse = await fetch(s3Data.uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': fileType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload to S3 failed');
    }

    // 5. Return the CloudFront URL
    return s3Data.fileUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image. Please check your connection.');
  }
};
