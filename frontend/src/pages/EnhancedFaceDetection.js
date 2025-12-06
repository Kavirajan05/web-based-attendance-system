import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FaceComparisonService from '../services/FaceComparisonService';
import "../styles/FaceDetection.css";

function FaceDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    facesDetected: 0,
    confidence: 0
  });
  const [faceDetections, setFaceDetections] = useState([]);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Employee verification states
  const [currentQrCode, setCurrentQrCode] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [verificationStage, setVerificationStage] = useState('qr'); // 'qr', 'face', 'verifying', 'success'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Get QR code from navigation state or URL params
    const qrCode = location.state?.qrCode || new URLSearchParams(location.search).get('qr');
    
    if (qrCode) {
      setCurrentQrCode(qrCode);
      fetchEmployeeByQR(qrCode);
    }
    
    // Setup camera
    setupSimpleCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [location]);

  async function fetchEmployeeByQR(qrCode) {
    try {
      console.log('🔍 Looking up employee by QR:', qrCode);
      const response = await fetch(`http://localhost:5000/api/employees/by-qr/${qrCode}`);
      
      if (response.ok) {
        const employee = await response.json();
        setEmployeeInfo(employee);
        setVerificationStage('face');
        console.log('👤 Employee found:', employee.name);
      } else {
        setErrorMessage('Invalid QR Code - Employee not found');
        setVerificationStage('qr');
      }
    } catch (error) {
      console.error('❌ Error fetching employee:', error);
      setErrorMessage('System error - Please try again');
    }
  }

  async function setupSimpleCamera() {
    try {
      setIsLoading(true);
      console.log("🎥 Setting up camera for speed optimization...");
      
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
          console.log("✅ Camera ready - Starting face detection");
          if (autoDetectMode) {
            startLightweightFaceDetection();
          }
        };
      }
    } catch (error) {
      console.error("❌ Camera setup failed:", error);
      setIsLoading(false);
    }
  }

  function startLightweightFaceDetection() {
    if (isDetecting) return;
    
    setIsDetecting(true);
    console.log("🔍 Starting lightweight face detection...");
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const detect = () => {
      if (!isDetecting || !video.videoWidth) return;
      
      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simple face detection using browser APIs
      detectFacesSimple(canvas, ctx);
      
      requestAnimationFrame(detect);
    };
    
    detect();
  }

  async function detectFacesSimple(canvas, ctx) {
    try {
      // Use simple face detection algorithm
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const faces = await simpleFaceDetection(imageData, canvas.width, canvas.height);
      
      setFaceDetections(faces);
      
      if (faces.length > 0) {
        const confidence = faces[0].confidence;
        setDetectionStats({
          facesDetected: faces.length,
          confidence: Math.round(confidence * 100)
        });
        
        // Draw bounding boxes
        drawFaceBounds(ctx, faces);
        
        // Check for automatic attendance if employee is loaded
        if (employeeInfo && verificationStage === 'face') {
          checkAutoAttendanceWithFaceMatch(confidence, ctx);
        }
      } else {
        setDetectionStats({
          facesDetected: 0,
          confidence: 0
        });
      }
    } catch (error) {
      console.error("Detection error:", error);
    }
  }

  async function simpleFaceDetection(imageData, width, height) {
    // Simple face detection using skin tone and facial features
    const data = imageData.data;
    const faces = [];
    
    // Look for skin-colored regions
    const skinRegions = [];
    
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (isSkinColor(r, g, b)) {
          skinRegions.push({ x, y });
        }
      }
    }
    
    // Find clusters of skin regions (potential faces)
    if (skinRegions.length > 20) {
      // Simple clustering - find center region
      const avgX = skinRegions.reduce((sum, p) => sum + p.x, 0) / skinRegions.length;
      const avgY = skinRegions.reduce((sum, p) => sum + p.y, 0) / skinRegions.length;
      
      faces.push({
        x: Math.max(0, avgX - 60),
        y: Math.max(0, avgY - 60),
        width: 120,
        height: 120,
        confidence: Math.min(0.95, skinRegions.length / 100)
      });
    }
    
    return faces;
  }

  function isSkinColor(r, g, b) {
    // Simple skin color detection
    const skinMask1 = r > 95 && g > 40 && b > 20 && 
                     Math.max(r, Math.max(g, b)) - Math.min(r, Math.min(g, b)) > 15 &&
                     Math.abs(r - g) > 15 && r > g && r > b;
    
    const skinMask2 = r > 220 && g > 210 && b > 170 &&
                     Math.abs(r - g) <= 15 && r > b && g > b;
    
    return skinMask1 || skinMask2;
  }

  function drawFaceBounds(ctx, faces) {
    faces.forEach(face => {
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(face.x, face.y, face.width, face.height);
      
      // Draw confidence
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(
        `${Math.round(face.confidence * 100)}%`, 
        face.x, 
        face.y - 5
      );
    });
  }

  async function checkAutoAttendanceWithFaceMatch(confidence, ctx) {
    if (countdown > 0 || showSuccess) return;
    
    if (confidence > 0.85 && !countdown) {
      console.log("🎯 High confidence face detected, starting verification...");
      setVerificationStage('verifying');
      
      // Capture face for comparison
      const faceImageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      // Compare with stored employee photo
      if (employeeInfo.profileImage) {
        const comparisonResult = await FaceComparisonService.compareFaces(
          faceImageData, 
          employeeInfo.profileImage
        );
        
        setFaceMatchResult(comparisonResult);
        
        if (comparisonResult.match) {
          startCountdown();
        } else {
          setErrorMessage(`Face doesn't match employee photo (${comparisonResult.confidence}% similarity)`);
          setVerificationStage('face');
        }
      } else {
        // No stored photo, proceed with face detection only
        startCountdown();
      }
    }
  }

  function startCountdown() {
    setCountdown(3);
    console.log("⏰ Starting attendance countdown...");
    
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          markAttendance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function markAttendance() {
    try {
      setIsDetecting(false);
      console.log("📝 Marking attendance...");
      
      const faceImageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      const attendanceData = {
        employeeId: employeeInfo?.id || 'unknown',
        employeeName: employeeInfo?.name || 'Unknown Employee',
        qrCode: currentQrCode,
        faceImage: faceImageData,
        confidence: detectionStats.confidence,
        faceMatchResult: faceMatchResult,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        console.log("✅ Attendance marked successfully");
        setShowSuccess(true);
        setVerificationStage('success');
        
        // Navigate to success page after delay
        setTimeout(() => {
          navigate('/attendance-success', {
            state: {
              employeeName: employeeInfo?.name || 'Employee',
              timestamp: new Date(),
              confidence: detectionStats.confidence,
              faceMatch: faceMatchResult?.confidence || 'N/A'
            }
          });
        }, 2000);
      } else {
        console.error("❌ Failed to mark attendance");
        setErrorMessage("Failed to mark attendance. Please try again.");
        setVerificationStage('face');
        setIsDetecting(true);
      }
    } catch (error) {
      console.error("❌ Attendance error:", error);
      setErrorMessage("System error. Please try again.");
      setVerificationStage('face');
      setIsDetecting(true);
    }
  }

  function resetDetection() {
    setShowSuccess(false);
    setCountdown(0);
    setVerificationStage(currentQrCode ? 'face' : 'qr');
    setErrorMessage('');
    setFaceMatchResult(null);
    if (!isDetecting) {
      setIsDetecting(true);
      startLightweightFaceDetection();
    }
  }

  const getStatusMessage = () => {
    if (isLoading) return "Starting camera...";
    if (verificationStage === 'qr') return "Scan QR code to begin";
    if (verificationStage === 'verifying') return "Verifying identity...";
    if (verificationStage === 'success') return "✅ Attendance Marked!";
    if (countdown > 0) return `Marking attendance in ${countdown}...`;
    if (showSuccess) return "✅ Attendance Marked Successfully!";
    if (errorMessage) return errorMessage;
    
    if (employeeInfo) {
      return `Face detection for ${employeeInfo.name} - ${detectionStats.confidence}% confidence`;
    }
    
    return `Face detection - ${detectionStats.confidence}% confidence`;
  };

  return (
    <div className="face-detection-container">
      <div className="detection-header">
        <h2>🎯 Smart Attendance System</h2>
        {employeeInfo && (
          <div className="employee-info">
            <div className="employee-card">
              {employeeInfo.profileImage && (
                <img 
                  src={`http://localhost:5000${employeeInfo.profileImage}`} 
                  alt={employeeInfo.name}
                  className="employee-photo"
                />
              )}
              <div className="employee-details">
                <h3>{employeeInfo.name}</h3>
                <p>ID: {employeeInfo.employeeId}</p>
                <p>Department: {employeeInfo.department}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
        <canvas
          ref={canvasRef}
          className="detection-overlay"
        />
        
        {countdown > 0 && (
          <div className="countdown-overlay">
            <div className="countdown-circle">
              <span className="countdown-number">{countdown}</span>
            </div>
          </div>
        )}
        
        {showSuccess && (
          <div className="success-overlay">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Attendance Marked!</h3>
              <p>Welcome, {employeeInfo?.name || 'Employee'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="status-panel">
        <div className={`status-indicator ${verificationStage}`}>
          <span className="status-text">{getStatusMessage()}</span>
        </div>
        
        <div className="detection-stats">
          <div className="stat-item">
            <span className="stat-label">Faces:</span>
            <span className="stat-value">{detectionStats.facesDetected}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Confidence:</span>
            <span className="stat-value">{detectionStats.confidence}%</span>
          </div>
          {faceMatchResult && (
            <div className="stat-item">
              <span className="stat-label">Face Match:</span>
              <span className={`stat-value ${faceMatchResult.match ? 'match' : 'no-match'}`}>
                {faceMatchResult.confidence}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="control-panel">
        <button 
          onClick={resetDetection} 
          className="control-button reset"
          disabled={isLoading}
        >
          🔄 Reset
        </button>
        <button 
          onClick={() => navigate('/qr-scan')} 
          className="control-button back"
        >
          ← Back to QR
        </button>
        {!currentQrCode && (
          <button 
            onClick={() => navigate('/employee-management')} 
            className="control-button manage"
          >
            👥 Manage Employees
          </button>
        )}
      </div>
    </div>
  );
}

export default FaceDetection;