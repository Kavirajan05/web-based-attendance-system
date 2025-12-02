
# Database Schema

## 1. Users Collection

1. `user_id` (string)
2. `name` (string)
3. `email` (string)
4. `password_hash` (string)
5. `role` (employee/admin)
6. `embedding` (vector[512])
7. `created_at` (timestamp)

## 2. Attendance Collection

1. `attendance_id` (string)
2. `user_id` (string)
3. `timestamp` (datetime)
4. `qr_id` (string)
5. `face_match_score` (number)
6. `gps_valid` (boolean)
7. `wifi_valid` (boolean)
8. `status` (present/failed)

## 3. QR Tokens Collection

1. `qr_id` (string)
2. `user_id` (string)
3. `issued_at` (datetime)
4. `expires_at` (datetime)
5. `signature_hash` (string)
