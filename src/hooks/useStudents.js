import { useState, useEffect } from 'react';
import { studentsService } from '../firebase/services';

export const useStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = studentsService.subscribe((data) => {
            setStudents(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addStudent = async (studentData) => {
        try {
            await studentsService.add(studentData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateStudent = async (id, data) => {
        try {
            await studentsService.update(id, data);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteStudent = async (id) => {
        try {
            await studentsService.delete(id);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { students, loading, error, addStudent, updateStudent, deleteStudent };
};