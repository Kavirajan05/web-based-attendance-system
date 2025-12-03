import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

function QrScannerPage() {
  const [status, setStatus] = useState("Click 'Start Scanner' to begin scanning");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  // Start QR scanner
  const startScanning = () => {
    if (!html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );
    }

    html5QrCodeScannerRef.current.render(onScanSuccess, onScanFailure);
    setIsScanning(true);
    setStatus("📱 Position mobile QR code in front of camera");
  };

  // Stop QR scanner
  const stopScanning = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
      html5QrCodeScannerRef.current = null;
    }
    setIsScanning(false);
    if (!showSuccessPage) {
      setStatus("Click 'Start Scanner' to begin scanning");
    }
  };

  // Reset to scanner view
  const resetToScanner = () => {
    setShowSuccessPage(false);
    setVerificationResult(null);
    setLastScanned("");
    setStatus("Click 'Start Scanner' to begin scanning");
  };

  // Handle successful QR scan
  const onScanSuccess = (decodedText, decodedResult) => {
    console.log("QR Code detected:", decodedText);
    handleQRDetected(decodedText);
  };

  // Handle scan failure
  const onScanFailure = (error) => {
    // This is called continuously, so we don't log errors to avoid spam
  };

  // Manual QR input for testing
  const handleManualInput = () => {
    const qrInput = prompt("Paste QR data for testing:");
    if (qrInput) {
      handleQRDetected(qrInput);
    }
  };

  // Handle detected QR code
  const handleQRDetected = async (qrData) => {
    if (qrData === lastScanned) return;
    
    setLastScanned(qrData);
    setStatus("🔍 Validating QR code...");

    try {
      const parsed = JSON.parse(qrData);
      console.log("Parsed QR data:", parsed);

      const res = await axios.post("http://localhost:5000/qr/validate", {
        qr_id: parsed.qr_id,
        signature: parsed.signature
      });

      console.log("Validation response:", res.data);

      if (res.data.msg === "QR valid") {
        // Stop scanning immediately on success
        stopScanning();
        
        // Set verification result and show success page
        setVerificationResult({
          success: true,
          message: "QR Authentication Successful!",
          userId: res.data.user_id,
          timestamp: new Date().toLocaleString(),
          qrId: parsed.qr_id
        });
        setShowSuccessPage(true);
      } else {
        setStatus("❌ " + res.data.msg);
        
        // Reset after 3 seconds for failed attempts
        setTimeout(() => {
          setStatus("Position mobile QR code in front of camera");
          setLastScanned("");
        }, 3000);
      }
    } catch (err) {
      console.error("QR validation error:", err);
      if (err.response) {
        setStatus(`❌ ${err.response.data.msg || 'QR validation failed'}`);
      } else {
        setStatus("❌ Invalid QR format or network error");
      }
      
      // Reset after 3 seconds for errors
      setTimeout(() => {
        setStatus("Position mobile QR code in front of camera");
        setLastScanned("");
      }, 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Success Page Component
  if (showSuccessPage && verificationResult) {
    return (
      <div className="container">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1 className="success-title">Verification Successful!</h1>
          
          <div className="success-details">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value success-text">Authenticated</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{verificationResult.userId}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">{verificationResult.timestamp}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">QR ID:</span>
              <span className="detail-value qr-id">{verificationResult.qrId.substring(0, 16)}...</span>
            </div>
          </div>
          
          <div className="success-actions">
            <button 
              onClick={() => window.location.href = '/face-detection'}
              style={{
                padding: '15px 30px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                marginRight: '10px'
              }}
            >
              📝 Mark Attendance
            </button>
            
            <button 
              onClick={resetToScanner}
              style={{
                padding: '15px 30px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Scan Another QR Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanner Page Component
  return (
    <div className="container">
      <div className="scanner-container">
        <h1 className="scanner-title">
          QR Code Scanner
        </h1>

        <div style={{ position: 'relative' }}>
          <div id="qr-scanner-container" style={{ 
            width: '100%', 
            maxWidth: '500px',
            margin: '0 auto'
          }}></div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {!isScanning ? (
            <button 
              onClick={startScanning}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Start Scanner
            </button>
          ) : (
            <button 
              onClick={stopScanning}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Stop Scanner
            </button>
          )}
          
          <button 
            onClick={handleManualInput}
            style={{
              padding: '12px 24px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Manual QR Test
          </button>
        </div>

        <div className="status-container">
          <p className="status-text">
            {status}
          </p>
        </div>

        <div className="instructions">
          <p>• Click "Start Scanner" to enable automatic QR detection</p>
          <p>• Point camera at mobile QR code - it will scan automatically</p>
          <p>• Use "Manual QR Test" to paste QR data for testing</p>
          <p>• QR codes refresh every 15 seconds on mobile</p>
        </div>
      </div>
    </div>
  );
}

export default QrScannerPage;
