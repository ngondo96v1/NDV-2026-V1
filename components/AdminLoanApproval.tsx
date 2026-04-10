
import React, { useState } from 'react';
import { LoanRecord, AppSettings } from '../types';
import { 
  Search, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  X,
  Maximize2
} from 'lucide-react';

interface AdminLoanApprovalProps {
  loans: LoanRecord[];
  isGlobalProcessing: boolean;
  onAction: (loanId: string, action: 'APPROVE' | 'DISBURSE' | 'SETTLE' | 'REJECT', reason?: string) => Promise<void> | void;
  onBack: () => void;
  settings: AppSettings;
}

const AdminLoanApproval: React.FC<AdminLoanApprovalProps> = ({ loans, isGlobalProcessing, onAction, onBack, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [rejectingLoanId, setRejectingLoanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Nhóm các khoản vay theo User
  const groupedLoans: Record<string, { name: string; loans: LoanRecord[] }> = {};
  
  loans.forEach(loan => {
    const uid = loan.userId || 'unknown';
    if (!groupedLoans[uid]) {
      groupedLoans[uid] = { name: loan.userName || 'ẨN DANH', loans: [] };
    }
    groupedLoans[uid].loans.push(loan);
  });

  // Sort loans within each group
  Object.values(groupedLoans).forEach(group => {
    group.loans.sort((a, b) => {
      const getPriority = (status: string) => {
        switch (status) {
          case 'CHỜ DUYỆT': return 1;
          case 'CHỜ TẤT TOÁN': return 2;
          case 'ĐÃ DUYỆT': return 3;
          case 'ĐANG GIẢI NGÂN': return 4;
          case 'ĐANG NỢ': return 5;
          case 'ĐANG ĐỐI SOÁT': return 6;
          case 'ĐÃ TẤT TOÁN': return 10;
          case 'BỊ TỪ CHỐI': return 11;
          default: return 7;
        }
      };
      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  });

  const users = Object.keys(groupedLoans)
    .filter(uid => 
      groupedLoans[uid].name.toLowerCase().includes(searchTerm.toLowerCase()) || uid.includes(searchTerm)
    )
    .sort((a, b) => {
      // Ưu tiên User đang được mở rộng (đang xử lý) lên đầu để tránh bị nhảy danh sách
      if (a === expandedUserId) return -1;
      if (b === expandedUserId) return 1;

      // Đếm các khoản vay cần xử lý: Chờ duyệt, Chờ tất toán, và Đã duyệt (chờ giải ngân)
      const getActionCount = (uid: string) => {
        return groupedLoans[uid].loans.filter(l => 
          l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN' || l.status === 'ĐÃ DUYỆT'
        ).length;
      };

      const countA = getActionCount(a);
      const countB = getActionCount(b);
      
      if (countA !== countB) return countB - countA;
      return groupedLoans[b].name.localeCompare(groupedLoans[a].name);
    });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loanCurrentPage, setLoanCurrentPage] = useState<Record<string, number>>({});
  const loanItemsPerPage = 5;
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const displayedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingApprovalCount = loans.filter(l => l.status === 'CHỜ DUYỆT').length;
  const pendingDisbursementCount = loans.filter(l => l.status === 'ĐÃ DUYỆT').length;
  const pendingSettlementCount = loans.filter(l => l.status === 'CHỜ TẤT TOÁN').length;

  const getStatusStyles = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500/10 text-red-500';
    switch (status) {
      case 'CHỜ DUYỆT': return 'bg-orange-500/10 text-orange-500';
      case 'ĐÃ DUYỆT': return 'bg-blue-500/10 text-blue-500';
      case 'ĐANG GIẢI NGÂN': return 'bg-cyan-500/10 text-cyan-500';
      case 'ĐANG NỢ': return 'bg-orange-600/10 text-orange-600';
      case 'CHỜ TẤT TOÁN': return 'bg-indigo-500/10 text-indigo-500';
      case 'ĐÃ TẤT TOÁN': return 'bg-green-500/10 text-green-500';
      case 'BỊ TỪ CHỐI': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="w-full bg-black px-5 pb-6 animate-in fade-in duration-500 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 pt-8 mb-6 shrink-0">
        <button onClick={onBack} className="text-white bg-white/5 p-1.5 rounded-full active:scale-90 transition-all">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">DUYỆT VAY & TẤT TOÁN</h1>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6 shrink-0">
        <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest opacity-60">Chờ duyệt vay</span>
          <span className="text-lg font-black text-orange-500">{pendingApprovalCount}</span>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-green-500 uppercase tracking-widest opacity-60">Chờ giải ngân</span>
          <span className="text-lg font-black text-green-500">{pendingDisbursementCount}</span>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest opacity-60">Chờ tất toán</span>
          <span className="text-lg font-black text-blue-500">{pendingSettlementCount}</span>
        </div>
      </div>

      <div className="relative mb-6 shrink-0">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Tìm khách hàng hoặc mã HĐ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl py-4 pl-12 pr-5 text-xs font-bold text-white focus:outline-none focus:border-orange-500/30 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        {users.length === 0 ? (
          <div className="py-16 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu giao dịch</p>
          </div>
        ) : (
          displayedUsers.map(uid => {
            const userGroup = groupedLoans[uid];
            const isExpanded = expandedUserId === uid;
            const notificationCount = userGroup.loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN' || l.status === 'ĐÃ DUYỆT').length;

            return (
              <div key={uid} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
                <div 
                  onClick={() => {
                    if (!isExpanded) {
                      setLoanCurrentPage(prev => ({ ...prev, [uid]: 1 }));
                    }
                    setExpandedUserId(isExpanded ? null : uid);
                  }}
                  className="p-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1e] rounded-lg flex items-center justify-center text-[#ff8c00]">
                      < User size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase">{userGroup.name}</h3>
                      <p className="text-[8px] font-bold text-gray-500 uppercase">ID: {uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationCount > 0 && (
                      <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                         <span className="text-[9px] font-black text-white">{notificationCount}</span>
                      </div>
                    )}
                    <div className="text-gray-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-full h-px bg-white/5"></div>
                    {(() => {
                      const userLoanPage = loanCurrentPage[uid] || 1;
                      const totalLoanPages = Math.ceil(userGroup.loans.length / loanItemsPerPage);
                      const displayedUserLoans = userGroup.loans.slice((userLoanPage - 1) * loanItemsPerPage, userLoanPage * loanItemsPerPage);
                      
                      return (
                        <>
                          {displayedUserLoans.map(loan => {
                            const today = new Date();
                      const [d, m, y] = (loan.date && typeof loan.date === 'string') ? loan.date.split('/').map(Number) : [0, 0, 0];
                      const dueDate = d !== 0 ? new Date(y, m - 1, d) : null;
                      const isOverdue = (loan.status === 'ĐANG NỢ' || loan.status === 'CHỜ TẤT TOÁN') && dueDate && dueDate < today;
                      const statusStyles = getStatusStyles(loan.status, isOverdue);

                      return (
                        <div key={loan.id} className={`bg-black/40 border rounded-2xl p-4 space-y-3 ${isOverdue ? 'border-red-600/30 ring-1 ring-red-600/10' : 'border-white/5'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{loan.id}</p>
                                {loan.extensionCount && loan.extensionCount > 0 ? (
                                  <span className="text-[7px] font-black text-orange-500/60 uppercase tracking-tighter">
                                    (Lần {loan.extensionCount}/{settings.MAX_EXTENSIONS})
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="text-base font-black text-white">{loan.amount.toLocaleString()} đ</h4>
                              {loan.status === 'ĐÃ DUYỆT' && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Số tiền giải ngân:</span>
                                  <span className="text-[10px] font-black text-green-500">{(loan.amount * (1 - settings.PRE_DISBURSEMENT_FEE / 100)).toLocaleString()} đ</span>
                                </div>
                              )}
                            </div>
                            <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase ${statusStyles}`}>
                              {isOverdue ? 'QUÁ HẠN' : loan.status}
                            </span>
                          </div>

                          {loan.status === 'CHỜ TẤT TOÁN' && (
                            <div className="space-y-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <ImageIcon size={12} className="text-blue-500" />
                                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Bill Đối Soát Tất Toán</span>
                                </div>
                                {loan.settlementType && (
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase border ${
                                    loan.settlementType === 'ALL' 
                                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                      : (loan.settlementType === 'PARTIAL' 
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20')
                                  }`}>
                                    {loan.settlementType === 'ALL' ? 'Tất Toán' : (loan.settlementType === 'PARTIAL' ? 'TTMP' : 'Gia hạn')}
                                  </span>
                                )}
                              </div>
                              {loan.bankTransactionId && (
                                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Mã giao dịch:</span>
                                  <span className="text-[9px] font-black text-[#ff8c00] tracking-wider">{loan.bankTransactionId}</span>
                                </div>
                              )}
                              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-white/5 group/img relative cursor-zoom-in" onClick={() => loan.billImage && setZoomImage(loan.billImage)}>
                                {loan.billImage ? (
                                  <>
                                    <img src={loan.billImage} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Bill tất toán" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                        <Maximize2 size={20} />
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-800 gap-1.5">
                                      <Clock size={18} />
                                      <span className="text-[7px] font-black uppercase">Thiếu minh chứng bill</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-1.5">
                            {loan.status === 'CHỜ DUYỆT' && (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={async () => {
                                      if (isProcessing || isGlobalProcessing) return;
                                      setIsProcessing(loan.id);
                                      await onAction(loan.id, 'APPROVE');
                                      setIsProcessing(null);
                                    }}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 bg-[#ff8c00] text-black py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    {isProcessing === loan.id || isGlobalProcessing ? 'Đang duyệt...' : 'Duyệt vay'}
                                  </button>
                                  <button 
                                    onClick={() => setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id)}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isProcessing || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                  </button>
                                </div>
                                {rejectingLoanId === loan.id && (
                                  <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                      "Hồ sơ không đạt",
                                      "Thông tin sai lệch",
                                      "Nợ xấu hệ thống",
                                      "Vượt quá hạn mức",
                                      "Chữ ký không khớp",
                                      "Nghi vấn giả mạo"
                                    ].map((reason) => (
                                      <button 
                                        key={reason}
                                        onClick={async () => { 
                                          if (isProcessing || isGlobalProcessing) return;
                                          setIsProcessing(loan.id);
                                          await onAction(loan.id, 'REJECT', reason);
                                          setRejectingLoanId(null);
                                          setIsProcessing(null);
                                        }}
                                        disabled={!!isProcessing || isGlobalProcessing}
                                        className="bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all"
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {loan.status === 'ĐÃ DUYỆT' && (
                              <div className="flex flex-col gap-2">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-2.5">
                                  <p className="text-[7px] font-bold text-gray-400 uppercase leading-relaxed">
                                    <span className="text-green-500">Lưu ý:</span> Hệ thống sẽ tự động khấu trừ các khoản phí theo quy định. Admin vui lòng chuyển khoản số tiền <span className="text-white font-black">{(loan.amount * (1 - settings.PRE_DISBURSEMENT_FEE / 100)).toLocaleString()} đ</span> cho khách hàng.
                                  </p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    if (isProcessing || isGlobalProcessing) return;
                                    setIsProcessing(loan.id);
                                    await onAction(loan.id, 'DISBURSE');
                                    setIsProcessing(null);
                                  }}
                                  disabled={!!isProcessing || isGlobalProcessing}
                                  className={`w-full bg-green-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''}`}
                                >
                                  {isProcessing === loan.id || isGlobalProcessing ? 'Đang giải ngân...' : 'Xác nhận đã giải ngân'}
                                </button>
                              </div>
                            )}
                            {loan.status === 'CHỜ TẤT TOÁN' && (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={async () => {
                                      if (isProcessing || isGlobalProcessing) return;
                                      setIsProcessing(loan.id);
                                      await onAction(loan.id, 'SETTLE');
                                      setIsProcessing(null);
                                    }}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 text-white py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                                      isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''
                                    } ${
                                      loan.settlementType === 'ALL' ? 'bg-green-600' : 
                                      (loan.settlementType === 'PARTIAL' ? 'bg-amber-500' : 'bg-blue-600')
                                    }`}
                                  >
                                    <CheckCircle2 size={12} /> {isProcessing === loan.id || isGlobalProcessing ? 'Đang xác nhận...' : (loan.settlementType === 'ALL' ? 'Xác nhận Tất toán' : (loan.settlementType === 'PARTIAL' ? 'Xác nhận TTMP' : 'Xác nhận Gia hạn'))}
                                  </button>
                                  <button 
                                    onClick={() => setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id)}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isProcessing || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                  </button>
                                </div>
                                
                                {rejectingLoanId === loan.id && (
                                  <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                      "Bill không hợp lệ",
                                      "Sai nội dung",
                                      "Sai số tiền",
                                      "Ảnh mờ/Lỗi",
                                      "Giao dịch chưa khớp",
                                      "Bill giả mạo"
                                    ].map((reason) => (
                                      <button 
                                        key={reason}
                                        onClick={async () => { 
                                          if (isProcessing || isGlobalProcessing) return;
                                          setIsProcessing(loan.id);
                                          await onAction(loan.id, 'REJECT', reason);
                                          setRejectingLoanId(null);
                                          setIsProcessing(null);
                                        }}
                                        disabled={!!isProcessing || isGlobalProcessing}
                                        className="bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all"
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Loan Pagination Controls */}
                    {totalLoanPages > 1 && (
                      <div className="flex items-center justify-between mt-4 px-1 pt-2 border-t border-white/5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLoanCurrentPage(prev => ({ ...prev, [uid]: Math.max(1, (prev[uid] || 1) - 1) }));
                          }}
                          disabled={userLoanPage === 1}
                          className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${userLoanPage === 1 ? 'text-gray-700' : 'text-[#ff8c00] hover:text-white'}`}
                        >
                          <ChevronLeft size={12} /> TRƯỚC
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-white">{userLoanPage}</span>
                          <span className="text-[8px] font-bold text-gray-600">/</span>
                          <span className="text-[8px] font-bold text-gray-600">{totalLoanPages}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLoanCurrentPage(prev => ({ ...prev, [uid]: Math.min(totalLoanPages, (prev[uid] || 1) + 1) }));
                          }}
                          disabled={userLoanPage === totalLoanPages}
                          className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${userLoanPage === totalLoanPages ? 'text-gray-700' : 'text-[#ff8c00] hover:text-white'}`}
                        >
                          TIẾP <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1 pt-4 border-t border-white/5 shrink-0">
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

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="absolute top-6 right-6 flex gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = zoomImage;
                link.download = 'bill-payment.png';
                link.click();
              }}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <Download size={24} />
            </button>
            <button 
              onClick={() => setZoomImage(null)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <img 
            src={zoomImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-500" 
            alt="Zoomed bill" 
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};

export default AdminLoanApproval;
