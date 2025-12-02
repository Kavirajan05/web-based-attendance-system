# API Design

## 1. Auth

1. `POST /auth/login`
2. `POST /auth/register`

## 2. QR

1. `POST /generate-qr`
2. `POST /validate-qr`

## 3. Face

1. `POST /verify-face` (upload frame or base64)

## 4. GPS

1. `POST /validate-gps`

## 5. WiFi/IP

1. `GET /validate-ip`

## 6. Attendance

1. `POST /mark-attendance`

## 7. Dashboards

1. `GET /user/attendance`
2. `GET /admin/attendance`
