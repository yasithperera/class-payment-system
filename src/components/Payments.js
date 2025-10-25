import React from 'react';
import { formatDate } from '../utils/calculations';

const Payments = ({ students, payments }) => {
    return (
        <div className="payments-page">
            <h2>Payment History ({payments.length})</h2>

            <div className="card">
                {payments.length === 0 ? (
                    <div className="empty-state">
                        <p>No payments recorded yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Amount</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => {
                                    const student = students.find(s => s.id === payment.studentId);
                                    return (
                                        <tr key={payment.id}>
                                            <td>{formatDate(payment.date)}</td>
                                            <td>{student ? student.name : 'Unknown'}</td>
                                            <td>{student ? student.phone : '-'}</td>
                                            <td className="amount">Rs. {payment.amount}</td>
                                            <td>{payment.note || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;