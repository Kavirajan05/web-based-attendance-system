const express = require('express');
const router = express.Router();

// In-memory storage for demo (replace with database)
let attendanceRecords = [];

// Mark attendance
router.post('/mark', async (req, res) => {
  try {
    console.log('📝 Attendance marking request received:', {
      timestamp: req.body.timestamp,
      method: req.body.method,
      confidence: req.body.confidence,
      userId: req.body.userId
    });

    const attendanceRecord = {
      id: Date.now().toString(),
      ...req.body,
      serverTimestamp: new Date().toISOString(),
      status: 'recorded'
    };

    // Store in memory (replace with database save)
    attendanceRecords.push(attendanceRecord);

    console.log('✅ Attendance saved successfully:', attendanceRecord.id);
    console.log('📊 Total attendance records:', attendanceRecords.length);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendanceId: attendanceRecord.id,
      timestamp: attendanceRecord.serverTimestamp,
      totalRecords: attendanceRecords.length
    });

  } catch (error) {
    console.error('❌ Attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
});

// Get all attendance records
router.get('/records', (req, res) => {
  try {
    console.log('📋 Attendance records requested');
    
    res.json({
      success: true,
      records: attendanceRecords,
      total: attendanceRecords.length
    });

  } catch (error) {
    console.error('❌ Error fetching records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch records',
      error: error.message
    });
  }
});

// Get attendance stats
router.get('/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(record => 
      record.timestamp.startsWith(today)
    );

    const stats = {
      total: attendanceRecords.length,
      today: todayRecords.length,
      methods: {
        auto_detection: attendanceRecords.filter(r => r.method === 'auto_detection').length,
        quick_camera: attendanceRecords.filter(r => r.method === 'quick_camera').length,
        qr_code: attendanceRecords.filter(r => r.method === 'qr_code').length
      },
      averageConfidence: attendanceRecords
        .filter(r => r.confidence)
        .reduce((sum, r) => sum + r.confidence, 0) / 
        Math.max(1, attendanceRecords.filter(r => r.confidence).length)
    };

    console.log('📊 Attendance stats requested:', stats);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error generating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate stats',
      error: error.message
    });
  }
});

module.exports = router;