import React from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Attendance System Dashboard
        </h1>
        
        <p className="text-gray-600 mb-8">
          Laptop/Desktop Portal for QR Code Scanning
        </p>

        <div className="space-y-4">
          <Link to="/qr-scan">
            <button className="w-full bg-blue-500 p-4 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold">
              🔍 Scan QR for Attendance
            </button>
          </Link>
          
          <div className="text-sm text-gray-500 mt-6">
            <p>Instructions:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>1. Open mobile app to generate QR</li>
              <li>2. Click "Scan QR for Attendance"</li>
              <li>3. Point camera at mobile QR code</li>
              <li>4. System will validate attendance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
