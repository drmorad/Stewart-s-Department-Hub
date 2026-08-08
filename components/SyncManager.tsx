
import React from 'react';
import { t } from '../i18n';

interface SyncManagerProps {
    isOpen: boolean;
    onClose: () => void;
    isConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    lastSync: Date | null;
    isSyncing: boolean;
    userData: any;
    onForceSync: () => void;
    onLoadFromCloud: () => void;
}

const SyncManager: React.FC<SyncManagerProps> = ({ 
    isOpen, onClose, isConnected, onConnect, onDisconnect, lastSync, isSyncing, userData, onForceSync, onLoadFromCloud 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-all" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <i className="fas fa-cloud-arrow-up"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                                {t('sync.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Cloud Backup</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-all p-2"><i className="fas fa-times text-xl"></i></button>
                </div>

                <div className="p-10">
                    {!isConnected ? (
                        <div className="text-center space-y-8">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto relative shadow-inner">
                                <i className="fas fa-shield-halved text-4xl text-blue-400"></i>
                            </div>
                            <div className="max-w-xs mx-auto">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('sync.connectDrive')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {t('sync.connectDescription')}
                                </p>
                            </div>
                            <button 
                                onClick={onConnect}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider text-xs"
                            >
                                <i className="fab fa-google text-base"></i> Authorize Google Access
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-inner">
                                {userData?.picture ? (
                                    <img src={userData.picture} alt="Avatar" className="w-14 h-14 rounded-2xl shadow-sm border-2 border-white dark:border-slate-900" />
                                ) : (
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                        {userData?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-grow min-w-0">
                                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{userData?.name || 'Authorized User'}</p>
                                    <p className="text-xs text-slate-400 font-medium truncate">{userData?.email}</p>
                                </div>
                                <button onClick={onDisconnect} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-slate-300 hover:text-red-500 transition-all shadow-sm border border-slate-100 dark:border-slate-700" title={t('sync.disconnect')}>
                                    <i className="fas fa-power-off"></i>
                                </button>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Bridge Active</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-sm ${isSyncing ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {isSyncing ? 'Syncing...' : 'Encrypted Link'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/30 w-full rounded-full overflow-hidden">
                                    <div className={`h-full bg-emerald-500 transition-all duration-700 ${isSyncing ? 'w-1/2 animate-pulse' : 'w-full'}`}></div>
                                </div>
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase tracking-wider text-center">
                                    {lastSync ? `Latest update: ${lastSync.toLocaleTimeString()}` : 'Syncing data now...'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={onForceSync}
                                    disabled={isSyncing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] uppercase tracking-widest"
                                >
                                    <i className={`fas fa-cloud-arrow-up ${isSyncing ? 'animate-bounce' : ''}`}></i> {t('sync.uploadNow')}
                                </button>
                                <button 
                                    onClick={onLoadFromCloud}
                                    disabled={isSyncing}
                                    className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-all py-3.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] uppercase tracking-widest"
                                >
                                    <i className="fas fa-cloud-arrow-down"></i> {t('sync.downloadNow')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyncManager;
