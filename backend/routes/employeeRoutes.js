const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/employee-photos';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/employees/register - Register new employee
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const { employeeId, name, email, department, position } = req.body;

    // Validation
    if (!employeeId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and name are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required for registration'
      });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists'
      });
    }

    // Convert image to base64 for storage
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;

    // Create new employee
    const employee = new Employee({
      employeeId,
      name,
      email: email || null,
      department: department || null,
      position: position || null,
      photo: base64Image,
      photoPath: req.file.path
    });

    await employee.save();

    console.log(`✅ Employee registered: ${name} (${employeeId})`);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        registeredAt: employee.registeredAt
      }
    });

  } catch (error) {
    console.error('❌ Employee registration error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('-photo') // Exclude base64 photo for list view
      .sort({ name: 1 });

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
});

// GET /api/employees/photos/all - Get all employee photos for face comparison
router.get('/photos/all', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('employeeId name photo');

    res.json({
      success: true,
      count: employees.length,
      employees: employees.map(emp => ({
        employeeId: emp.employeeId,
        name: emp.name,
        photo: emp.photo
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching employee photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee photos',
      error: error.message
    });
  }
});

// Get employee by QR code
router.get('/by-qr/:qrCode', (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const employee = employees.find(emp => emp.qrCode === qrCode && emp.status === 'active');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    res.json({
      success: true,
      employee: {
        ...employee,
        profileImageUrl: employee.profileImage ? `/uploads/employees/${employee.profileImage}` : null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching employee by QR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
});

// Get employee by ID
router.get('/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      employee: {
        ...employee,
        profileImageUrl: employee.profileImage ? `/uploads/employees/${employee.profileImage}` : null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
});

// Update employee profile image
router.put('/:employeeId/photo', upload.single('profileImage'), (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    
    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image is required'
      });
    }

    employees[employeeIndex].profileImage = req.file.filename;

    console.log('✅ Employee photo updated:', employeeId);

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      employee: {
        ...employees[employeeIndex],
        profileImageUrl: `/uploads/employees/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('❌ Error updating employee photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile image',
      error: error.message
    });
  }
});

// Generate new QR code for employee
router.put('/:employeeId/regenerate-qr', (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    
    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const newQrCode = `QR_${employeeId}_${Date.now()}`;
    employees[employeeIndex].qrCode = newQrCode;

    console.log('✅ QR code regenerated for:', employeeId);

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      employee: employees[employeeIndex]
    });

  } catch (error) {
    console.error('❌ Error regenerating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate QR code',
      error: error.message
    });
  }
});

module.exports = router;