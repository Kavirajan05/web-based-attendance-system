import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/AttendanceSuccess.css';

function AttendanceSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { employeeName, timestamp, confidence, faceMatch } = location.state || {};

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    const time = new Date(date);
    return time.toLocaleString();
  };

  return (
    <div className="attendance-success">
      <div className="success-container">
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>
        
        <h1 className="success-title">✅ Attendance Marked!</h1>
        
        <div className="success-details">
          <div className="employee-info">
            <h2>Welcome, {employeeName || 'Employee'}</h2>
            <p className="timestamp">Recorded at: {formatTime(timestamp)}</p>
          </div>
          
          <div className="verification-stats">
            <div className="stat-item">
              <span className="stat-label">Face Detection</span>
              <span className="stat-value success">{confidence || 'N/A'}%</span>
            </div>
            {faceMatch && faceMatch !== 'N/A' && (
              <div className="stat-item">
                <span className="stat-label">Face Match</span>
                <span className="stat-value success">{faceMatch}%</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-label">Security</span>
              <span className="stat-value success">✓ Verified</span>
            </div>
          </div>
        </div>
        
        <div className="success-message">
          <p>Your attendance has been successfully recorded in the system.</p>
          <p className="security-note">🔒 Verified with facial recognition technology</p>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            🏠 Back to Dashboard
          </button>
          <button 
            onClick={() => navigate('/qr-scan')}
            className="btn btn-secondary"
          >
            📱 Scan Another QR
          </button>
          <button 
            onClick={() => navigate('/attendance-records')}
            className="btn btn-info"
          >
            📊 View Records
          </button>
        </div>
        
        <div className="auto-redirect">
          <p>Automatically redirecting to dashboard in 10 seconds...</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceSuccess;