// src/components/Subjects.js
import React, { useState } from 'react';
import { Plus, Book, Trash2, Edit2 } from 'lucide-react';
import { subjectsService } from '../firebase/services';
import Modal from './Modal';

const Subjects = ({ subjects }) => {
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [subjectForm, setSubjectForm] = useState({
        name: '',
        fee: ''
    });
    const [editForm, setEditForm] = useState({
        name: '',
        fee: ''
    });

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (subjectForm.name && subjectForm.fee) {
            setLoading(true);
            try {
                await subjectsService.add({
                    name: subjectForm.name,
                    fee: parseFloat(subjectForm.fee)
                });
                setSubjectForm({ name: '', fee: '' });
                setShowModal(false);
            } catch (error) {
                alert('Error adding subject: ' + error.message);
            }
            setLoading(false);
        }
    };

    const handleEditSubject = async (e) => {
        e.preventDefault();
        if (editForm.name && editForm.fee && selectedSubject) {
            setLoading(true);
            try {
                await subjectsService.update(selectedSubject.id, {
                    name: editForm.name,
                    fee: parseFloat(editForm.fee)
                });
                setEditForm({ name: '', fee: '' });
                setShowEditModal(false);
                setSelectedSubject(null);
            } catch (error) {
                alert('Error updating subject: ' + error.message);
            }
            setLoading(false);
        }
    };

    const openEditModal = (subject) => {
        setSelectedSubject(subject);
        setEditForm({
            name: subject.name,
            fee: subject.fee.toString()
        });
        setShowEditModal(true);
    };

    const handleDeleteSubject = async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            setLoading(true);
            try {
                await subjectsService.delete(subjectId);
            } catch (error) {
                alert('Error deleting subject: ' + error.message);
            }
            setLoading(false);
        }
    };

    return (
        <div className="subjects-page">
            <div className="page-header">
                <h2>Subjects ({subjects.length})</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={20} />
                    <span>Add Subject</span>
                </button>
            </div>

            <div className="subjects-grid">
                {subjects.length === 0 ? (
                    <div className="empty-state">
                        <Book size={48} />
                        <p>No subjects added yet</p>
                    </div>
                ) : (
                    subjects.map(subject => (
                        <div key={subject.id} className="subject-card">
                            <div className="subject-icon">
                                <Book size={32} />
                            </div>
                            <h3>{subject.name}</h3>
                            <p className="subject-fee">Rs. {subject.fee}</p>
                            <p className="subject-period">per 4 days</p>
                            <div className="subject-actions">
                                <button
                                    onClick={() => openEditModal(subject)}
                                    className="edit-btn"
                                    disabled={loading}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="delete-btn"
                                    disabled={loading}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Subject Modal */}
            {showModal && (
                <Modal onClose={() => setShowModal(false)} title="Add New Subject">
                    <form onSubmit={handleAddSubject}>
                        <div className="form-group">
                            <label>Subject Name *</label>
                            <input
                                type="text"
                                value={subjectForm.name}
                                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                placeholder="e.g., Mathematics"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Fee (Rs.) *</label>
                            <input
                                type="number"
                                value={subjectForm.fee}
                                onChange={(e) => setSubjectForm({ ...subjectForm, fee: e.target.value })}
                                placeholder="e.g., 2000"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Subject'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* Edit Subject Modal */}
            {showEditModal && selectedSubject && (
                <Modal onClose={() => {
                    setShowEditModal(false);
                    setSelectedSubject(null);
                }} title="Edit Subject">
                    <form onSubmit={handleEditSubject}>
                        <div className="form-group">
                            <label>Subject Name *</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="e.g., Mathematics"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Fee (Rs.) *</label>
                            <input
                                type="number"
                                value={editForm.fee}
                                onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })}
                                placeholder="e.g., 2000"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Subject'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Subjects;