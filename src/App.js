// src/App.js
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Book, Bell, Download, Calendar, FileText } from 'lucide-react';
import { studentsService, subjectsService, paymentsService, attendanceService, invoicesService } from './firebase/services';
import { getDashboardStats } from './utils/calculations';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Payments from './components/Payments';
import Attendance from './components/Attendance';
import Invoices from './components/Invoices';
import './App.css';

function App() {
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
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
  }, []);

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
      exportDate: new Date().toISOString()
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

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Class Payment Management</h1>
            <p>Manage students, subjects, attendance & payments</p>
          </div>
          <button onClick={exportData} className="export-btn">
            <Download size={18} />
            <span>Export Data</span>
          </button>
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