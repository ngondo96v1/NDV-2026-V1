
import React from 'react';
import { 
  Shield, 
  Smartphone, 
  Clock, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LogEntry } from '../types';

interface AdminLogsProps {
  logs: LogEntry[];
  onBack: () => void;
}

const AdminLogs: React.FC<AdminLogsProps> = ({ logs, onBack }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const displayedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full bg-black px-5 pb-10 animate-in fade-in duration-500 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between pt-8 mb-6 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-8 h-8 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
            NHẬT KÝ HỆ THỐNG
          </h1>
        </div>
        <button className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10 active:scale-95 transition-all">
          <Shield size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Hệ thống chưa ghi nhận nhật ký</p>
            </div>
          ) : (
            displayedLogs.map((log, index) => (
              <div 
                key={log.id} 
                className={`p-5 space-y-3 transition-colors hover:bg-white/[0.01] ${index !== displayedLogs.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm font-black uppercase tracking-tight leading-none ${log.user === 'ADMIN' ? 'text-[#ff8c00]' : 'text-blue-500'}`}>{log.user}</h3>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={10} className="opacity-60" />
                    <span className="text-[9px] font-bold opacity-80">{log.time}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white tracking-tight leading-none">{log.action}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <ShieldCheck size={12} className="opacity-30" />
                    <span className="text-[8px] font-black uppercase tracking-widest">IP: {log.ip}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Smartphone size={12} className="opacity-30" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{log.device}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

      {logs.length > 0 && (
        <p className="text-center text-[7px] font-black text-gray-700 uppercase tracking-[0.2em] mt-4 shrink-0">
          Hiển thị {displayedLogs.length} nhật ký / trang
        </p>
      )}
    </div>
  );
};

export default AdminLogs;
