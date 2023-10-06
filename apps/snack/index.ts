import { System } from '@expo-system/core';
import { registerRootComponent } from 'expo';
import { ComponentType } from 'react';
import { Platform } from 'react-native';

// Initialize the Snack file system and Babel transpiler
import '@expo-system/core/src/extras/babel-transpile';
import '@expo-system/core/src/extras/snack-files';

// Share module instances from Hermes compiled code
System.share('expo-status-bar', require('expo-status-bar'));
System.share('react', require('react'));
System.share('react/jsx-runtime', require('react/jsx-runtime'));
System.share('react-native', Platform.select({
  default: require('react-native'),
  web: require('react-native-web'),
}));

// Add code, preferably this comes from a new bundler
System.addFiles({
  './App.js': `
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});`,
});

// Import the app, and register it as the root component
console.time('finished');
System.import<{ default: ComponentType<any> }>('./App.js')
  .then(({ default: App }) => {
    console.timeEnd('finished');
    registerRootComponent(App)
  });
