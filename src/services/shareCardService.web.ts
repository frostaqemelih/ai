import type { View } from 'react-native';

// Web build: image capture/sharing isn't supported, and SessionResultScreen
// already skips the image-share path entirely on web (Platform.OS check),
// so this only exists to satisfy the import and is never actually called.
export async function captureShareCard(_ref: React.RefObject<View | null>): Promise<string | null> {
  return null;
}
