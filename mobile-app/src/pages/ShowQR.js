import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function ShowQR() {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test App</Text>
      <Text style={styles.message}>Hello World!</Text>
      <Text style={styles.message}>React Native is working</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ShowQR;
