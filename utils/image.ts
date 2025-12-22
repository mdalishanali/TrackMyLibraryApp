import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export type OptimizedImage = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  fileSize?: number;
};

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const TARGET_WIDTH = 800;

export const pickAndOptimizeImage = async (): Promise<OptimizedImage | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access gallery was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return await optimizeImage(result.assets[0].uri);
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

export const takeAndOptimizePhoto = async (): Promise<OptimizedImage | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access camera was denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return await optimizeImage(result.assets[0].uri);
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

export const optimizeImage = async (uri: string): Promise<OptimizedImage> => {
  let currentUri = uri;
  let currentQualty = 0.8;
  let optimized = null;

  // Step 1: Resize to max width
  const manipulateResult = await ImageManipulator.manipulateAsync(
    currentUri,
    [{ resize: { width: TARGET_WIDTH } }],
    { compress: currentQualty, format: ImageManipulator.SaveFormat.JPEG }
  );

  currentUri = manipulateResult.uri;

  // Step 2: Check size and re-compress if needed
  let fileInfo = await FileSystem.getInfoAsync(currentUri);
  let size = fileInfo.exists ? fileInfo.size : 0;

  // If still too big, aggressive compression
  if (size > MAX_FILE_SIZE) {
    const furtherManipulate = await ImageManipulator.manipulateAsync(
      currentUri,
      [],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    currentUri = furtherManipulate.uri;
    fileInfo = await FileSystem.getInfoAsync(currentUri);
    size = fileInfo.exists ? fileInfo.size : 0;
  }

  return {
    uri: currentUri,
    width: manipulateResult.width,
    height: manipulateResult.height,
    fileSize: size,
  };
};

export const uploadToS3 = async (localUri: string, uploadUrl: string, fileType: string) => {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': fileType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to S3');
  }
};
