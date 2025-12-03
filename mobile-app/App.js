import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';

export default function App() {
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('Ready to fetch QR');
  const [countdown, setCountdown] = useState(15);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    let interval = null;
    let countdownInterval = null;
    
    if (autoRefresh) {
      // Fetch QR immediately
      fetchQR();
      
      // Set up auto-refresh every 15 seconds
      interval = setInterval(() => {
        fetchQR();
        setCountdown(15);
      }, 15000);
      
      // Set up countdown
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 15);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [autoRefresh]);

  const fetchQR = async () => {
    try {
      setStatus('Fetching QR data...');
      const response = await fetch('http://192.168.1.5:5000/qr/generate-test');
      
      if (response.ok) {
        const data = await response.json();
        setQrData(data);
        setStatus('QR data received successfully!');
      } else {
        setStatus('Failed to fetch QR data');
      }
    } catch (error) {
      setStatus('Network error: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Mobile QR Generator</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={fetchQR}>
          <Text style={styles.buttonText}>Generate QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, autoRefresh ? styles.stopButton : styles.startButton]} 
          onPress={() => setAutoRefresh(!autoRefresh)}
        >
          <Text style={styles.buttonText}>
            {autoRefresh ? 'Stop Auto' : 'Auto-Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {autoRefresh && (
        <Text style={styles.countdown}>Next: {countdown}s</Text>
      )}
      
      <Text style={styles.status}>{status}</Text>
      
      {qrData && (
        <View style={styles.qrInfo}>
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>📱 Scan this QR Code:</Text>
            <Image
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({qr_id: qrData.qr_id, signature: qrData.signature}))}`
              }}
              style={styles.qrImage}
            />
          </View>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>QR ID:</Text>
            <Text style={styles.compactId}>{qrData.qr_id ? qrData.qr_id.substring(0, 24) + '...' : 'N/A'}</Text>
            
            <Text style={styles.label}>Expires:</Text>
            <Text style={styles.value}>
              {qrData.expires_at ? new Date(qrData.expires_at).toLocaleTimeString() : 'N/A'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.expandText}>
              {showDetails ? '▲ Hide Details' : '▼ Show Full Details'}
            </Text>
          </TouchableOpacity>
          
          {showDetails && (
            <View style={styles.expandedDetails}>
              <Text style={styles.label}>Complete QR ID:</Text>
              <Text style={styles.fullId} selectable={true}>{qrData.qr_id || 'N/A'}</Text>
              
              <Text style={styles.label}>Complete JSON for Testing:</Text>
              <Text style={styles.fullId} selectable={true}>
                {JSON.stringify({qr_id: qrData.qr_id, signature: qrData.signature}, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 100, // Extra space at bottom
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    margin: 5,
  },
  startButton: {
    backgroundColor: '#059669',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  countdown: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  qrInfo: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  qrLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  qrImage: {
    width: 280,
    height: 280,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  compactId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  expandButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  expandText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  expandedDetails: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
  },
  fullId: {
    fontSize: 10,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 5,
  },
});
