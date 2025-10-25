import React from 'react';
import { Users, Book, DollarSign, Bell } from 'lucide-react';
import { getPaymentStatus, calculateStudentFee, calculatePaidAmount } from '../utils/calculations';

const Dashboard = ({ students, subjects, payments, stats }) => {
    return (
        <div className="dashboard">
            <h2>Dashboard</h2>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-content">
                        <div>
                            <p className="stat-label">Total Students</p>
                            <p className="stat-value">{stats.totalStudents}</p>
                        </div>
                        <Users size={40} />
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-content">
                        <div>
                            <p className="stat-label">Subjects</p>
                            <p className="stat-value">{stats.totalSubjects}</p>
                        </div>
                        <Book size={40} />
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-content">
                        <div>
                            <p className="stat-label">Total Collected</p>
                            <p className="stat-value">Rs. {stats.totalCollected}</p>
                        </div>
                        <DollarSign size={40} />
                    </div>
                </div>

                <div className="stat-card red">
                    <div className="stat-content">
                        <div>
                            <p className="stat-label">Pending</p>
                            <p className="stat-value">{stats.pendingPayments}</p>
                        </div>
                        <Bell size={40} />
                    </div>
                </div>
            </div>

            {/* Payment Status Overview */}
            <div className="card">
                <h3>Payment Status Overview</h3>
                <div className="payment-list">
                    {students.length === 0 ? (
                        <p className="empty-state">No students added yet</p>
                    ) : (
                        students.slice(0, 10).map(student => {
                            const totalFee = calculateStudentFee(student, subjects);
                            const paid = calculatePaidAmount(student.id, payments);
                            const statusInfo = getPaymentStatus(student, subjects, payments);

                            return (
                                <div key={student.id} className="payment-item">
                                    <div className="payment-info">
                                        <p className="student-name">{student.name}</p>
                                        <p className="student-school">{student.school}</p>
                                    </div>
                                    <div className="payment-status">
                                        <p className="payment-amount">
                                            Rs. {paid} / Rs. {totalFee}
                                        </p>
                                        <span className={`badge ${statusInfo.status}`}>
                                            {statusInfo.status === 'paid' ? 'Paid' :
                                                statusInfo.status === 'partial' ? 'Partial' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;