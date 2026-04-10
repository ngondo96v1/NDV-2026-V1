
import React, { useState } from 'react';
import { X, Bell, ChevronRight, Sparkles, Zap, MessageSquareQuote, Megaphone, Gift, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LuckySpin from './LuckySpin';
import { User } from '../types';

interface SystemNotificationDrawerProps {
  message: string;
  user: User | null;
  settings: any;
  initialTab?: 'NOTIF' | 'SPIN';
  forceExpand?: boolean;
  isDashboard?: boolean;
  onSpinResult: (prize: string, amount: number) => void;
  onClose: () => void;
}

const SystemNotificationDrawer: React.FC<SystemNotificationDrawerProps> = ({ 
  message, 
  user, 
  settings, 
  initialTab = 'NOTIF', 
  forceExpand = false,
  isDashboard = true,
  onSpinResult, 
  onClose 
}) => {
  const [isExpanded, setIsExpanded] = useState(forceExpand);
  const showNotif = settings?.SHOW_SYSTEM_NOTIFICATION !== false;
  const [activeTab, setActiveTab] = useState<'NOTIF' | 'SPIN'>(showNotif ? initialTab : 'SPIN');

  // Sync activeTab with initialTab when initialTab changes
  React.useEffect(() => {
    if (showNotif) {
      // If not on dashboard, force NOTIF tab if it was SPIN
      if (!isDashboard && activeTab === 'SPIN') {
        setActiveTab('NOTIF');
      } else {
        setActiveTab(initialTab);
      }
    } else {
      setActiveTab('SPIN');
    }
  }, [initialTab, showNotif, isDashboard]);

  // Sync isExpanded with forceExpand when forceExpand changes
  React.useEffect(() => {
    if (forceExpand) {
      setIsExpanded(true);
    }
  }, [forceExpand]);

  if (!user) return null;

  // If not on dashboard and notifications are disabled/empty, hide the entire drawer
  if (!isDashboard && !showNotif) return null;
  if (!isDashboard && showNotif && !message) return null;

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[500] pointer-events-none flex items-center">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Professional Floating Tab on the Right Edge */
          <motion.button
            key="floating-tab"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -5, 0], // Subtle floating animation
            }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ 
              x: { type: 'spring', damping: 20, stiffness: 200 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto flex items-center bg-[#1a1a1a] border-y border-l border-white/10 px-2 py-3 rounded-l-xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] text-[#ff8c00] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff8c00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Orange Badge */}
            {((showNotif && message) || (isDashboard && (user.spins || 0) > 0)) && (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ff8c00] rounded-full shadow-[0_0_10px_#ff8c00] animate-pulse border border-[#1a1a1a]" />
            )}
            
            <div className="flex flex-col items-center">
              {activeTab === 'NOTIF' ? (
                <Bell size={14} className="relative z-10 group-hover:rotate-12 transition-transform" />
              ) : (
                <Gift size={14} className="relative z-10 group-hover:rotate-12 transition-transform" />
              )}
            </div>
          </motion.button>
        ) : (
          /* Professional Side Panel */
          <motion.div
            key="notification-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto w-[260px] max-h-[70vh] bg-[#0a0a0a]/95 backdrop-blur-3xl border-l border-y border-white/10 rounded-l-[24px] shadow-[-20px_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col mr-0 mb-20"
          >
            {/* Header */}
            <div className="p-2 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#ff8c00]/10 to-transparent">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-[#ff8c00]/15 rounded-lg flex items-center justify-center text-[#ff8c00] shadow-inner">
                  {activeTab === 'NOTIF' ? <Bell size={12} className="fill-[#ff8c00]/20 animate-pulse" /> : <Trophy size={12} className="fill-[#ff8c00]/20 animate-pulse" />}
                </div>
                <div>
                  <h3 className="text-[8px] font-black text-white uppercase tracking-[0.15em] leading-tight">
                    {activeTab === 'NOTIF' ? 'Thông báo' : 'Vòng quay'}
                  </h3>
                  <p className="text-[5px] font-bold text-[#ff8c00] uppercase tracking-widest mt-0.5">Hệ thống NDV Money</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  onClose();
                }}
                className="w-6 h-6 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5"
              >
                <X size={12} />
              </button>
            </div>

            {/* Tabs */}
            {showNotif && isDashboard && (
              <div className="flex gap-1 p-1 bg-white/5 mx-2 mt-2 rounded-lg border border-white/5">
                <button 
                  onClick={() => setActiveTab('NOTIF')}
                  className={`flex-1 py-1 rounded-md font-black text-[6px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${activeTab === 'NOTIF' ? 'bg-[#ff8c00] text-black shadow-lg shadow-[#ff8c00]/20' : 'text-gray-500 hover:text-white'}`}
                >
                  <Bell size={8} /> Thông báo
                </button>
                <button 
                  onClick={() => setActiveTab('SPIN')}
                  className={`flex-1 py-1 rounded-md font-black text-[6px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 relative ${activeTab === 'SPIN' ? 'bg-[#ff8c00] text-black shadow-lg shadow-[#ff8c00]/20' : 'text-gray-500 hover:text-white'}`}
                >
                  <Gift size={8} /> Vòng quay
                  {user && (user.spins || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full flex items-center justify-center border border-[#0a0a0a]">
                      <span className="text-[4px] font-black text-white">{user.spins}</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'NOTIF' ? (
                  <motion.div 
                    key="notif-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="relative group">
                      <div className="absolute -inset-1.5 bg-gradient-to-br from-[#ff8c00]/10 to-transparent rounded-[16px] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative bg-white/[0.02] border border-white/10 rounded-[16px] p-3 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#ff8c00]/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                        <MessageSquareQuote size={12} className="text-[#ff8c00]/30 mb-1.5" />
                        <p className="text-[9px] font-medium text-gray-300 leading-relaxed italic relative z-10">
                          "{message}"
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                        <div className="w-5 h-5 bg-blue-500/10 rounded-md flex items-center justify-center text-blue-400 shrink-0">
                          <Sparkles size={10} />
                        </div>
                        <p className="text-[7px] font-bold text-blue-400/70 uppercase leading-relaxed tracking-wider">
                          Vui lòng tuân thủ các quy định để đảm bảo quyền lợi của bạn trên hệ thống.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="spin-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {user ? (
                      <LuckySpin 
                        user={user} 
                        settings={settings}
                        onSpinResult={onSpinResult} 
                        onClose={() => setIsExpanded(false)} 
                      />
                    ) : (
                      <div className="py-12 text-center opacity-30">
                        <Gift size={32} className="mx-auto mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Vui lòng đăng nhập</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="p-2 border-t border-white/5 bg-black/40">
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  onClose();
                }}
                className="w-full py-2 bg-gradient-to-r from-[#ff8c00] to-[#ff4500] hover:from-[#ff4500] hover:to-[#ff8c00] text-black font-black text-[7px] uppercase tracking-[0.15em] rounded-lg shadow-[0_10px_40px_rgba(255,140,0,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                ĐÓNG <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-[4px] text-gray-600 font-bold uppercase tracking-widest mt-2">
                © 2026 NDV MONEY SYSTEM
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemNotificationDrawer;
