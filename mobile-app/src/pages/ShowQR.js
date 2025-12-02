import React, { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import axios from "axios";

function ShowQR() {
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    fetchQR();
    const interval = setInterval(fetchQR, 15000); // regenerate every 15 sec
    return () => clearInterval(interval);
  }, []);

  const fetchQR = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/qr/generate", {
      headers: { Authorization: token },
    });
    setQrData(res.data);
  };

  return (
    <div className="flex flex-col items-center mt-10">
      {qrData && (
        <>
          <QRCode value={JSON.stringify(qrData)} size={220} />
          <p className="mt-4 text-center">QR will refresh every 15 sec</p>
        </>
      )}
    </div>
  );
}

export default ShowQR;
