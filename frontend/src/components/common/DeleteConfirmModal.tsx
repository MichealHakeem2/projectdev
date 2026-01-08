"use client";

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Post',
    message = 'Are you sure you want to delete this post? This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setError('');
        setIsLoading(true);

        try {
            await onConfirm();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to delete. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex justify-center">
                    <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-error-600 dark:text-error-400" />
                    </div>
                </div>

                {/* Message */}
                <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                    {message}
                </p>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-500/30 rounded-xl"
                    >
                        <p className="text-sm text-error-700 dark:text-error-300 text-center">{error}</p>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="flex-1 bg-error-600 hover:bg-error-700 text-white"
                    >
                        {isLoading ? 'Deleting...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;
