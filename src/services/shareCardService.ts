import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Native implementation. The web build never bundles this file — Metro
// resolves shareCardService.web.ts instead — so importing captureRef
// statically here is safe even though react-native-view-shot's own web
// shim depends on the unbundled html2canvas package.
export async function captureShareCard(ref: React.RefObject<View | null>): Promise<string | null> {
  try {
    if (!ref.current) return null;
    return await captureRef(ref, { format: 'png', quality: 0.92 });
  } catch {
    return null;
  }
}
