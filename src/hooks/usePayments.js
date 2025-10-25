import { useState, useEffect } from 'react';
import { paymentsService } from '../firebase/services';

export const usePayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = paymentsService.subscribe((data) => {
            setPayments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addPayment = async (paymentData) => {
        try {
            await paymentsService.add(paymentData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deletePayment = async (id) => {
        try {
            await paymentsService.delete(id);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { payments, loading, error, addPayment, deletePayment };
};