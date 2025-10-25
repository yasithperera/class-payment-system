import { useState, useEffect } from 'react';
import { subjectsService } from '../firebase/services';

export const useSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = subjectsService.subscribe((data) => {
            setSubjects(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addSubject = async (subjectData) => {
        try {
            await subjectsService.add(subjectData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteSubject = async (id) => {
        try {
            await subjectsService.delete(id);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { subjects, loading, error, addSubject, deleteSubject };
};