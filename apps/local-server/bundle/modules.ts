import { System } from '@expo-system/core';
import { Platform } from 'react-native';

// babel depends on these names
System.share('react', require('react'));
System.share('react/jsx-runtime', require('react/jsx-runtime'));

// Share module instances from Hermes compiled code
System.share('expo:status-bar', require('expo-status-bar'));
System.share('expo:react', require('react'));
System.share('expo:react-native', Platform.select({
  default: require('react-native'),
  web: require('react-native-web'),
}));
