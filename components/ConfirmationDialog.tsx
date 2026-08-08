
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
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex justify-center items-center p-4 transition-all duration-300"
      aria-labelledby="confirmation-dialog-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="industrial-panel w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] border-2 border-[#3a3a3a] animate-panel-entry overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="glitch-overlay"></div>
        
        {/* Top hazard bar */}
        <div className="h-1.5 hazard-stripes w-full opacity-60"></div>
        
        <div className="p-8 relative z-10">
          <div className="flex items-center gap-6 mb-8 border-b border-[#1a1a1a] pb-6">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 bg-black border border-[#ffcc00] shadow-[0_0_15px_rgba(255,204,0,0.2)]">
              <i className="fas fa-exclamation-triangle text-2xl text-[#ffcc00] animate-pulse"></i>
            </div>
            <div>
              <span className="block text-[9px] font-black text-[#555] uppercase tracking-[0.4em] mono mb-1">SYSTEM_OVERRIDE_REQUEST</span>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase" id="confirmation-dialog-title">
                {title}
              </h3>
            </div>
          </div>
          
          <div className="text-[#8e8e8e] font-medium text-xs leading-relaxed mono uppercase tracking-widest bg-black/40 p-6 border border-[#1a1a1a]">
            {children}
          </div>
        </div>

        <div className="bg-black/60 px-8 py-6 flex justify-end items-center gap-6 border-t border-[#1a1a1a] relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-black text-[#555] hover:text-white uppercase tracking-[0.3em] transition-all mono"
          >
            {t('confirmationDialog.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-[#00f2ff] hover:bg-[#00dbff] text-black font-black py-4 px-10 rounded-none shadow-2xl transition-all transform active:scale-95 uppercase tracking-[0.2em] text-[10px] mono"
          >
            {t('confirmationDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
