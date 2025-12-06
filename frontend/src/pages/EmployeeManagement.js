import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeeManagement.css';

function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    email: '',
    phone: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.success ? data.employees : []);
      } else {
        showMessage('Failed to fetch employees', 'error');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showMessage('System error while fetching employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Image size should be less than 5MB', 'error');
        return;
      }
      setProfileImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employeeId) {
      showMessage('Employee ID and name are required', 'error');
      return;
    }

    if (!profileImage) {
      showMessage('Photo is required for facial recognition', 'error');
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append('employeeId', formData.employeeId);
    submitFormData.append('name', formData.name);
    submitFormData.append('email', formData.email);
    submitFormData.append('department', formData.department);
    submitFormData.append('position', formData.phone); // Reusing phone field as position
    submitFormData.append('photo', profileImage);

    try {
      const response = await fetch('http://localhost:5000/api/employees/register', {
        method: 'POST',
        body: submitFormData
      });

      const result = await response.json();

      if (result.success) {
        showMessage('✅ Employee registered successfully! Ready for face recognition.', 'success');
        resetForm();
        fetchEmployees();
      } else {
        showMessage(`❌ Registration failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error registering employee:', error);
      showMessage('System error while registering employee', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employeeId: '',
      department: '',
      email: '',
      phone: ''
    });
    setProfileImage(null);
    setShowAddForm(false);
    setEditingEmployee(null);
  };

  const startEdit = (employee) => {
    setFormData({
      name: employee.name,
      employeeId: employee.employeeId,
      department: employee.department,
      email: employee.email || '',
      phone: employee.phone || ''
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  const deleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('Employee deleted successfully', 'success');
        fetchEmployees();
      } else {
        showMessage('Failed to delete employee', 'error');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showMessage('System error while deleting employee', 'error');
    }
  };

  const generateNewQR = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}/regenerate-qr`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(`New QR Code generated: ${result.qrCode}`, 'success');
        fetchEmployees();
      } else {
        showMessage('Failed to generate new QR code', 'error');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      showMessage('System error while generating QR code', 'error');
    }
  };

  const testEmployeeQR = (qrCode, employeeName) => {
    navigate(`/enhanced-face-detection?qr=${qrCode}`, {
      state: { qrCode: qrCode, testMode: true }
    });
  };

  if (loading) {
    return (
      <div className="employee-management loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-management">
      <div className="management-header">
        <h1>👥 Employee Management</h1>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/attendance-records')}
            className="btn btn-secondary"
          >
            📊 View Records
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Employee'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="add-employee-form">
          <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingEmployee ? '💾 Update Employee' : '➕ Add Employee'}
              </button>
              <button 
                type="button" 
                onClick={resetForm}
                className="btn btn-secondary"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="employees-grid">
        <h2>Current Employees ({employees.length})</h2>
        
        {employees.length === 0 ? (
          <div className="no-employees">
            <p>No employees found. Add your first employee to get started!</p>
          </div>
        ) : (
          <div className="employee-cards">
            {employees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-photo">
                  {employee.profileImage ? (
                    <img 
                      src={`http://localhost:5000${employee.profileImage}`} 
                      alt={employee.name}
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <span>👤</span>
                    </div>
                  )}
                </div>
                
                <div className="employee-info">
                  <h3>{employee.name}</h3>
                  <p className="employee-id">ID: {employee.employeeId}</p>
                  <p className="department">{employee.department}</p>
                  {employee.email && <p className="contact">📧 {employee.email}</p>}
                  {employee.phone && <p className="contact">📞 {employee.phone}</p>}
                  
                  <div className="qr-info">
                    <p className="qr-code">QR: {employee.qrCode}</p>
                    <p className="join-date">Added: {new Date(employee.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="employee-actions">
                  <button 
                    onClick={() => testEmployeeQR(employee.qrCode, employee.name)}
                    className="btn btn-test"
                    title="Test attendance with this employee"
                  >
                    🎯 Test
                  </button>
                  <button 
                    onClick={() => startEdit(employee)}
                    className="btn btn-edit"
                    title="Edit employee"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => generateNewQR(employee.id)}
                    className="btn btn-qr"
                    title="Generate new QR code"
                  >
                    🔄 QR
                  </button>
                  <button 
                    onClick={() => deleteEmployee(employee.id)}
                    className="btn btn-delete"
                    title="Delete employee"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="management-footer">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-back"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default EmployeeManagement;