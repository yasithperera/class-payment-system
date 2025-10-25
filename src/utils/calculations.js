// src/utils/calculations.js

export const calculateStudentFee = (student, subjects) => {
    if (!student || !student.subjects || !subjects) return 0;

    return student.subjects.reduce((total, subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return total + (subject ? subject.fee : 0);
    }, 0);
};

export const calculatePaidAmount = (studentId, payments) => {
    if (!payments) return 0;

    return payments
        .filter(p => p.studentId === studentId)
        .reduce((total, p) => total + p.amount, 0);
};

export const getPaymentStatus = (student, subjects, payments) => {
    const totalFee = calculateStudentFee(student, subjects);
    const paid = calculatePaidAmount(student.id, payments);
    const balance = totalFee - paid;

    if (balance <= 0) {
        return {
            status: 'paid',
            color: 'bg-green-100 text-green-800',
            balance: 0
        };
    }

    if (paid > 0) {
        return {
            status: 'partial',
            color: 'bg-yellow-100 text-yellow-800',
            balance
        };
    }

    return {
        status: 'pending',
        color: 'bg-red-100 text-red-800',
        balance
    };
};

export const getDashboardStats = (students, subjects, payments) => {
    return {
        totalStudents: students.length,
        totalSubjects: subjects.length,
        totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: students.filter(s => {
            const status = getPaymentStatus(s, subjects, payments);
            return status.status !== 'paid';
        }).length
    };
};

export const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Calculate fees based on attendance (4-day billing periods)
// NOW: Counts all marked attendance (present OR absent) - if class was held, charge the fee
export const calculateAttendanceFees = (student, subjects, attendance) => {
    let totalDays = 0;
    let totalDue = 0;

    // Count attendance days per subject (both present and absent)
    student.subjects.forEach(subjectId => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;

        // Count all attendance records (if marked, class was held)
        const attendedDays = attendance.filter(
            a => a.studentId === student.id &&
                a.subjectId === subjectId
        ).length;

        totalDays += attendedDays;

        // Calculate completed 4-day periods
        const completedPeriods = Math.floor(attendedDays / 4);
        const daysInCurrentPeriod = attendedDays % 4;

        // Fee per day = subject fee / 4
        const feePerDay = subject.fee / 4;

        // Total due = (completed periods * subject fee) + (days in current period * fee per day)
        totalDue += (completedPeriods * subject.fee) + (daysInCurrentPeriod * feePerDay);
    });

    return {
        totalDays,
        completedPeriods: Math.floor(totalDays / 4),
        daysInCurrentPeriod: totalDays % 4,
        totalDue: Math.round(totalDue)
    };
};

// Get attendance for a specific student and date range
export const getAttendanceForPeriod = (studentId, startDate, endDate, attendance) => {
    return attendance.filter(
        a => a.studentId === studentId &&
            a.date >= startDate &&
            a.date <= endDate
    );
};

// Calculate daily fees for current period (before 4-day invoice)
export const calculateDailyFees = (student, subjects, attendance, payments, invoices) => {
    let classesHeld = 0;
    let totalOwed = 0;
    let currentPeriodPaid = 0;

    // For each subject the student takes
    student.subjects.forEach(subjectId => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;

        // Get all attendance for this subject
        const subjectAttendance = attendance.filter(
            a => a.studentId === student.id &&
                a.subjectId === subjectId
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Count classes in current incomplete period (remainder after grouping by 4)
        const remainder = subjectAttendance.length % 4;
        classesHeld += remainder;

        // Calculate daily rate
        const dailyRate = subject.fee / 4;
        totalOwed += remainder * dailyRate;
    });

    // Get partial payments NOT linked to invoices (for current period only)
    const partialPayments = payments.filter(
        p => p.studentId === student.id &&
            (p.isPartial === true || p.isPartial === undefined) &&
            !p.invoiceId  // Not linked to any invoice
    );

    currentPeriodPaid = partialPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
        classesHeld,
        totalOwed: Math.round(totalOwed),
        currentPeriodPaid,
        currentPeriodOwed: Math.round(Math.max(0, totalOwed - currentPeriodPaid))
    };
};