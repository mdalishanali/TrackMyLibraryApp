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
      allowsEditing: true, // Re-enabling as per request
      aspect: [1, 1], // Square crop for passport photos
      quality: 0.4, 
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
 * Supports progress tracking via callback.
 */
export const uploadImageToCloud = async (
  localUri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Prepare file details
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      const fileName = `student-${Date.now()}.${fileExtension}`;

      // 2. Get Presigned URL from Backend
      const { data: s3Data } = await api.get('/students/presigned-url', {
        params: { fileName, fileType }
      });

      // 3. Upload to S3 using XMLHttpRequest for progress support
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', s3Data.uploadUrl);
      xhr.setRequestHeader('Content-Type', fileType);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = event.loaded / event.total;
            onProgress(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(s3Data.fileUrl);
        } else {
          reject(new Error(`S3 Upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('S3 Upload failed due to a network error'));

      // Axios or fetch blobs can be tricky with XHR in React Native, 
      // but reading file as base64 or using Blob directly works.
      const response = await fetch(localUri);
      const blob = await response.blob();
      xhr.send(blob);

    } catch (error) {
      console.error('Upload error:', error);
      reject(error);
    }
  });
};
