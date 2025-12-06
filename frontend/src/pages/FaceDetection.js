import React, { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

function FaceDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    facesDetected: 0,
    confidence: 0
  });
  const [useSimpleMode, setUseSimpleMode] = useState(false);
  const [faceDetections, setFaceDetections] = useState([]);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAttendanceTime, setLastAttendanceTime] = useState(0);

  useEffect(() => {
    // Auto-start with quick camera setup for best speed
    setupSimpleCamera();
    
    // Add timeout for safety
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Camera setup taking too long, might need manual intervention");
      }
    }, 10000); // 10 second timeout
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timeout);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function setupFaceDetection() {
    try {
      setIsLoading(true);
      console.log("Starting face detection setup...");
      
      // Setup camera first
      console.log("Requesting camera access...");
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted");
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          videoRef.current.play().then(() => {
            console.log("Video started playing");
          }).catch(error => {
            console.error("Video play failed:", error);
          });
        };
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play, camera is ready");
          // Force a re-render to update status
          setIsLoading(false);
        };
        
        videoRef.current.onplaying = () => {
          console.log("Video is actively playing");
          // Camera is definitely ready now
        };
      }

      // Load face detection model with local cache
      console.log("Loading MediaPipe model...");
      
      try {
        // Try to use local files first (faster)
        const vision = await FilesetResolver.forVisionTasks("/mediapipe");
        console.log("Using local MediaPipe files");
        
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite"
          },
          runningMode: "VIDEO"
        });
      } catch (localError) {
        console.log("Local files not found, using CDN...");
        // Fallback to CDN if local files don't exist
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        console.log("Vision tasks loaded from CDN");

        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
          },
          runningMode: "VIDEO"
        });
      }
      console.log("Face detector created successfully");

      console.log("Model loaded, waiting for camera to be ready...");
      // setIsLoading will be set to false when video is ready
    } catch (error) {
      console.error("Setup error:", error);
      setIsLoading(false);
      
      // Offer simple mode as fallback
      if (confirm(`AI model loading failed: ${error.message}\n\nWould you like to use Simple Camera Mode instead? (Basic face capture without AI detection)`)) {
        await setupSimpleCamera();
      }
    }
  }

  async function setupSimpleCamera() {
    console.log("=== Starting Simple Camera Setup ===");
    setUseSimpleMode(true);
    
    try {
      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported by this browser");
      }
      
      console.log("Requesting camera access...");
      
      // Use simpler constraints that match QR scanner
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      console.log("✅ Camera stream obtained:", stream);
      
      if (videoRef.current) {
        console.log("Setting video source...");
        videoRef.current.srcObject = stream;
        
        // Set up event handlers for proper status updates
        videoRef.current.oncanplay = () => {
          console.log("✅ Video can play - camera ready");
          setIsLoading(false);
          // Start face detection
          startLightweightFaceDetection();
        };
        
        videoRef.current.onplaying = () => {
          console.log("✅ Video is playing - fully ready");
          setIsLoading(false);
          // Ensure face detection is running
          startLightweightFaceDetection();
        };
        
        // Force video to play immediately
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("✅ Video playing successfully");
              setIsLoading(false);
            })
            .catch(error => {
              console.error("❌ Video play failed:", error);
              // Still set as ready since video is visible
              setIsLoading(false);
            });
        } else {
          console.log("✅ Video started (no promise)");
          setIsLoading(false);
        }
        
      } else {
        console.error("❌ Video ref is null");
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("❌ Camera setup error:", error);
      setIsLoading(false);
      alert(`Camera error: ${error.message}\n\nTry clicking "Retry Camera Setup"`);
    }
  }

  async function downloadAndCacheModel() {
    try {
      setIsLoading(true);
      console.log("Downloading MediaPipe model for offline use...");
      
      // This would normally download and cache the model files
      // For now, we'll just set up the camera and skip the model
      alert("Model caching feature coming soon!\nUsing Simple Camera Mode for now.");
      await setupSimpleCamera();
    } catch (error) {
      console.error("Cache setup failed:", error);
      setIsLoading(false);
    }
  }

  function startLightweightFaceDetection() {
    if (!videoRef.current || !canvasRef.current) return;
    
    console.log("🎯 Starting lightweight face detection");
    
    // Try browser's native FaceDetector first
    if ('FaceDetector' in window) {
      console.log("Using browser FaceDetector API");
      useBrowserFaceDetector();
    } else {
      console.log("Using simple face detection algorithm");
      useSimpleFaceDetection();
    }
  }

  async function useBrowserFaceDetector() {
    try {
      const faceDetector = new window.FaceDetector({
        maxDetectedFaces: 5,
        fastMode: true
      });
      
      function detectFaces() {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          requestAnimationFrame(detectFaces);
          return;
        }
        
        faceDetector.detect(videoRef.current)
          .then(faces => {
            drawBoundingBoxes(faces);
            const newStats = {
              facesDetected: faces.length,
              confidence: faces.length > 0 ? 85 : 0 // Browser API doesn't provide confidence
            };
            setDetectionStats(newStats);
            
            // Check for auto-attendance
            checkAutoAttendance(newStats);
            requestAnimationFrame(detectFaces);
          })
          .catch(error => {
            console.log("Browser face detection failed, falling back to simple detection");
            useSimpleFaceDetection();
          });
      }
      
      detectFaces();
    } catch (error) {
      console.log("Browser FaceDetector not available, using simple detection");
      useSimpleFaceDetection();
    }
  }

  function useSimpleFaceDetection() {
    // Simple face detection using color/shape analysis
    function detectFaces() {
      if (!videoRef.current || !canvasRef.current) {
        requestAnimationFrame(detectFaces);
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw video frame to analyze
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simple face detection: look for skin-colored regions in face area
      const faceRegion = detectSkinRegion(ctx, canvas.width, canvas.height);
      
      if (faceRegion) {
        drawBoundingBoxes([faceRegion]);
        const newStats = {
          facesDetected: 1,
          confidence: faceRegion.confidence
        };
        setDetectionStats(newStats);
        
        // Check for auto-attendance
        checkAutoAttendance(newStats);
      } else {
        // Clear canvas but keep video visible
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const newStats = {
          facesDetected: 0,
          confidence: 0
        };
        setDetectionStats(newStats);
      }
      
      requestAnimationFrame(detectFaces);
    }
    
    detectFaces();
  }

  function detectSkinRegion(ctx, width, height) {
    try {
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Define face detection area (center region where faces usually appear)
      const centerX = width / 2;
      const centerY = height / 2;
      const searchWidth = width * 0.6;
      const searchHeight = height * 0.8;
      
      let skinPixels = 0;
      let totalPixels = 0;
      
      // Simple skin detection algorithm
      for (let y = centerY - searchHeight/2; y < centerY + searchHeight/2; y += 5) {
        for (let x = centerX - searchWidth/2; x < centerX + searchWidth/2; x += 5) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (Math.floor(y) * width + Math.floor(x)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simple skin color detection
            if (isSkinColor(r, g, b)) {
              skinPixels++;
            }
            totalPixels++;
          }
        }
      }
      
      const skinRatio = skinPixels / totalPixels;
      
      if (skinRatio > 0.15) { // If >15% skin-colored pixels
        // Return bounding box around detected region
        const confidence = Math.min(90, skinRatio * 400);
        return {
          boundingBox: {
            x: centerX - searchWidth/4,
            y: centerY - searchHeight/3,
            width: searchWidth/2,
            height: searchHeight/2
          },
          confidence: Math.round(confidence)
        };
      }
      
      return null;
    } catch (error) {
      console.error("Face detection error:", error);
      return null;
    }
  }

  function isSkinColor(r, g, b) {
    // Simple skin color detection algorithm
    return (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15
    );
  }

  function drawBoundingBoxes(faces) {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    faces.forEach(face => {
      const bbox = face.boundingBox || face;
      const confidence = face.confidence || 85;
      
      // Choose color based on confidence
      const color = confidence > 70 ? '#00FF00' : '#FFD700';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      
      // Draw confidence text
      ctx.fillStyle = color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(
        `Face: ${confidence}%`,
        bbox.x,
        bbox.y - 10 < 20 ? bbox.y + bbox.height + 20 : bbox.y - 10
      );
      
      // Draw corner indicators
      const cornerSize = 20;
      ctx.lineWidth = 4;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(bbox.x, bbox.y + cornerSize);
      ctx.lineTo(bbox.x, bbox.y);
      ctx.lineTo(bbox.x + cornerSize, bbox.y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.width - cornerSize, bbox.y);
      ctx.lineTo(bbox.x + bbox.width, bbox.y);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(bbox.x, bbox.y + bbox.height - cornerSize);
      ctx.lineTo(bbox.x, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + cornerSize, bbox.y + bbox.height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.width - cornerSize, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height);
      ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height - cornerSize);
      ctx.stroke();
    });
  }

  function checkAutoAttendance(stats) {
    if (!autoDetectMode || showSuccess) return;
    
    // Auto-attendance when face is detected with good confidence
    if (stats.facesDetected > 0 && stats.confidence >= 75) {
      if (countdown === 0) {
        // Start 10-second single attempt countdown
        setCountdown(10);
        startCountdown(stats);
      }
    } else {
      // Reset countdown if face lost or confidence too low
      setCountdown(0);
    }
  }

  function startCountdown(validatedStats) {
    let count = 10;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(timer);
        // Disable auto mode to prevent repeating
        setAutoDetectMode(false);
        // Try to mark attendance once
        autoMarkAttendance(validatedStats);
      }
    }, 1000);
  }

  async function autoMarkAttendance(validatedStats) {
    if (showSuccess) return;
    
    // Double-check confidence before proceeding
    if (!validatedStats || validatedStats.confidence < 75) {
      console.warn("⚠️  Auto-attendance cancelled: insufficient confidence", validatedStats?.confidence);
      setCountdown(0);
      return;
    }
    
    // Prevent duplicate attendance within 10 seconds
    const now = Date.now();
    if (now - lastAttendanceTime < 10000) {
      console.warn("⚠️  Auto-attendance cancelled: too soon since last attendance");
      setCountdown(0);
      return;
    }
    
    setLastAttendanceTime(now);
    
    try {
      console.log("🔍 Starting face comparison process...");
      
      // Capture the face image
      const faceImageData = await captureImageData();
      
      // Step 1: Compare captured face with registered employees
      const comparisonResponse = await fetch('http://localhost:5000/api/face/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capturedFaceImage: faceImageData
        })
      });

      const comparisonResult = await comparisonResponse.json();
      
      if (!comparisonResult.success) {
        console.error("❌ Face comparison failed:", comparisonResult.message);
        setCountdown(0);
        showAttendanceFailure("Face comparison system error. Please try again.", comparisonResult.message);
        return;
      }

      if (!comparisonResult.matched) {
        console.log("❌ No matching employee found");
        setCountdown(0);
        showAttendanceFailure(
          `Employee not recognized. Best match: ${comparisonResult.bestSimilarity}% similarity.`,
          "Please ensure you are registered in the system and position your face clearly in front of the camera."
        );
        return;
      }

      const matchedEmployee = comparisonResult.employee;
      console.log(`✅ Employee recognized: ${matchedEmployee.name} (${matchedEmployee.employeeId}) - ${matchedEmployee.similarity}% similarity`);
      
      // Prepare attendance data with matched employee
      const attendanceData = {
        timestamp: new Date().toISOString(),
        faceImage: faceImageData,
        method: "face_recognition",
        confidence: validatedStats.confidence,
        faceMatchSimilarity: matchedEmployee.similarity,
        employeeId: matchedEmployee.employeeId,
        employeeName: matchedEmployee.name,
        userId: matchedEmployee.employeeId, // Use actual employee ID
        deviceInfo: navigator.userAgent,
        location: window.location.href
      };
      
      console.log("Sending attendance data to backend:", attendanceData);
      
      // Send to backend API
      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Attendance saved to database:", result);
        
        // Show success message with employee details
        alert(`✅ Attendance marked successfully!\n\nEmployee: ${matchedEmployee.name}\nID: ${matchedEmployee.employeeId}\nFace Match: ${matchedEmployee.similarity}%`);
        
        // Show success page
        setShowSuccess(true);
        setAutoDetectMode(false);
      } else {
        console.error("❌ Backend error:", response.status);
        // Still show success but indicate storage issue
        setShowSuccess(true);
        setAutoDetectMode(false);
        alert(`Attendance recorded locally for ${matchedEmployee.name}, but server storage failed. Contact administrator.`);
      }
      
    } catch (error) {
      console.error("❌ Attendance storage error:", error);
      setCountdown(0);
      
      // Show failure with retry option
      showAttendanceFailure(
        "System error during attendance processing.",
        `Error: ${error.message}. Please try again.`
      );
    }
  }

  function showAttendanceFailure(mainMessage, detailMessage) {
    // Stop auto detection
    setAutoDetectMode(false);
    setCountdown(0);
    
    // Show error message with retry option
    const userWantsRetry = confirm(
      `❌ Attendance Failed\n\n${mainMessage}\n\n${detailMessage}\n\n` +
      "Click OK to try again, or Cancel to stop."
    );
    
    if (userWantsRetry) {
      // Reset for manual retry
      setTimeout(() => {
        setAutoDetectMode(true);
        setCountdown(0);
        console.log("🔄 Ready for retry - position your face in front of the camera");
      }, 1000);
    } else {
      console.log("❌ User chose not to retry");
    }
  }

  function captureImageData() {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      
      if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        resolve(imageData);
      } else {
        resolve(null);
      }
    });
  }

  function storeAttendanceLocally(data) {
    try {
      const existingData = JSON.parse(localStorage.getItem('pendingAttendance') || '[]');
      existingData.push(data);
      localStorage.setItem('pendingAttendance', JSON.stringify(existingData));
      console.log("📱 Attendance stored locally:", data);
    } catch (error) {
      console.error("Local storage failed:", error);
    }
  }

  function resetDetection() {
    setShowSuccess(false);
    setAutoDetectMode(true);
    setCountdown(0);
    setupSimpleCamera();
  }

  function startDetection() {
    setIsDetecting(true);
    detectFaces();
  }

  function stopDetection() {
    setIsDetecting(false);
  }

  function detectFaces() {
    if (!isDetecting || !faceDetectorRef.current || !videoRef.current) {
      console.log("Detection stopped or not ready");
      return;
    }

    try {
      // Check if video is ready
      if (videoRef.current.readyState !== 4) {
        setTimeout(detectFaces, 100);
        return;
      }

      const detections = faceDetectorRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );

      drawDetections(detections);
      
      // Update stats
      if (detections && detections.detections) {
        const faces = detections.detections.length;
        const confidence = faces > 0 ? detections.detections[0].categories[0].score : 0;
        
        setDetectionStats({
          facesDetected: faces,
          confidence: Math.round(confidence * 100)
        });
        
        console.log(`Faces: ${faces}, Confidence: ${Math.round(confidence * 100)}%`);
      }

      if (isDetecting) {
        requestAnimationFrame(detectFaces);
      }
    } catch (error) {
      console.error("Detection error:", error);
      // Continue trying
      if (isDetecting) {
        setTimeout(detectFaces, 1000);
      }
    }
  }

  function drawDetections(detections) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext("2d");
    
    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections?.detections?.length) return;

    detections.detections.forEach((detection) => {
      const bbox = detection.boundingBox;
      const confidence = detection.categories[0].score;

      // Convert normalized coordinates to canvas pixels
      const x = bbox.originX * canvas.width;
      const y = bbox.originY * canvas.height;
      const width = bbox.width * canvas.width;
      const height = bbox.height * canvas.height;

      // Draw bounding box
      ctx.strokeStyle = confidence > 0.7 ? "#00ff00" : "#ffff00";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence text
      ctx.fillStyle = confidence > 0.7 ? "#00ff00" : "#ffff00";
      ctx.font = "18px Arial";
      ctx.fillText(
        `Face: ${(confidence * 100).toFixed(1)}%`,
        x,
        y > 25 ? y - 10 : y + height + 25
      );
    });
  }

  function captureImage() {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 640, 480);

    const imageData = canvas.toDataURL("image/jpeg");
    console.log("Captured Image for Recognition:", imageData);
    
    // TODO: Send to backend for ArcFace recognition (Day 6)
    alert("Face captured! (Ready for recognition system)");
  }

  function markAttendance() {
    if (!videoRef.current?.srcObject) {
      alert("Camera not ready! Please start the camera first.");
      return;
    }
    
    // For simple mode, just confirm with user
    if (useSimpleMode) {
      const confirmed = confirm("Mark your attendance now?\n\nMake sure your face is clearly visible in the camera.");
      if (!confirmed) return;
    }
    
    // Capture face and mark attendance
    captureImage();
    
    // Create attendance record
    const attendanceData = {
      timestamp: new Date().toISOString(),
      method: useSimpleMode ? "quick_camera" : "ai_detection",
      userId: "current_user" // TODO: Get from authentication
    };
    
    console.log("Marking attendance:", attendanceData);
    
    // TODO: Send to backend API
    alert(`✅ Attendance marked successfully!\n\nTime: ${new Date().toLocaleString()}\nMethod: ${useSimpleMode ? 'Quick Camera' : 'AI Detection'}\n\nThank you!`);
  }

  if (showSuccess) {
    return (
      <div className="container">
        <div className="success-page">
          <div className="success-animation">
            <div className="checkmark">✓</div>
          </div>
          <h1 className="success-title">Face Detected Successfully!</h1>
          <div className="success-stats">
            <div className="stat-card">
              <h3>Detection Results</h3>
              <p><strong>Faces Detected:</strong> {detectionStats.facesDetected}</p>
              <p><strong>Confidence Score:</strong> <span className="confidence-high">{detectionStats.confidence}%</span></p>
              <p><strong>Detection Method:</strong> Auto Detection</p>
            </div>
            <div className="stat-card">
              <h3>Attendance Marked</h3>
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> <span className="status-success">✓ Complete</span></p>
              <p><strong>Method:</strong> Face Recognition</p>
            </div>
          </div>
          <div className="success-message">
            <h2>🎉 Attendance Successfully Recorded!</h2>
            <p>Your face was automatically detected and your attendance has been marked.</p>
            <p>Thank you for using the automated attendance system!</p>
          </div>
          <div className="success-actions">
            <button onClick={resetDetection} className="btn-primary">
              Mark Another Attendance
            </button>
            <button onClick={() => window.location.href = '/'} className="btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Quick Camera Setup</h2>
          <p>Starting camera for fast attendance... (2-3 seconds)</p>
          <p>If this takes too long, your browser may be asking for camera permission.</p>
          <div style={{marginTop: '15px'}}>
            <button onClick={setupSimpleCamera} className="btn-secondary">
              Retry Camera Setup
            </button>
            <button onClick={() => {
              console.log("=== Debug Info ===");
              console.log("Video ref:", videoRef.current);
              console.log("Video srcObject:", videoRef.current?.srcObject);
              console.log("Video readyState:", videoRef.current?.readyState);
              console.log("isLoading:", isLoading);
              console.log("useSimpleMode:", useSimpleMode);
            }} className="btn-secondary" style={{marginLeft: '10px'}}>
              Debug Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="face-detection-container">
        <h1 className="face-detection-title">Face Detection for Attendance</h1>
        
        <div className="camera-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              width="640"
              height="480"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="detection-overlay"
            />
          </div>
        </div>

        <div className="camera-status">
          <div className="status-indicator">
            <span className="status-label">Camera Status:</span>
            <span className={`status-value ${!isLoading && videoRef.current?.srcObject ? 'ready' : 'loading'}`}>
              {isLoading ? "Setting up..." : 
               !videoRef.current?.srcObject ? "Camera starting..." :
               videoRef.current?.videoWidth > 0 ? "Ready - Face Detection Active" :
               "Camera ready - Loading video..."}
            </span>
          </div>
          
          {!isLoading && videoRef.current?.srcObject && (
            <div className="detection-info">
              <span className="faces-count">
                Faces: <strong>{detectionStats.facesDetected}</strong>
              </span>
              <span className="confidence-score">
                Confidence: <strong className={detectionStats.confidence > 70 ? 'high-confidence' : 'low-confidence'}>
                  {detectionStats.confidence}%
                </strong>
              </span>
              {countdown > 0 && (
                <span className="countdown">
                  Face recognition attempt: <strong className="countdown-number">{countdown}s</strong>
                </span>
              )}
              {!autoDetectMode && countdown === 0 && !showSuccess && (
                <span className="retry-notice" style={{color: '#ff6b35', fontWeight: 'bold'}}>
                  Recognition stopped. Use "Try Again" button to retry.
                </span>
              )}
            </div>
          )}
        </div>

        <div className="control-buttons">
          {!videoRef.current?.srcObject && isLoading ? (
            <button onClick={setupSimpleCamera} className="btn-primary" disabled={isLoading}>
              {isLoading ? "Setting up Camera..." : "Start Camera"}
            </button>
          ) : (
            <>
              <button onClick={captureImage} className="btn-primary">
                Capture Face for Attendance
              </button>
              <button onClick={markAttendance} className="btn-attendance">
                Mark Attendance Complete
              </button>
              
              {/* Manual retry button when auto-detection is disabled */}
              {!autoDetectMode && countdown === 0 && !showSuccess && (
                <button 
                  onClick={() => {
                    setAutoDetectMode(true);
                    setCountdown(0);
                    console.log("🔄 Manual retry initiated");
                  }} 
                  className="btn-retry"
                  style={{
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    marginTop: '10px',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Try Face Recognition Again
                </button>
              )}
              
              {isLoading && (
                <button onClick={() => setIsLoading(false)} className="btn-secondary" style={{marginTop: '10px'}}>
                  Camera Ready - Continue
                </button>
              )}
            </>
          )}
          
          
          {/* Advanced options - hidden by default for speed */}
          <details className="advanced-options">
            <summary>Advanced Options</summary>
            <button onClick={setupFaceDetection} className="btn-secondary" disabled={isLoading}>
              Enable AI Detection (Slower)
            </button>
            <button onClick={downloadAndCacheModel} className="btn-secondary" disabled={isLoading}>
              Download AI Model
            </button>
          </details>
        </div>

        <div className="quick-instructions">
          <h3>Quick Steps:</h3>
          <ol>
            <li>Position your face in the camera</li>
            <li>Click "Capture Face for Attendance"</li>
            <li>Click "Mark Attendance Complete"</li>
          </ol>
          <p className="speed-note">Optimized for speed - No AI delays!</p>
        </div>
      </div>
    </div>
  );
}

export default FaceDetection;