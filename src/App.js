// src/App.js
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Book, Bell, Download, Calendar, FileText, LogOut, User } from 'lucide-react';
import { studentsService, subjectsService, paymentsService, attendanceService, invoicesService } from './firebase/services';
import { getDashboardStats } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Payments from './components/Payments';
import Attendance from './components/Attendance';
import Invoices from './components/Invoices';
import LoginComponent from './components/LoginComponent'; // Import the Login Component
import './App.css';

function App() {
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
    setView('dashboard'); // Reset to dashboard view
  };

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    // Only subscribe if user is logged in
    if (!isLoggedIn) return;

    const unsubscribeStudents = studentsService.subscribe((data) => {
      setStudents(data);
      setLoading(false);
    });

    const unsubscribeSubjects = subjectsService.subscribe((data) => {
      setSubjects(data);
    });

    const unsubscribePayments = paymentsService.subscribe((data) => {
      setPayments(data);
    });

    const unsubscribeAttendance = attendanceService.subscribe((data) => {
      setAttendance(data);
    });

    const unsubscribeInvoices = invoicesService.subscribe((data) => {
      setInvoices(data);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeStudents();
      unsubscribeSubjects();
      unsubscribePayments();
      unsubscribeAttendance();
      unsubscribeInvoices();
    };
  }, [isLoggedIn]);

  // Calculate dashboard statistics
  const stats = getDashboardStats(students, subjects, payments);

  // Export all data as JSON
  const exportData = () => {
    const data = {
      students,
      subjects,
      payments,
      attendance,
      invoices,
      exportDate: new Date().toISOString(),
      exportedBy: currentUser?.username || 'unknown'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: DollarSign, label: 'Dashboard' },
    { id: 'attendance', icon: Calendar, label: 'Attendance' },
    { id: 'invoices', icon: FileText, label: 'Invoices' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'subjects', icon: Book, label: 'Subjects' },
    { id: 'payments', icon: Bell, label: 'Payments' }
  ];

  // If not logged in, show login component
  if (!isLoggedIn) {
    return <LoginComponent onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Class Payment Management</h1>
            <p>Manage students, subjects, attendance & payments</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <User size={18} />
              <span>{currentUser?.name || currentUser?.username}</span>
            </div>

            {/* Export Button */}
            <button onClick={exportData} className="export-btn">
              <Download size={18} />
              <span>Export Data</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="export-btn"
              style={{ background: '#ef4444' }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard
                students={students}
                subjects={subjects}
                payments={payments}
                stats={stats}
              />
            )}
            {view === 'attendance' && (
              <Attendance
                students={students}
                subjects={subjects}
                attendance={attendance}
                invoices={invoices}
              />
            )}
            {view === 'invoices' && (
              <Invoices
                students={students}
                invoices={invoices}
              />
            )}
            {view === 'students' && (
              <Students
                students={students}
                subjects={subjects}
                payments={payments}
                invoices={invoices}
                attendance={attendance}
              />
            )}
            {view === 'subjects' && (
              <Subjects subjects={subjects} />
            )}
            {view === 'payments' && (
              <Payments
                students={students}
                payments={payments}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;