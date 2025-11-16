import React from 'react';
import { t } from '../i18n';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      aria-labelledby="confirmation-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md m-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <i className="fas fa-file-export text-2xl text-blue-600 dark:text-blue-300"></i>
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" id="confirmation-dialog-title">
                {title}
              </h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {children}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end items-center gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {t('confirmationDialog.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-sm transition-transform transform hover:scale-105"
          >
            {t('confirmationDialog.confirm')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;