import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    where
} from 'firebase/firestore';
import { db } from './config';

// Students Service
export const studentsService = {
    // Get all students
    getAll: async () => {
        const querySnapshot = await getDocs(collection(db, 'students'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Add student
    add: async (studentData) => {
        const docRef = await addDoc(collection(db, 'students'), {
            ...studentData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    // Update student
    update: async (id, data) => {
        const docRef = doc(db, 'students', id);
        await updateDoc(docRef, data);
    },

    // Delete student
    delete: async (id) => {
        await deleteDoc(doc(db, 'students', id));
    },

    // Real-time listener
    subscribe: (callback) => {
        return onSnapshot(collection(db, 'students'), (snapshot) => {
            const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(students);
        });
    }
};

// Subjects Service
export const subjectsService = {
    getAll: async () => {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    add: async (subjectData) => {
        const docRef = await addDoc(collection(db, 'subjects'), subjectData);
        return docRef.id;
    },

    update: async (id, data) => {
        await updateDoc(doc(db, 'subjects', id), data);
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'subjects', id));
    },

    subscribe: (callback) => {
        return onSnapshot(collection(db, 'subjects'), (snapshot) => {
            const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(subjects);
        });
    }
};

// Attendance Service
export const attendanceService = {
    getAll: async () => {
        const querySnapshot = await getDocs(collection(db, 'attendance'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    add: async (attendanceData) => {
        const docRef = await addDoc(collection(db, 'attendance'), {
            ...attendanceData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    update: async (id, data) => {
        await updateDoc(doc(db, 'attendance', id), data);
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'attendance', id));
    },

    subscribe: (callback) => {
        return onSnapshot(collection(db, 'attendance'), (snapshot) => {
            const attendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(attendance);
        });
    }
};

// Add this to your src/firebase/services.js file
// Place it AFTER attendanceService and BEFORE paymentsService

// Invoices Service
export const invoicesService = {
    getAll: async () => {
        const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    add: async (invoiceData) => {
        const docRef = await addDoc(collection(db, 'invoices'), {
            ...invoiceData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    update: async (id, data) => {
        await updateDoc(doc(db, 'invoices', id), data);
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'invoices', id));
    },

    subscribe: (callback) => {
        const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(invoices);
        });
    },

    // Mark invoice as paid
    markAsPaid: async (invoiceId, paymentId) => {
        await updateDoc(doc(db, 'invoices', invoiceId), {
            status: 'paid',
            paymentId,
            paidAt: new Date().toISOString()
        });
    }
};

// Payments Service
export const paymentsService = {
    getAll: async () => {
        const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    add: async (paymentData) => {
        const docRef = await addDoc(collection(db, 'payments'), {
            ...paymentData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    delete: async (id) => {
        await deleteDoc(doc(db, 'payments', id));
    },

    subscribe: (callback) => {
        const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(payments);
        });
    }
};

// Users Service
export const usersService = {
    // Get user by username
    getByUsername: async (username) => {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    // Verify login credentials
    verifyLogin: async (username, password) => {
        const user = await usersService.getByUsername(username);
        if (!user) return null;
        if (user.password === password) {
            // Don't return password in user object
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    },

    // Add user (for admin purposes)
    add: async (userData) => {
        const docRef = await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    },

    getAll: async () => {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};