
import React, { useState, useMemo } from 'react';
import { User, UserRank, LoanRecord, Notification } from '../types';
import { TrendingUp, CreditCard, History, FileText, CalendarDays, Star, Activity, AlertCircle, ChevronLeft, ChevronRight, Eye, Bell, RefreshCcw, AlertTriangle, Zap } from 'lucide-react';
import NotificationModal from './NotificationModal';

interface DashboardProps {
  user: User | null;
  loans: LoanRecord[];
  notifications: Notification[];
  systemBudget: number;
  onApply: () => void;
  onLogout: () => void;
  onViewAllLoans: () => void;
  onSettleLoan?: (loan: LoanRecord) => void;
  onPayOSSettle?: (loan: LoanRecord) => void;
  onViewContract?: (loan: LoanRecord) => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onRefresh?: () => void;
  onOpenLuckySpin?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  loans, 
  notifications,
  systemBudget, 
  onApply, 
  onLogout, 
  onViewAllLoans, 
  onSettleLoan, 
  onPayOSSettle,
  onViewContract,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onRefresh,
  onOpenLuckySpin
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNextPaymentDate = () => {
    const now = new Date();
    const nextMonth1st = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth1st.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let finalDate;
    if (diffDays < 10) {
      finalDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    } else {
      finalDate = nextMonth1st;
    }
    return finalDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const activeLoans = loans.filter(l => l.status === 'ĐANG ĐỐI SOÁT' || l.status === 'ĐANG NỢ' || l.status === 'ĐANG GIẢI NGÂN' || l.status === 'CHỜ DUYỆT');
  const earliestLoan = activeLoans.length > 0 ? [...activeLoans].sort((a, b) => {
    if (!a.date || typeof a.date !== 'string' || !b.date || typeof b.date !== 'string') return 0;
    const [da, ma, ya] = a.date.split('/').map(Number);
    const [db, mb, yb] = b.date.split('/').map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
  })[0] : null;

  const nextDueDate = getNextPaymentDate();
  const displayDueDate = earliestLoan ? earliestLoan.date : nextDueDate;

  const currentDebt = loans
    .filter(l => l.status === 'ĐANG NỢ' || l.status === 'CHỜ TẤT TOÁN')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const today = new Date();
  const hasOverdue = loans.some(l => {
    if ((l.status !== 'ĐANG NỢ' && l.status !== 'CHỜ TẤT TOÁN' && l.status !== 'ĐANG GIẢI NGÂN') || !l.date || typeof l.date !== 'string') return false;
    const [d, m, y] = l.date.split('/').map(Number);
    const dueDate = new Date(y, m - 1, d);
    return dueDate < today;
  });

  const getRankInfo = (rank: UserRank = 'standard') => {
    switch (rank) {
      case 'bronze': return { name: 'ĐỒNG', color: 'bg-[#cd7f32]', textColor: 'text-black' };
      case 'silver': return { name: 'BẠC', color: 'bg-gray-300', textColor: 'text-black' };
      case 'gold': return { name: 'VÀNG', color: 'bg-yellow-400', textColor: 'text-black' };
      case 'diamond': return { name: 'KIM CƯƠNG', color: 'bg-[#ff8c00]', textColor: 'text-black' };
      default: return { name: 'TIÊU CHUẨN', color: 'bg-gray-600', textColor: 'text-white' };
    }
  };

  const getStatusStyles = (status: string, isOverdue: boolean, settlementType?: string) => {
    if (isOverdue) return 'text-red-500';
    switch (status) {
      case 'CHỜ DUYỆT': return 'text-orange-500';
      case 'ĐÃ DUYỆT': return 'text-blue-500';
      case 'ĐANG GIẢI NGÂN': return 'text-cyan-500';
      case 'ĐANG NỢ': return 'text-orange-600';
      case 'CHỜ TẤT TOÁN': 
        if (settlementType === 'ALL') return 'text-green-500';
        if (settlementType === 'PARTIAL') return 'text-amber-500';
        return 'text-blue-500';
      case 'ĐÃ TẤT TOÁN': return 'text-green-500';
      case 'BỊ TỪ CHỐI': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => {
      const aIsSettled = ['ĐÃ TẤT TOÁN', 'BỊ TỪ CHỐI'].includes(a.status);
      const bIsSettled = ['ĐÃ TẤT TOÁN', 'BỊ TỪ CHỐI'].includes(b.status);
      
      if (aIsSettled !== bIsSettled) {
        return aIsSettled ? 1 : -1;
      }
      
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [loans]);

  const totalPages = Math.ceil(sortedLoans.length / itemsPerPage);
  const displayedLoans = sortedLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const rankInfo = getRankInfo(user?.rank);
  const isBudgetLow = systemBudget < 5000000;

  return (
    <div className="w-full bg-black px-4 space-y-4 pt-2">
      <div className="flex justify-between items-center px-1 mb-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#ff8c00] rounded-lg flex items-center justify-center font-black text-black text-[8px]">NDV</div>
          <h1 className="text-sm font-black text-white tracking-widest uppercase">Money</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenLuckySpin}
            className="w-8 h-8 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-[#ff8c00] active:scale-90 transition-all"
          >
            <Zap size={16} fill="currentColor" />
          </button>
          <button 
            onClick={() => {
              setShowNotifications(true);
              onMarkAllNotificationsRead?.();
            }}
            className="w-8 h-8 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-gray-400 relative active:scale-90 transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-black flex items-center justify-center">
                <span className="text-[7px] font-black text-white">{unreadCount}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className={`w-full ${rankInfo.color} rounded-3xl p-5 ${rankInfo.textColor} relative overflow-hidden shadow-2xl`}>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Thành viên hạng</p>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tighter uppercase leading-none">{rankInfo.name}</h2>
                {user?.pendingUpgradeRank && (
                  <div className="bg-blue-500 text-white text-[6px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">
                    Đang nâng hạng
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[7px] font-black uppercase opacity-60 tracking-widest">Tiến trình Nâng Hạng</span>
              <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-full border border-black/5">
                <Star size={10} className="fill-current" />
                <span className="text-[9px] font-black uppercase">
                  {user?.rank === 'diamond' ? '10/10' : `${user?.rankProgress || 0}/10`} ĐIỂM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase tracking-widest opacity-60">Chủ tài khoản</p>
            <p className="text-base font-black tracking-tight truncate">{user?.fullName || 'CHƯA CẬP NHẬT'}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[7px] font-black uppercase tracking-widest opacity-60">Hạn mức khả dụng</p>
            <p className="text-base font-black tracking-tight">{(user?.balance || 0).toLocaleString()} đ</p>
          </div>
        </div>
      </div>

      <div className={`bg-[#111111] border rounded-3xl overflow-hidden transition-all ${isBudgetLow ? 'border-orange-500/30 ring-1 ring-orange-500/10' : 'border-white/5'}`}>
        <div className="p-4 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isBudgetLow ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
              <Activity className={isBudgetLow ? 'text-orange-500' : 'text-green-500'} size={16} />
            </div>
            <div>
              <p className={`text-[8px] font-black uppercase tracking-widest ${isBudgetLow ? 'text-orange-500' : 'text-green-500'}`}>
                {isBudgetLow ? 'Nguồn vốn hạn chế' : 'Nguồn vốn hệ thống'}
              </p>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full animate-pulse ${isBudgetLow ? 'bg-orange-500 shadow-[0_0_8px_rgba(255,140,0,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                <p className="text-[6px] font-bold text-gray-600 uppercase tracking-tighter">Live security V1.26</p>
              </div>
            </div>
          </div>
          <p className={`text-base font-black tracking-tight ${isBudgetLow ? 'text-orange-500' : 'text-white'}`}>
            {systemBudget.toLocaleString()} đ
          </p>
        </div>

        <div className="mx-4 border-t border-white/5"></div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp size={12} className="text-[#ff8c00]" />
            <span className="text-[8px] font-black uppercase tracking-widest">Thống kê trọn đời</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[7px] font-bold text-gray-500 uppercase">Tổng tiền đã vay</p>
              <p className="text-base font-black text-white">
                {loans
                  .filter(l => l.status === 'ĐANG NỢ' || l.status === 'CHỜ TẤT TOÁN' || l.status === 'ĐÃ TẤT TOÁN' || l.status === 'ĐANG GIẢI NGÂN')
                  .reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} đ
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-[7px] font-bold text-gray-500 uppercase">Phí phạt quá hạn</p>
              <p className="text-base font-black text-red-500">
                {loans.reduce((acc, curr) => acc + (curr.fine || 0), 0).toLocaleString()} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-4 space-y-2">
          <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <CreditCard size={16} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[7px] font-bold text-gray-500 uppercase">Dư nợ hiện tại</p>
            <p className={`text-base font-black ${currentDebt > 0 ? 'text-red-500' : 'text-white'}`}>
              {currentDebt.toLocaleString()} đ
            </p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-3xl p-4 space-y-2 relative overflow-hidden group">
          <div className="w-8 h-8 bg-[#ff8c00]/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
            <CalendarDays size={16} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-tighter">Kỳ hạn tiếp theo</p>
            <p className="text-sm font-black text-white">{loans.length > 0 ? displayDueDate : '--/--/--'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-gray-400">
            <History size={14} />
            <h3 className="text-[9px] font-black uppercase tracking-widest">Lịch sử giao dịch</h3>
          </div>
        </div>

        <div className="space-y-2 pb-4">
          {loans.length === 0 ? (
            <div className="bg-[#111111]/50 border border-white/5 border-dashed rounded-2xl p-8 text-center">
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <>
              {displayedLoans.map((item, idx) => {
                if (!item.date || typeof item.date !== 'string') return null;
                const [d, m, y] = item.date.split('/').map(Number);
                const isOverdue = (item.status === 'ĐANG NỢ' || item.status === 'CHỜ TẤT TOÁN') && new Date(y, m - 1, d) < today;
                const statusColor = getStatusStyles(item.status, isOverdue, item.settlementType);

                return (
                  <div key={idx} className={`bg-[#111111] border rounded-2xl p-3.5 flex flex-col gap-2.5 ${isOverdue ? 'border-red-600/30 bg-red-600/5' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-black text-white leading-none">{item.amount.toLocaleString()} đ</p>
                            <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">#{item.id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-1 h-1 rounded-full ${
                              item.status === 'ĐÃ TẤT TOÁN' ? 'bg-green-500' : 
                              isOverdue ? 'bg-red-500 animate-pulse' : 
                              item.status === 'CHỜ TẤT TOÁN' ? (
                                item.settlementType === 'ALL' ? 'bg-green-500 animate-pulse' : 
                                (item.settlementType === 'PARTIAL' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 animate-pulse')
                              ) : 'bg-orange-500 animate-pulse'
                            }`}></div>
                            <span className={`text-[7px] font-black uppercase flex items-center ${statusColor}`}>
                              {isOverdue ? 'QUÁ HẠN' : item.status}
                              {item.status === 'CHỜ TẤT TOÁN' && (
                                <span className={`px-1 rounded text-[6px] ml-1 ${
                                  item.settlementType === 'ALL' ? 'bg-green-500 text-white' : 
                                  (item.settlementType === 'PARTIAL' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                                }`}>
                                  {item.settlementType === 'PRINCIPAL' ? 'GH' : (item.settlementType === 'PARTIAL' ? 'TTMP' : 'TT')}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => onViewContract?.(item)}
                           className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-all"
                         >
                           <Eye size={14} />
                         </button>
                         {(item.status === 'ĐANG NỢ' || item.status === 'ĐANG GIẢI NGÂN') && (
                           <div className="flex gap-1">
                             <button 
                               onClick={() => onSettleLoan?.(item)}
                               className="bg-white text-black font-black px-2 py-1.5 rounded-lg text-[7px] uppercase tracking-widest active:scale-95 transition-all"
                             >
                               Tất toán
                             </button>

                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      {item.rejectionReason && (
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden mb-0.5">
                          <AlertTriangle size={8} className="text-red-500 shrink-0" />
                          <p className="text-[7px] font-black text-red-500 uppercase tracking-widest truncate">
                            Lý do từ chối: {item.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2.5">
                            <p className="text-[7px] font-bold text-gray-700">Hạn: {item.date}</p>
                            <p className="text-[7px] font-bold text-gray-700">Tạo: {item.createdAt}</p>
                          </div>
                          {isOverdue && (
                            <div className="text-right">
                              <p className="text-[6px] font-black text-gray-600 uppercase tracking-widest leading-none">Phí phạt trễ hạn</p>
                              <p className="text-[9px] font-black text-red-500">{(item.fine || 0).toLocaleString()} đ</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-gray-700' : 'text-[#ff8c00] hover:text-white'}`}
                  >
                    <ChevronLeft size={12} /> TRƯỚC
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-white">{currentPage}</span>
                    <span className="text-[8px] font-bold text-gray-600">/</span>
                    <span className="text-[8px] font-bold text-gray-600">{totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages ? 'text-gray-700' : 'text-[#ff8c00] hover:text-white'}`}
                  >
                    TIẾP <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationModal 
          notifications={notifications} 
          onClose={() => setShowNotifications(false)} 
          onMarkRead={(id) => onMarkNotificationRead?.(id)}
        />
      )}
    </div>
  );
};

export default Dashboard;
