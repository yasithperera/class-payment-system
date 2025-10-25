// src/utils/invoiceUtils.js
import { invoicesService } from '../firebase/services';

// Generate invoice number
export const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
};

// Check if student needs invoices generated
// NOW: Counts all attendance records (present OR absent) - if class was held, student pays
export const checkAndGenerateInvoices = async (student, subjects, attendance, existingInvoices) => {
    const generatedInvoices = [];

    // For each subject the student takes
    for (const subjectId of student.subjects) {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) continue;

        // Get all attendance records for this student and subject (both present AND absent)
        // If attendance is marked, it means class was held
        const subjectAttendance = attendance.filter(
            a => a.studentId === student.id &&
                a.subjectId === subjectId
        ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

        // Group attendance into 4-day periods
        const periods = [];
        let currentPeriod = [];

        for (const att of subjectAttendance) {
            currentPeriod.push(att);

            if (currentPeriod.length === 4) {
                periods.push([...currentPeriod]);
                currentPeriod = [];
            }
        }

        // Generate invoices for completed 4-day periods
        for (const period of periods) {
            const periodKey = `${student.id}-${subjectId}-${period[0].date}-${period[3].date}`;

            // Check if invoice already exists for this period
            const invoiceExists = existingInvoices.some(
                inv => inv.periodKey === periodKey
            );

            if (!invoiceExists) {
                // Count how many days student was present
                const presentDays = period.filter(p => p.present === true).length;
                const absentDays = 4 - presentDays;

                // Create new invoice (charge for all 4 days regardless of attendance)
                const invoice = {
                    invoiceNumber: generateInvoiceNumber(),
                    studentId: student.id,
                    studentName: student.name,
                    subjectId: subjectId,
                    subjectName: subject.name,
                    amount: subject.fee,
                    periodKey: periodKey,
                    periodStart: period[0].date,
                    periodEnd: period[3].date,
                    attendanceDates: period.map(p => p.date),
                    presentDays: presentDays,
                    absentDays: absentDays,
                    status: 'pending',
                    dueDate: new Date(new Date(period[3].date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days after period ends
                };

                try {
                    const invoiceId = await invoicesService.add(invoice);
                    generatedInvoices.push({ ...invoice, id: invoiceId });
                } catch (error) {
                    console.error('Error generating invoice:', error);
                }
            }
        }
    }

    return generatedInvoices;
};

// Get unpaid invoices for a student
export const getUnpaidInvoices = (studentId, invoices) => {
    return invoices.filter(
        inv => inv.studentId === studentId && inv.status !== 'paid'
    );
};

// Get total unpaid amount for a student (considering partial payments)
export const getTotalUnpaid = (studentId, invoices) => {
    return invoices
        .filter(inv => inv.studentId === studentId && inv.status !== 'paid')
        .reduce((total, inv) => {
            const paidAmount = inv.paidAmount || 0;
            return total + (inv.amount - paidAmount);
        }, 0);
};

// Calculate total paid from invoices
export const getTotalPaidFromInvoices = (studentId, invoices) => {
    return invoices
        .filter(inv => inv.studentId === studentId)
        .reduce((total, inv) => total + (inv.paidAmount || 0), 0);
};