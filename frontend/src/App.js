import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import QrScanner from "./pages/QrScanner";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* QR Code Scanner Page */}
        <Route path="/qr-scan" element={<QrScanner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
