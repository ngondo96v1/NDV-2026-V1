
import React from 'react';
import { AlertCircle, Landmark, User, ChevronRight } from 'lucide-react';

interface ProfileUpdateWarningProps {
  missingBank: boolean;
  missingAvatar: boolean;
  onUpdateBank: () => void;
  onUpdateAvatar: () => void;
}

const ProfileUpdateWarning: React.FC<ProfileUpdateWarningProps> = ({ 
  missingBank, 
  missingAvatar, 
  onUpdateBank, 
  onUpdateAvatar 
}) => {
  // If both are missing, prioritize Bank but mention both, or show a combined view
  // Based on user request "rút gọn lại chỉ 1 Popup nhưng vẫn giữ nguyên ràng buộc"
  
  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-xs rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl text-center">
        <div className="flex justify-center -space-x-4">
          {missingBank && (
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] relative border-4 border-[#111111]">
              <Landmark size={32} />
            </div>
          )}
          {missingAvatar && (
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] relative border-4 border-[#111111]">
              <User size={32} />
            </div>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-4 border-[#111111] translate-x-8 -translate-y-8">
                <AlertCircle size={12} className="text-white" />
             </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-xl font-black text-white uppercase tracking-tighter">Yêu cầu cập nhật</h4>
          <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
            Vui lòng hoàn thiện các thông tin sau để kích hoạt đầy đủ tính năng hệ thống:
          </p>
          
          <div className="space-y-2 pt-2">
            {missingBank && (
              <div className="flex items-center gap-2 text-[#ff8c00] justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff8c00]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Tài khoản ngân hàng</span>
              </div>
            )}
            {missingAvatar && (
              <div className="flex items-center gap-2 text-[#ff8c00] justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff8c00]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Ảnh đại diện chính chủ</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {missingBank ? (
            <button 
              onClick={onUpdateBank}
              className="w-full py-4 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-950/20"
            >
              Cập nhật ngân hàng <ChevronRight size={14} />
            </button>
          ) : (
            <button 
              onClick={onUpdateAvatar}
              className="w-full py-4 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-950/20"
            >
              Cập nhật ảnh đại diện <ChevronRight size={14} />
            </button>
          )}
          
          {missingBank && missingAvatar && (
            <button 
              onClick={onUpdateAvatar}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Cập nhật ảnh đại diện
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdateWarning;
