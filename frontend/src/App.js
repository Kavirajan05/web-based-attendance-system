import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import QrScanner from "./pages/QrScanner";
import Dashboard from "./pages/Dashboard";
import FaceDetection from "./pages/FaceDetection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* QR Code Scanner Page */}
        <Route path="/qr-scan" element={<QrScanner />} />
        
        {/* Face Detection Page */}
        <Route path="/face-detection" element={<FaceDetection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
