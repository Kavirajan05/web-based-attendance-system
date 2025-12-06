import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import QrScanner from "./pages/QrScanner";
import Dashboard from "./pages/Dashboard";
import FaceDetection from "./pages/FaceDetection";
import EnhancedFaceDetection from "./pages/EnhancedFaceDetection";
import EmployeeManagement from "./pages/EmployeeManagement";
import AttendanceSuccess from "./pages/AttendanceSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* QR Code Scanner Page */}
        <Route path="/qr-scan" element={<QrScanner />} />
        
        {/* Face Detection Pages */}
        <Route path="/face-detection" element={<FaceDetection />} />
        <Route path="/enhanced-face-detection" element={<EnhancedFaceDetection />} />
        
        {/* Employee Management */}
        <Route path="/employee-management" element={<EmployeeManagement />} />
        
        {/* Success Pages */}
        <Route path="/attendance-success" element={<AttendanceSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
