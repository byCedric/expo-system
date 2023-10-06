import { StatusBar } from 'expo:status-bar';
import React from 'expo:react';
import { StyleSheet, View } from 'expo:react-native';

import { Greeting } from './Greeting.tsx';

export default function App() {
  return (
    <View style={styles.container}>
      <Greeting />
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
});
