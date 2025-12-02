# Attendance System - Requirements

## 1. Core Features

1. Mobile-generated dynamic QR
2. Laptop QR scanner
3. Face detection + bounding box
4. Face recognition (ArcFace)
5. GPS validation (mobile)
6. Office WiFi/IP validation
7. Attendance marking logic
8. Employee dashboard
9. Admin dashboard

## 2. Non-Functional Requirements

1. Secure (JWT, HTTPS, encryption)
2. Real-time webcam access
3. Accuracy in face match
4. Low latency
5. Multi-device compatible

## 3. Frontend – Laptop Portal

1. React.js
2. TailwindCSS
3. WebRTC (camera access)
4. React-QR-Reader (QR scan)
5. Canvas API (for bounding box rendering)

## 4. Frontend – Mobile App / PWA

1. React or React Native
2. QR generation library (qrcode.js)
3. GPS: HTML Geolocation API

## 5. Backend

1. Node.js + Express (or FastAPI Python — choose ONE)
2. Recommended for speed → Node.js + Express

## 6. ML Models

1. RetinaFace (face detection)
2. ArcFace (face recognition)
3. PyTorch + pretrained weights
4. ONNX Runtime for faster inference

## 7. Database

1. MongoDB Atlas
2. Collections: users, attendance, embeddings, qr_tokens

## 8. Deployment

1. Backend → Railway
2. Frontend → Vercel
3. DB → MongoDB Atlas
