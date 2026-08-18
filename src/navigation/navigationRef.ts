import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Module-level ref so code outside the React tree (the notification
// response listener in RootNavigator, which fires from an OS callback, not
// a component) can still navigate once the container has mounted.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
