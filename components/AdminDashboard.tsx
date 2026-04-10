import React, { useState, useEffect, useRef } from 'react';
import { User, LoanRecord, MonthlyStat, AppSettings, BudgetLog } from '../types';
import { 
  Activity, 
  Wallet, 
  TrendingUp, 
  Users, 
  ClipboardList, 
  LogOut, 
  AlertCircle,
  Clock,
  ShieldAlert,
  RotateCcw,
  RefreshCcw,
  X,
  Check,
  Database,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Zap,
  ShieldCheck,
  History,
  ArrowRight
} from 'lucide-react';
import * as d3 from 'd3';

import DatabaseErrorModal from './DatabaseErrorModal';

interface AdminDashboardProps {
  user: User | null;
  loans: LoanRecord[];
  registeredUsersCount: number;
  systemBudget: number;
  rankProfit: number;
  loanProfit: number;
  monthlyStats: MonthlyStat[];
  budgetLogs: BudgetLog[];
  lastKeepAlive: string | null;
  onResetRankProfit: () => void;
  onResetLoanProfit: () => void;
  onNavigateToUsers: () => void;
  onNavigateToBudget: () => void;
  onLogout: () => void;
  onRefresh?: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  settings: AppSettings;
}

const AdminDashboard: React.FC<AdminDashboardProps> = React.memo(({ 
  user, 
  loans, 
  registeredUsersCount, 
  systemBudget, 
  rankProfit, 
  loanProfit,
  monthlyStats,
  budgetLogs,
  lastKeepAlive,
  onResetRankProfit, 
  onResetLoanProfit,
  onNavigateToUsers,
  onNavigateToBudget,
  onLogout,
  onRefresh,
  authenticatedFetch,
  settings
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLoanResetConfirm, setShowLoanResetConfirm] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string; error?: string } | null>(null);
  const [showDbErrorModal, setShowDbErrorModal] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);
  
  const checkDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const response = await authenticatedFetch('/api/supabase-status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server không trả về JSON (Content-Type: ${contentType}). Nội dung: ${text.substring(0, 50)}...`);
      }

      const data = await response.json();
      setDbStatus(data);
      if (!data.connected) {
        setShowDbErrorModal(true);
      }
    } catch (e: any) {
      console.error("Database status check error:", e);
      const errorMsg = `Lỗi kết nối API: ${e.message || 'Lỗi không xác định'}`;
      setDbStatus({ connected: false, error: errorMsg });
      setShowDbErrorModal(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  // Draw Chart
  useEffect(() => {
    if (!chartRef.current || !monthlyStats.length) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const width = chartRef.current.clientWidth;
    const height = 120;
    const margin = { top: 10, right: 10, bottom: 20, left: 10 };

    const data = [...monthlyStats].reverse(); // Show chronological order

    const x = d3.scalePoint()
      .domain(data.map(d => d.month))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalProfit) || 0])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<MonthlyStat>()
      .x(d => x(d.month) || 0)
      .y(d => y(d.totalProfit))
      .curve(d3.curveMonotoneX);

    const area = d3.area<MonthlyStat>()
      .x(d => x(d.month) || 0)
      .y0(height - margin.bottom)
      .y1(d => y(d.totalProfit))
      .curve(d3.curveMonotoneX);

    // Add Area
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#chart-gradient)")
      .attr("d", area);

    // Add Line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add Dots
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.month) || 0)
      .attr("cy", d => y(d.totalProfit))
      .attr("r", 3)
      .attr("fill", "#22c55e")
      .attr("stroke", "#0a0a0a")
      .attr("stroke-width", 1);

    // Add Labels
    svg.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.month) || 0)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", "6px")
      .attr("font-weight", "900")
      .text(d => d.month);

    // Add Gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "chart-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#22c55e")
      .attr("stop-opacity", 0.2);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#22c55e")
      .attr("stop-opacity", 0);

  }, [monthlyStats]);

  // Loan Statistics
  const settledLoans = loans.filter(l => l.status === 'ĐÃ TẤT TOÁN');
  const pendingLoans = loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN');
  const activeLoans = loans.filter(l => l.status === 'ĐANG NỢ');
  
  const today = new Date();
  const overdueLoans = loans.filter(l => {
    if ((l.status !== 'ĐANG NỢ' && l.status !== 'CHỜ TẤT TOÁN') || !l.date || typeof l.date !== 'string') return false;
    const [d, m, y] = l.date.split('/').map(Number);
    const dueDate = new Date(y, m - 1, d);
    return dueDate < today;
  });

  // Financial Statistics
  const totalDisbursed = loans.filter(l => l.status !== 'BỊ TỪ CHỐI' && l.status !== 'CHỜ DUYỆT').reduce((acc, curr) => acc + curr.amount, 0);
  const totalCollected = settledLoans.reduce((acc, curr) => acc + curr.amount, 0);
  const activeDebt = totalDisbursed - totalCollected;
  const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

  const isBudgetAlarm = systemBudget <= 2000000;

  const handleConfirmReset = () => {
    onResetRankProfit();
    setShowResetConfirm(false);
  };

  const handleConfirmLoanReset = () => {
    onResetLoanProfit();
    setShowLoanResetConfirm(false);
  };

  const recentLogs = budgetLogs.slice(0, 3);

  return (
    <div className="w-full bg-[#0a0a0a] px-5 space-y-6 pt-4 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex justify-between items-center px-1 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#ff8c00] to-[#ff5f00] rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-xl shadow-orange-500/20">
            NDV
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Tổng quan</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Hệ thống ổn định</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={checkDbStatus} 
            disabled={isCheckingDb}
            className={`w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isCheckingDb ? 'animate-spin' : ''}`}
          >
            <Database size={18} className={dbStatus?.connected ? 'text-green-500' : 'text-gray-500'} />
          </button>
          <button onClick={onLogout} className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Profit Card */}
        <div className="col-span-2 bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Tổng lợi nhuận (Toàn thời gian)</p>
              <h3 className="text-3xl font-black text-green-500 tracking-tighter">
                {(loanProfit + rankProfit).toLocaleString()} <span className="text-xs font-bold text-green-500/60 uppercase ml-0.5">đ</span>
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  <ArrowUpRight size={10} className="text-green-500" />
                  <span className="text-[8px] font-black text-green-500 uppercase">Tăng trưởng tốt</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-500/20">
              <TrendingUp size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full"></div>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Phí & Phạt</p>
              </div>
              <p className="text-sm font-black text-white">{loanProfit.toLocaleString()} đ</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nâng hạng</p>
              </div>
              <p className="text-sm font-black text-white">{rankProfit.toLocaleString()} đ</p>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          {monthlyStats.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Xu hướng lợi nhuận</p>
                <BarChart3 size={12} className="text-gray-700" />
              </div>
              <svg ref={chartRef} className="w-full h-[120px]"></svg>
            </div>
          )}
        </div>

        {/* System Budget Card */}
        <div className="bg-[#111111] border border-white/5 rounded-[2rem] p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/10">
              <Wallet size={18} />
            </div>
            {isBudgetAlarm && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Ngân sách hệ thống</p>
            <p className={`text-lg font-black tracking-tight ${isBudgetAlarm ? 'text-red-500' : 'text-white'}`}>
              {systemBudget.toLocaleString()} đ
            </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isBudgetAlarm ? 'bg-red-500' : 'bg-orange-500'}`} 
              style={{ width: `${Math.min(100, (systemBudget / 50000000) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Active Debt Card */}
        <div className="bg-[#111111] border border-white/5 rounded-[2rem] p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/10">
              <ShieldAlert size={18} />
            </div>
            <div className="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded-md">
              <ArrowDownRight size={8} className="text-red-500" />
              <span className="text-[6px] font-black text-red-500 uppercase">Dư nợ</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dư nợ hiện tại</p>
            <p className="text-lg font-black text-white tracking-tight">
              {activeDebt.toLocaleString()} đ
            </p>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-1000" 
              style={{ width: `${Math.min(100, (activeDebt / (totalDisbursed || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Section */}
      <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/10">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Chi tiết vận hành</h3>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Users size={10} className="text-gray-500" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">{registeredUsersCount} User</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Loan Status Breakdown */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Trạng thái khoản vay (Hiện tại)</p>
              <div className="flex items-center gap-1 text-blue-500">
                <PieChart size={10} />
                <span className="text-[8px] font-black uppercase">Phân bổ</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Chờ duyệt</p>
                  <p className="text-base font-black text-white">{pendingLoans.length}</p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Quá hạn</p>
                  <p className="text-base font-black text-red-500">{overdueLoans.length}</p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Đang nợ</p>
                  <p className="text-base font-black text-white">{activeLoans.length}</p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                  <Check size={16} />
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Tất toán (3 ngày)</p>
                  <p className="text-base font-black text-white">{settledLoans.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Stats */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hiệu suất thu hồi (Chu kỳ hiện tại)</p>
              <div className="flex items-center gap-1 text-green-500">
                <Percent size={10} />
                <span className="text-[8px] font-black uppercase">{collectionRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tổng giải ngân</span>
                </div>
                <span className="text-[10px] font-black text-white">{totalDisbursed.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tổng thu hồi</span>
                </div>
                <span className="text-[10px] font-black text-green-500">{totalCollected.toLocaleString()} đ</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000" 
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Budget Activity */}
          {recentLogs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Dòng tiền gần đây</p>
                <button 
                  onClick={onNavigateToBudget}
                  className="flex items-center gap-1 text-[#ff8c00] active:scale-95 transition-all"
                >
                  <span className="text-[7px] font-black uppercase">Xem tất cả</span>
                  <ArrowRight size={8} />
                </button>
              </div>
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        log.type === 'ADD' || log.type === 'LOAN_REPAY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {log.type === 'ADD' || log.type === 'LOAN_REPAY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white uppercase leading-tight">{log.note || 'Giao dịch hệ thống'}</p>
                        <p className="text-[6px] font-bold text-gray-500 uppercase mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <p className={`text-[10px] font-black ${
                      log.type === 'ADD' || log.type === 'LOAN_REPAY' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {log.type === 'ADD' || log.type === 'LOAN_REPAY' ? '+' : '-'}{log.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Trạng thái hệ thống</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Database size={12} className={dbStatus?.connected ? 'text-green-500' : 'text-red-500'} />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cơ sở dữ liệu</span>
                </div>
                <p className={`text-[10px] font-black uppercase ${dbStatus?.connected ? 'text-green-500' : 'text-red-500'}`}>
                  {dbStatus?.connected ? 'Đã kết nối' : 'Mất kết nối'}
                </p>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-yellow-500" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Keep Alive</span>
                </div>
                <p className="text-[10px] font-black text-white uppercase">
                  {lastKeepAlive ? new Date(lastKeepAlive).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onNavigateToUsers}
          className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
        >
          <Users size={16} className="text-orange-500" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Quản lý User</span>
        </button>
        <button 
          onClick={onRefresh}
          className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-2.5 active:scale-95 transition-all"
        >
          <RefreshCcw size={16} className="text-blue-500" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Modals */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-[#111111] border border-orange-500/20 w-full max-w-sm rounded-3xl p-6 space-y-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                 <RotateCcw size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">RESET THỐNG KÊ?</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed px-3">
                  Bạn có chắc chắn muốn đặt lại thống kê <span className="text-orange-500">Phí Nâng Hạng</span> về 0? Hành động này không ảnh hưởng đến số dư người dùng.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
               <button 
                 onClick={() => setShowResetConfirm(false)}
                 className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={12} /> HỦY BỎ
               </button>
               <button 
                 onClick={handleConfirmReset}
                 className="flex-1 py-3.5 bg-orange-600 rounded-xl text-[9px] font-black text-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40"
               >
                 <Check size={12} /> ĐỒNG Ý
               </button>
            </div>
          </div>
        </div>
      )}

      {showLoanResetConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-[#111111] border border-orange-500/20 w-full max-w-sm rounded-3xl p-6 space-y-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                 <RotateCcw size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">RESET LỢI NHUẬN?</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed px-3">
                  Bạn có chắc chắn muốn đặt lại thống kê <span className="text-orange-500">Lợi nhuận từ Phí & Phạt</span> về 0? Hành động này không ảnh hưởng đến số dư người dùng.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
               <button 
                 onClick={() => setShowLoanResetConfirm(false)}
                 className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={12} /> HỦY BỎ
               </button>
               <button 
                 onClick={handleConfirmLoanReset}
                 className="flex-1 py-3.5 bg-orange-600 rounded-xl text-[9px] font-black text-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40"
               >
                 <Check size={12} /> ĐỒNG Ý
               </button>
            </div>
          </div>
        </div>
      )}

      {showDbErrorModal && dbStatus?.error && (
        <DatabaseErrorModal 
          error={dbStatus.error} 
          onRetry={() => {
            setShowDbErrorModal(false);
            checkDbStatus();
          }} 
          onClose={() => setShowDbErrorModal(false)} 
        />
      )}
    </div>
  );
});

export default AdminDashboard;
