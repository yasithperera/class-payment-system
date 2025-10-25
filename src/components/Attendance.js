// src/components/Attendance.js
import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Users, AlertCircle, FileText } from 'lucide-react';
import { attendanceService } from '../firebase/services';
import { calculateAttendanceFees } from '../utils/calculations';
import { checkAndGenerateInvoices } from '../utils/invoiceUtils';

const Attendance = ({ students, subjects, attendance, invoices }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [loading, setLoading] = useState(false);
    const [generatingInvoices, setGeneratingInvoices] = useState(false);

    // 🔥 THIS IS THE KEY PART - AUTO-GENERATE INVOICES
    useEffect(() => {
        const generateInvoicesForAll = async () => {
            if (students.length === 0 || subjects.length === 0) return;

            setGeneratingInvoices(true);
            for (const student of students) {
                await checkAndGenerateInvoices(student, subjects, attendance, invoices);
            }
            setGeneratingInvoices(false);
        };

        // Debounce to avoid too many calls
        const timer = setTimeout(() => {
            generateInvoicesForAll();
        }, 2000);

        return () => clearTimeout(timer);
    }, [attendance, students, subjects, invoices]);

    // Get students for selected subject
    const filteredStudents = selectedSubject === 'all'
        ? students
        : students.filter(s => s.subjects.includes(selectedSubject));

    // Check if student attended on a specific date for a subject
    const hasAttended = (studentId, subjectId, date) => {
        return attendance.some(
            a => a.studentId === studentId &&
                a.subjectId === subjectId &&
                a.date === date &&
                a.present === true
        );
    };

    // Mark attendance
    const markAttendance = async (studentId, subjectId, present) => {
        setLoading(true);
        try {
            const existingRecord = attendance.find(
                a => a.studentId === studentId &&
                    a.subjectId === subjectId &&
                    a.date === selectedDate
            );

            if (existingRecord) {
                await attendanceService.update(existingRecord.id, { present });
            } else {
                await attendanceService.add({
                    studentId,
                    subjectId,
                    date: selectedDate,
                    present
                });
            }
        } catch (error) {
            alert('Error marking attendance: ' + error.message);
        }
        setLoading(false);
    };

    // Get attendance stats for a student
    const getAttendanceStats = (student) => {
        const stats = {};
        student.subjects.forEach(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                // Count all marked attendance (present + absent = classes held)
                const classesHeld = attendance.filter(
                    a => a.studentId === student.id &&
                        a.subjectId === subjectId
                ).length;

                const present = attendance.filter(
                    a => a.studentId === student.id &&
                        a.subjectId === subjectId &&
                        a.present === true
                ).length;

                const absent = classesHeld - present;

                stats[subject.name] = { total: classesHeld, present, absent };
            }
        });
        return stats;
    };

    // Calculate fees based on attendance
    const calculateFees = (student) => {
        return calculateAttendanceFees(student, subjects, attendance);
    };

    // Get unpaid invoices count
    const getUnpaidInvoicesCount = (studentId) => {
        return invoices.filter(
            inv => inv.studentId === studentId && inv.status === 'pending'
        ).length;
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div>
                    <h2>Attendance Tracking</h2>
                    <p className="subtitle">Mark daily attendance - invoices auto-generate after 4 days</p>
                </div>
                {generatingInvoices && (
                    <div className="generating-badge">
                        <FileText size={16} />
                        <span>Checking invoices...</span>
                    </div>
                )}
            </div>

            {/* Date and Subject Filter */}
            <div className="attendance-filters">
                <div className="filter-group">
                    <label>Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                </div>

                <div className="filter-group">
                    <label>Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="subject-select"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-info">
                    <Calendar size={20} />
                    <span>{new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
            </div>

            {/* Attendance Grid */}
            <div className="card">
                <h3>Mark Attendance</h3>

                {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>No students found for selected criteria</p>
                    </div>
                ) : (
                    <div className="attendance-grid">
                        {filteredStudents.map(student => {
                            const studentSubjects = student.subjects
                                .map(subId => subjects.find(s => s.id === subId))
                                .filter(Boolean);

                            return (
                                <div key={student.id} className="attendance-card">
                                    <div className="student-info">
                                        <h4>{student.name}</h4>
                                        <p className="student-school">{student.school}</p>
                                    </div>

                                    <div className="attendance-subjects">
                                        {selectedSubject === 'all' ? (
                                            studentSubjects.map(subject => {
                                                const attended = hasAttended(student.id, subject.id, selectedDate);
                                                return (
                                                    <div key={subject.id} className="subject-attendance">
                                                        <span className="subject-name">{subject.name}</span>
                                                        <div className="attendance-buttons">
                                                            <button
                                                                onClick={() => markAttendance(student.id, subject.id, true)}
                                                                className={`attendance-btn ${attended ? 'present' : ''}`}
                                                                disabled={loading}
                                                            >
                                                                <Check size={16} />
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => markAttendance(student.id, subject.id, false)}
                                                                className={`attendance-btn ${!attended && attendance.some(a => a.studentId === student.id && a.subjectId === subject.id && a.date === selectedDate) ? 'absent' : ''}`}
                                                                disabled={loading}
                                                            >
                                                                <X size={16} />
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            (() => {
                                                const subject = subjects.find(s => s.id === selectedSubject);
                                                const attended = hasAttended(student.id, selectedSubject, selectedDate);
                                                return (
                                                    <div className="subject-attendance single">
                                                        <div className="attendance-buttons">
                                                            <button
                                                                onClick={() => markAttendance(student.id, selectedSubject, true)}
                                                                className={`attendance-btn large ${attended ? 'present' : ''}`}
                                                                disabled={loading}
                                                            >
                                                                <Check size={20} />
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => markAttendance(student.id, selectedSubject, false)}
                                                                className={`attendance-btn large ${!attended && attendance.some(a => a.studentId === student.id && a.subjectId === selectedSubject && a.date === selectedDate) ? 'absent' : ''}`}
                                                                disabled={loading}
                                                            >
                                                                <X size={20} />
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Attendance Summary with Invoices */}
            <div className="card">
                <h3>Attendance Summary & Auto-Generated Invoices</h3>
                <div className="summary-grid">
                    {students.map(student => {
                        const stats = getAttendanceStats(student);
                        const fees = calculateFees(student);
                        const unpaidCount = getUnpaidInvoicesCount(student.id);

                        return (
                            <div key={student.id} className="summary-card">
                                <div className="summary-header">
                                    <h4>{student.name}</h4>
                                    <div className="summary-badges">
                                        <span className="total-days">{fees.totalDays} days</span>
                                        {unpaidCount > 0 && (
                                            <span className="unpaid-badge">
                                                {unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="summary-details">
                                    {Object.entries(stats).map(([subjectName, data]) => (
                                        <div key={subjectName} className="subject-stat">
                                            <span className="stat-subject">{subjectName}</span>
                                            <span className="stat-days">
                                                {data.total} classes ({data.present}P / {data.absent}A)
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="billing-info">
                                    <div className="billing-row">
                                        <span>Completed 4-day periods:</span>
                                        <strong>{fees.completedPeriods}</strong>
                                    </div>
                                    <div className="billing-row">
                                        <span>Days in current period:</span>
                                        <strong>{fees.daysInCurrentPeriod}</strong>
                                    </div>
                                    <div className="billing-row">
                                        <span>Auto-generated invoices:</span>
                                        <strong>{fees.completedPeriods}</strong>
                                    </div>
                                    <div className="billing-row total">
                                        <span>Total invoiced:</span>
                                        <strong className="amount">Rs. {fees.completedPeriods * (student.subjects.length > 0 ? subjects.find(s => s.id === student.subjects[0])?.fee || 0 : 0)}</strong>
                                    </div>
                                </div>

                                {fees.daysInCurrentPeriod > 0 && fees.daysInCurrentPeriod < 4 && (
                                    <div className="billing-alert">
                                        <AlertCircle size={16} />
                                        <span>{4 - fees.daysInCurrentPeriod} more days to complete period & generate invoice</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Attendance;