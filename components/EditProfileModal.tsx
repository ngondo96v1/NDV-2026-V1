
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { User, AppSettings } from '../types';
import { X, User as UserIcon, MapPin, Save, ShieldCheck, Camera } from 'lucide-react';
import { compressImage, uploadToImgBB } from '../utils';

interface EditProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (userData: Partial<User>) => void;
  settings: AppSettings;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate, settings }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [idNumber, setIdNumber] = useState(user?.idNumber || '');
  const [refZalo, setRefZalo] = useState(user?.refZalo || '');
  const [relationship, setRelationship] = useState(user?.relationship || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 800);
          const fileName = `AVATAR_UPDATE_${user?.phone || 'unknown'}_${Date.now()}`;
          const imageUrl = await uploadToImgBB(compressed, fileName, settings.IMGBB_API_KEY);
          setAvatar(imageUrl);
          toast.success("Đã tải lên ảnh đại diện mới");
        } catch (error) {
          console.error("Lỗi tải ảnh đại diện:", error);
          toast.error("Không thể tải lên ảnh đại diện");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!fullName) {
      toast.error("Họ tên không được để trống");
      return;
    }
    onUpdate({
      fullName,
      address,
      idNumber,
      refZalo,
      relationship,
      avatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[90dvh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#ff8c00]/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
              <UserIcon size={18} />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Chỉnh sửa thông tin</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center space-y-3 mb-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-black border-2 border-dashed border-[#ff8c00]/30 rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer group"
            >
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              {avatar ? (
                <>
                  <img src={avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </div>
                </>
              ) : uploading ? (
                <div className="w-8 h-8 border-2 border-[#ff8c00] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera size={28} className="text-[#ff8c00]" />
                  <span className="text-[7px] font-black text-gray-500 uppercase">Tải ảnh</span>
                </div>
              )}
            </div>
            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Nhấn để thay đổi ảnh đại diện</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Họ và tên</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                  <UserIcon size={16} />
                </div>
                <input 
                  type="text"
                  value={fullName}
                  readOnly
                  placeholder="Nhập họ tên đầy đủ..."
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Địa chỉ thường trú</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                  <MapPin size={16} />
                </div>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ của bạn..."
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Số CCCD / Định danh</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                  <ShieldCheck size={16} />
                </div>
                <input 
                  type="text"
                  value={idNumber}
                  readOnly
                  placeholder="Nhập số CCCD..."
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Zalo người thân</label>
                <input 
                  type="text"
                  value={refZalo}
                  readOnly
                  placeholder="Số điện thoại..."
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Mối quan hệ</label>
                <input 
                  type="text"
                  value={relationship}
                  readOnly
                  placeholder="VD: Anh, Chị..."
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 shrink-0 bg-[#111111] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            className="flex-[1.5] py-4 bg-[#ff8c00] rounded-2xl text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-950/20 flex items-center justify-center gap-2"
          >
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
