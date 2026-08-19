import { Platform } from 'react-native';

// expo-tracking-transparency's native module isn't present on web, and isn't
// present in a plain Expo Go install either (it needs a custom dev client) —
// simply `import`-ing it at module scope throws immediately in both cases,
// and so does calling any of its functions (including the synchronous
// `isAvailable()`). Every entry point below wraps the *entire* call chain —
// load, isAvailable, and the async request — in one try/catch so nothing
// escapes uncaught.
type TrackingModule = typeof import('expo-tracking-transparency');

function loadModule(): TrackingModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-tracking-transparency') as TrackingModule;
  } catch {
    return null;
  }
}

export async function requestTrackingPermission(): Promise<boolean> {
  try {
    const mod = loadModule();
    if (!mod || !mod.isAvailable()) return true;
    const { status } = await mod.requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
