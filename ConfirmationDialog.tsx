
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-opacity duration-300"
      aria-labelledby="confirmation-dialog-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg m-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="p-8">
          <div className="flex items-center gap-5 mb-8">
            <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm">
              <i className="fas fa-file-export text-2xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase" id="confirmation-dialog-title">
                {title}
              </h3>
            </div>
          </div>
          
          <div className="text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 flex justify-end items-center gap-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest rounded-full border-2 border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
          >
            {t('confirmationDialog.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-3.5 px-10 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 active:scale-95"
          >
            {t('confirmationDialog.confirm')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;
