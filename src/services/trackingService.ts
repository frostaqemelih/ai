import { Platform } from 'react-native';

// expo-tracking-transparency's native module isn't present on web, and isn't
// present in a plain Expo Go install either (it needs a custom dev client) —
// simply `import`-ing it at module scope throws immediately in both cases.
// A lazy, guarded `require()` keeps that crash from ever happening: the
// module is only touched on iOS, and any failure to load it is swallowed
// the same way every other optional native dependency in this app is.
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
  const mod = loadModule();
  if (!mod || !mod.isAvailable()) return true;
  try {
    const { status } = await mod.requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getTrackingGranted(): Promise<boolean> {
  const mod = loadModule();
  if (!mod || !mod.isAvailable()) return true;
  try {
    const { status } = await mod.getTrackingPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
