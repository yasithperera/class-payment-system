// src/components/Students.js
import React, { useState } from 'react';
import { Plus, Search, DollarSign, Trash2, Bell, FileText, Calendar, Edit2 } from 'lucide-react';
import { studentsService, paymentsService, invoicesService } from '../firebase/services';
import { getTotalUnpaid, getTotalPaidFromInvoices, getUnpaidInvoices } from '../utils/invoiceUtils';
import { calculateDailyFees } from '../utils/calculations';
import Modal from './Modal';

const Students = ({ students, subjects, payments, invoices, attendance }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentType, setPaymentType] = useState('partial');

    const [studentForm, setStudentForm] = useState({
        name: '',
        phone: '',
        school: '',
        subjects: []
    });

    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        school: '',
        subjects: []
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        isPartial: true
    });

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm) ||
        student.school.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (studentForm.name && studentForm.phone && studentForm.subjects.length > 0) {
            setLoading(true);
            try {
                await studentsService.add(studentForm);
                setStudentForm({ name: '', phone: '', school: '', subjects: [] });
                setShowModal(false);
            } catch (error) {
                alert('Error adding student: ' + error.message);
            }
            setLoading(false);
        }
    };

    const handleEditStudent = async (e) => {
        e.preventDefault();
        if (editForm.name && editForm.phone && editForm.subjects.length > 0 && selectedStudent) {
            setLoading(true);
            try {
                await studentsService.update(selectedStudent.id, {
                    name: editForm.name,
                    phone: editForm.phone,
                    school: editForm.school,
                    subjects: editForm.subjects
                });
                setEditForm({ name: '', phone: '', school: '', subjects: [] });
                setShowEditModal(false);
                setSelectedStudent(null);
            } catch (error) {
                alert('Error updating student: ' + error.message);
            }
            setLoading(false);
        }
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setEditForm({
            name: student.name,
            phone: student.phone,
            school: student.school,
            subjects: student.subjects
        });
        setShowEditModal(true);
    };

    const handleDeleteStudent = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            setLoading(true);
            try {
                await studentsService.delete(studentId);
                const studentPayments = payments.filter(p => p.studentId === studentId);
                for (const payment of studentPayments) {
                    await paymentsService.delete(payment.id);
                }
            } catch (error) {
                alert('Error deleting student: ' + error.message);
            }
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (paymentForm.amount && selectedStudent) {
            setLoading(true);
            try {
                const paymentAmount = parseFloat(paymentForm.amount);

                // Get unpaid invoices for this student (sorted by oldest first)
                const unpaidInvoices = getUnpaidInvoices(selectedStudent.id, invoices)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                let remainingAmount = paymentAmount;
                const paymentsToCreate = [];
                const invoicesToUpdate = [];

                // Try to apply payment to pending invoices first
                for (const invoice of unpaidInvoices) {
                    if (remainingAmount <= 0) break;

                    const invoiceBalance = invoice.amount - (invoice.paidAmount || 0);
                    const amountToApply = Math.min(remainingAmount, invoiceBalance);

                    // Create payment record linked to this invoice
                    paymentsToCreate.push({
                        studentId: selectedStudent.id,
                        amount: amountToApply,
                        date: paymentForm.date,
                        note: paymentForm.note || `Partial payment for invoice ${invoice.invoiceNumber}`,
                        isPartial: amountToApply < invoiceBalance,
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.invoiceNumber
                    });

                    // Update invoice paid amount
                    const newPaidAmount = (invoice.paidAmount || 0) + amountToApply;
                    const newStatus = newPaidAmount >= invoice.amount ? 'paid' : 'partial';

                    invoicesToUpdate.push({
                        id: invoice.id,
                        paidAmount: newPaidAmount,
                        status: newStatus,
                        ...(newStatus === 'paid' ? { paidAt: new Date().toISOString() } : {})
                    });

                    remainingAmount -= amountToApply;
                }

                // If there's still remaining amount, save as partial for current period
                if (remainingAmount > 0) {
                    paymentsToCreate.push({
                        studentId: selectedStudent.id,
                        amount: remainingAmount,
                        date: paymentForm.date,
                        note: paymentForm.note || 'Partial payment for current period',
                        isPartial: true
                    });
                }

                // Save all payments
                for (const payment of paymentsToCreate) {
                    await paymentsService.add(payment);
                }

                // Update all invoices
                for (const invoiceUpdate of invoicesToUpdate) {
                    await invoicesService.update(invoiceUpdate.id, {
                        paidAmount: invoiceUpdate.paidAmount,
                        status: invoiceUpdate.status,
                        ...(invoiceUpdate.paidAt ? { paidAt: invoiceUpdate.paidAt } : {})
                    });
                }

                setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '', isPartial: true });
                setShowPaymentModal(false);
                setSelectedStudent(null);
            } catch (error) {
                alert('Error recording payment: ' + error.message);
                console.error(error);
            }
            setLoading(false);
        }
    };

    const sendSMSReminder = (student) => {
        const dailyFees = calculateDailyFees(student, subjects, attendance, payments, invoices);
        const unpaidAmount = getTotalUnpaid(student.id, invoices) + dailyFees.currentPeriodOwed;

        // WhatsApp message
        const message = `Dear ${student.name}, you have a pending payment of Rs. ${unpaidAmount}. Please pay at your earliest convenience. Thank you!`;
        const whatsappUrl = `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

        // Open WhatsApp in new window
        window.open(whatsappUrl, '_blank');
    };

    const toggleSubject = (subjectId) => {
        setStudentForm(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(id => id !== subjectId)
                : [...prev.subjects, subjectId]
        }));
    };

    const toggleEditSubject = (subjectId) => {
        setEditForm(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(id => id !== subjectId)
                : [...prev.subjects, subjectId]
        }));
    };

    const getPaymentStatus = (student) => {
        const totalInvoiced = invoices
            .filter(inv => inv.studentId === student.id)
            .reduce((sum, inv) => sum + inv.amount, 0);

        const totalPaid = getTotalPaidFromInvoices(student.id, invoices);
        const totalUnpaid = getTotalUnpaid(student.id, invoices);

        const dailyFees = calculateDailyFees(student, subjects, attendance, payments, invoices);
        const currentPeriodOwed = dailyFees.currentPeriodOwed;

        const totalOwed = totalUnpaid + currentPeriodOwed;

        if (totalInvoiced === 0 && currentPeriodOwed === 0) {
            return { status: 'no-invoices', color: 'bg-gray-100 text-gray-800' };
        }
        if (totalOwed === 0) {
            return { status: 'paid', color: 'bg-green-100 text-green-800' };
        }
        if (totalPaid > 0 || dailyFees.currentPeriodPaid > 0) {
            return { status: 'partial', color: 'bg-yellow-100 text-yellow-800' };
        }
        return { status: 'pending', color: 'bg-red-100 text-red-800' };
    };

    const getUnpaidInvoiceCount = (studentId) => {
        return invoices.filter(
            inv => inv.studentId === studentId && inv.status !== 'paid'
        ).length;
    };

    const getTotalInvoiced = (studentId) => {
        return invoices
            .filter(inv => inv.studentId === studentId)
            .reduce((sum, inv) => sum + inv.amount, 0);
    };

    const openPaymentModal = (student, type) => {
        setSelectedStudent(student);
        setPaymentType(type);

        if (type === 'partial') {
            const dailyFees = calculateDailyFees(student, subjects, attendance, payments, invoices);
            const unpaidAmount = getTotalUnpaid(student.id, invoices);
            const suggestedAmount = unpaidAmount > 0 ? unpaidAmount : dailyFees.currentPeriodOwed;

            setPaymentForm({
                amount: suggestedAmount.toString(),
                date: new Date().toISOString().split('T')[0],
                note: '',
                isPartial: true
            });
        }

        setShowPaymentModal(true);
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <h2>Students ({students.length})</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={20} />
                    <span>Add Student</span>
                </button>
            </div>

            <div className="search-box">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search by name, phone or school..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="students-grid">
                {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <p>No students found</p>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const totalInvoiced = getTotalInvoiced(student.id);
                        const totalPaid = getTotalPaidFromInvoices(student.id, invoices);
                        const totalUnpaid = getTotalUnpaid(student.id, invoices);
                        const unpaidInvoiceCount = getUnpaidInvoiceCount(student.id);
                        const statusInfo = getPaymentStatus(student);

                        const dailyFees = calculateDailyFees(student, subjects, attendance, payments, invoices);

                        return (
                            <div key={student.id} className="student-card">
                                <div className="student-header">
                                    <h3>{student.name}</h3>
                                    <span className={`badge ${statusInfo.status}`}>
                                        {statusInfo.status === 'paid' ? 'Paid' :
                                            statusInfo.status === 'partial' ? 'Partial' :
                                                statusInfo.status === 'no-invoices' ? 'No Invoices' : 'Pending'}
                                    </span>
                                </div>

                                <div className="student-details">
                                    <p><strong>Phone:</strong> {student.phone}</p>
                                    <p><strong>School:</strong> {student.school}</p>

                                    <div className="student-subjects">
                                        <strong>Subjects:</strong>
                                        <div className="subject-tags">
                                            {student.subjects.map(subId => {
                                                const sub = subjects.find(s => s.id === subId);
                                                return sub ? (
                                                    <span key={subId} className="subject-tag">{sub.name}</span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>

                                    <div className="payment-summary">
                                        <p className="summary-title"><strong>Invoiced Periods:</strong></p>
                                        <p><strong>Total Invoiced:</strong> Rs. {totalInvoiced}</p>
                                        <p><strong>Paid:</strong> Rs. {totalPaid}</p>
                                        <p><strong>Unpaid:</strong> <span className="pending-amount">Rs. {totalUnpaid}</span></p>
                                        {unpaidInvoiceCount > 0 && (
                                            <p className="unpaid-invoices">
                                                <FileText size={14} />
                                                <span>{unpaidInvoiceCount} unpaid invoice{unpaidInvoiceCount > 1 ? 's' : ''}</span>
                                            </p>
                                        )}
                                    </div>

                                    {dailyFees.classesHeld > 0 && (
                                        <div className="current-period-summary">
                                            <p className="summary-title">
                                                <Calendar size={14} />
                                                <strong>Current Period (Not Yet Invoiced):</strong>
                                            </p>
                                            <p><strong>Classes Held:</strong> {dailyFees.classesHeld} / 4</p>
                                            <p><strong>Amount Due:</strong> Rs. {dailyFees.totalOwed}</p>
                                            <p><strong>Paid:</strong> Rs. {dailyFees.currentPeriodPaid}</p>
                                            <p><strong>Balance:</strong> <span className="pending-amount">Rs. {dailyFees.currentPeriodOwed}</span></p>
                                        </div>
                                    )}

                                    <div className="total-summary">
                                        <p className="total-owed">
                                            <strong>Total Amount Owed:</strong>
                                            <span className="pending-amount"> Rs. {totalUnpaid + dailyFees.currentPeriodOwed}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="student-actions">
                                    {(totalUnpaid + dailyFees.currentPeriodOwed) > 0 && (
                                        <button
                                            onClick={() => openPaymentModal(student, 'partial')}
                                            className="btn-success"
                                        >
                                            <DollarSign size={16} />
                                            Pay
                                        </button>
                                    )}

                                    <button
                                        onClick={() => openEditModal(student)}
                                        className="btn-primary"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => sendSMSReminder(student)}
                                        className="btn-warning"
                                        disabled={totalUnpaid + dailyFees.currentPeriodOwed === 0}
                                    >
                                        <Bell size={16} />
                                        WhatsApp
                                    </button>

                                    <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className="btn-danger"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <Modal onClose={() => setShowModal(false)} title="Add New Student">
                    <form onSubmit={handleAddStudent}>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={studentForm.name}
                                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="text"
                                value={studentForm.phone}
                                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>School</label>
                            <input
                                type="text"
                                value={studentForm.school}
                                onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Subjects *</label>
                            <div className="checkbox-group">
                                {subjects.map(subject => (
                                    <label key={subject.id} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={studentForm.subjects.includes(subject.id)}
                                            onChange={() => toggleSubject(subject.id)}
                                        />
                                        <span>{subject.name} (Rs. {subject.fee} per 4 days)</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Student'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedStudent && (
                <Modal onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedStudent(null);
                }} title="Record Payment">
                    <div className="payment-info">
                        <p><strong>Student:</strong> {selectedStudent.name}</p>
                        <p><strong>💡 Smart Payment:</strong> Auto-applies to oldest unpaid invoices first</p>

                        {(() => {
                            const unpaidInvs = getUnpaidInvoices(selectedStudent.id, invoices);
                            const dailyFees = calculateDailyFees(selectedStudent, subjects, attendance, payments, invoices);

                            return (
                                <>
                                    {unpaidInvs.length > 0 && (
                                        <>
                                            <p><strong>Unpaid Invoices:</strong> {unpaidInvs.length}</p>
                                            <p><strong>Invoice Balance:</strong> Rs. {getTotalUnpaid(selectedStudent.id, invoices)}</p>
                                        </>
                                    )}
                                    {dailyFees.currentPeriodOwed > 0 && (
                                        <p><strong>Current Period Balance:</strong> Rs. {dailyFees.currentPeriodOwed}</p>
                                    )}
                                    <p className="balance">
                                        <strong>Total Balance:</strong> Rs. {getTotalUnpaid(selectedStudent.id, invoices) + dailyFees.currentPeriodOwed}
                                    </p>
                                </>
                            );
                        })()}
                    </div>

                    <form onSubmit={handleRecordPayment}>
                        <div className="form-group">
                            <label>Amount (Rs.) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
                            <small className="form-hint">💡 Payment will auto-apply to invoices first, then current period</small>
                        </div>

                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={paymentForm.date}
                                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Note (Optional)</label>
                            <input
                                type="text"
                                value={paymentForm.note}
                                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                placeholder="e.g., Cash payment, Bank transfer"
                            />
                        </div>

                        <button type="submit" className="btn-success" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* Edit Student Modal */}
            {showEditModal && selectedStudent && (
                <Modal onClose={() => {
                    setShowEditModal(false);
                    setSelectedStudent(null);
                }} title="Edit Student">
                    <form onSubmit={handleEditStudent}>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>School</label>
                            <input
                                type="text"
                                value={editForm.school}
                                onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Subjects *</label>
                            <div className="checkbox-group">
                                {subjects.map(subject => (
                                    <label key={subject.id} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={editForm.subjects.includes(subject.id)}
                                            onChange={() => toggleEditSubject(subject.id)}
                                        />
                                        <span>{subject.name} (Rs. {subject.fee} per 4 days)</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Student'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Students;