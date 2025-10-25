// src/components/Invoices.js
import React, { useState } from 'react';
import { FileText, Check, X, Download } from 'lucide-react';
import { invoicesService, paymentsService } from '../firebase/services';
import Modal from './Modal';

const Invoices = ({ students, invoices }) => {
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'all') return true;
        return inv.status === filter;
    });

    // Get student name
    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown';
    };

    // Mark invoice as paid
    const markInvoiceAsPaid = async (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentForm({
            amount: invoice.amount.toString(),
            date: new Date().toISOString().split('T')[0],
            note: `Payment for invoice ${invoice.invoiceNumber}`
        });
        setShowPaymentModal(true);
    };

    // Record payment and mark invoice as paid
    const handlePayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        setLoading(true);
        try {
            // Create payment record
            const paymentId = await paymentsService.add({
                studentId: selectedInvoice.studentId,
                amount: parseFloat(paymentForm.amount),
                date: paymentForm.date,
                note: paymentForm.note,
                invoiceId: selectedInvoice.id,
                invoiceNumber: selectedInvoice.invoiceNumber
            });

            // Mark invoice as paid
            await invoicesService.markAsPaid(selectedInvoice.id, paymentId);

            setShowPaymentModal(false);
            setSelectedInvoice(null);
            setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
        } catch (error) {
            alert('Error recording payment: ' + error.message);
        }
        setLoading(false);
    };

    // Calculate totals
    const totals = {
        all: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
        paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
    };

    return (
        <div className="invoices-page">
            <div className="page-header">
                <h2>Invoices ({invoices.length})</h2>
            </div>

            {/* Summary Cards */}
            <div className="invoice-summary-grid">
                <div className="invoice-summary-card">
                    <p className="summary-label">Total Invoiced</p>
                    <p className="summary-value total">Rs. {totals.all}</p>
                </div>
                <div className="invoice-summary-card pending">
                    <p className="summary-label">Pending</p>
                    <p className="summary-value">Rs. {totals.pending}</p>
                </div>
                <div className="invoice-summary-card paid">
                    <p className="summary-label">Paid</p>
                    <p className="summary-value">Rs. {totals.paid}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="invoice-filters">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({invoices.length})
                </button>
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({invoices.filter(i => i.status === 'pending').length})
                </button>
                <button
                    className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
                    onClick={() => setFilter('paid')}
                >
                    Paid ({invoices.filter(i => i.status === 'paid').length})
                </button>
            </div>

            {/* Invoices List */}
            <div className="card">
                {filteredInvoices.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No invoices found</p>
                    </div>
                ) : (
                    <div className="invoices-list">
                        {filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="invoice-item">
                                <div className="invoice-header-row">
                                    <div className="invoice-number">
                                        <FileText size={20} />
                                        <span>{invoice.invoiceNumber}</span>
                                    </div>
                                    <span className={`invoice-status ${invoice.status}`}>
                                        {invoice.status === 'paid' ? <Check size={16} /> : <X size={16} />}
                                        {invoice.status}
                                    </span>
                                </div>

                                <div className="invoice-details">
                                    <div className="invoice-detail-row">
                                        <span className="detail-label">Student:</span>
                                        <span className="detail-value">{invoice.studentName}</span>
                                    </div>
                                    <div className="invoice-detail-row">
                                        <span className="detail-label">Subject:</span>
                                        <span className="detail-value">{invoice.subjectName}</span>
                                    </div>
                                    <div className="invoice-detail-row">
                                        <span className="detail-label">Period:</span>
                                        <span className="detail-value">
                                            {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {invoice.presentDays !== undefined && (
                                        <div className="invoice-detail-row">
                                            <span className="detail-label">Attendance:</span>
                                            <span className="detail-value">
                                                {invoice.presentDays} Present / {invoice.absentDays} Absent
                                            </span>
                                        </div>
                                    )}
                                    <div className="invoice-detail-row">
                                        <span className="detail-label">Due Date:</span>
                                        <span className="detail-value">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="invoice-footer">
                                    <div className="invoice-amount">
                                        <span>Amount:</span>
                                        <strong>Rs. {invoice.amount}</strong>
                                    </div>
                                    {invoice.status === 'pending' && (
                                        <button
                                            onClick={() => markInvoiceAsPaid(invoice)}
                                            className="btn-success"
                                        >
                                            <Check size={16} />
                                            Mark as Paid
                                        </button>
                                    )}
                                    {invoice.status === 'paid' && (
                                        <div className="paid-info">
                                            <Check size={16} />
                                            <span>Paid on {new Date(invoice.paidAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <Modal onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                }} title="Record Payment">
                    <div className="payment-info">
                        <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                        <p><strong>Student:</strong> {selectedInvoice.studentName}</p>
                        <p><strong>Subject:</strong> {selectedInvoice.subjectName}</p>
                        <p><strong>Amount Due:</strong> Rs. {selectedInvoice.amount}</p>
                    </div>

                    <form onSubmit={handlePayment}>
                        <div className="form-group">
                            <label>Amount (Rs.) *</label>
                            <input
                                type="number"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Payment Date *</label>
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
                            {loading ? 'Recording...' : 'Record Payment & Mark as Paid'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Invoices;