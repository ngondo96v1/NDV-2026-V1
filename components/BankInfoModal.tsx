
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { User } from '../types';
import { X, Landmark, CreditCard, User as UserIcon, Save, AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { BANK_BINS, VIETNAM_BANKS } from '../constants';
import BankSearchableSelect from './BankSearchableSelect';

interface BankInfoModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (bankData: { bankName: string; bankBin?: string; bankAccountNumber: string; bankAccountHolder: string }) => void;
  systemSettings?: any;
}

const BankInfoModal: React.FC<BankInfoModalProps> = ({ user, onClose, onUpdate, systemSettings }) => {
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankBin, setBankBin] = useState(user?.bankBin || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.bankAccountHolder || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!bankName) return VIETNAM_BANKS;
    return VIETNAM_BANKS.filter(b => b.toLowerCase().includes(bankName.toLowerCase()));
  }, [bankName]);

  const normalizeName = (str: string) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toUpperCase()
      .trim();
  };

  const checkAccount = async (bin: string, account: string) => {
    if (!bin || !account || account.length < 6 || !systemSettings?.vietqrApiKey) return;
    setIsChecking(true);
    setLookupError(null);
    try {
      const response = await fetch('https://api.vietqr.io/v2/lookup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': systemSettings.vietqrApiKey,
          'x-client-id': systemSettings.vietqrClientId
        },
        body: JSON.stringify({ bin, accountNumber: account })
      });
      const result = await response.json();
      const accountName = result.data?.accountName || result.data?.account_name;
      
      if (result.code === '00' && accountName) {
        setBankAccountHolder(accountName.toUpperCase());
      } else {
        setLookupError(result.desc || result.message || 'Không tìm thấy tài khoản');
      }
    } catch (e) {
      setLookupError('Lỗi kết nối hệ thống tra cứu');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectBank = (bank: string) => {
    setBankName(bank);
    setShowSuggestions(false);
    const bin = BANK_BINS[bank];
    if (bin && bankAccountNumber.length >= 6) {
      checkAccount(bin, bankAccountNumber);
    }
  };

  const hasAccents = (str: string) => {
    const accents = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return accents.test(str);
  };

  const isAccountHolderInvalid = hasAccents(bankAccountHolder);

  const normalizedUserFullName = useMemo(() => normalizeName(user?.fullName || ""), [user?.fullName]);
  const normalizedAccountHolder = useMemo(() => normalizeName(bankAccountHolder), [bankAccountHolder]);
  const isNameMismatched = bankAccountHolder.length > 0 && normalizedAccountHolder !== normalizedUserFullName;

  const handleSave = () => {
    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const normalizedUserFullName = normalizeName(user?.fullName || "");
    const normalizedAccountHolder = normalizeName(bankAccountHolder);

    if (normalizedAccountHolder !== normalizedUserFullName) {
      // Tooltip will show the error, but we also keep alert as a fallback
      return;
    }

    setShowConfirm(true);
  };

  const confirmSave = () => {
    onUpdate({ bankName, bankBin, bankAccountNumber, bankAccountHolder });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[90dvh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Landmark size={18} />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Tài khoản nhận tiền</h3>
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
          <div className="space-y-5">
            <div className="space-y-1.5 relative">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Tên ngân hàng</label>
              <BankSearchableSelect 
                value={bankName}
                onChange={(name, bin) => {
                  setBankName(name);
                  setBankBin(bin);
                  if (bankAccountNumber.length >= 6) {
                    checkAccount(bin, bankAccountNumber);
                  }
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Số tài khoản</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                  <CreditCard size={16} />
                </div>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={bankAccountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setBankAccountNumber(val);
                    const bin = BANK_BINS[bankName];
                    if (bin && val.length >= 6) {
                      checkAccount(bin, val);
                    }
                  }}
                  placeholder="Nhập số tài khoản..."
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  {isChecking && <Loader2 className="animate-spin text-blue-500" size={14} />}
                </div>
              </div>
              {lookupError && (
                <div className="flex items-center gap-1.5 ml-4 mt-1">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-wider">{lookupError}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Chủ tài khoản</label>
                {isAccountHolderInvalid && (
                  <div className="flex items-center gap-1 text-red-500 animate-pulse">
                    <AlertCircle size={10} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Vui lòng viết không dấu</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                  <UserIcon size={16} />
                </div>
                <input 
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                  placeholder="TÊN KHÔNG DẤU..."
                  className={`w-full bg-black border rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none transition-all ${isAccountHolderInvalid || isNameMismatched ? 'border-red-500/50' : 'border-white/5 focus:border-[#ff8c00]/30'}`}
                />
                {isNameMismatched && (
                  <div className="absolute -top-10 left-0 right-0 z-20 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-red-600 text-white text-[8px] font-black py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-xl relative">
                      <AlertCircle size={12} />
                      <span>TÊN TÀI KHOẢN KHÔNG HỢP LỆ</span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                    </div>
                  </div>
                )}
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
            <Save size={14} /> Lưu thông tin
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] w-full max-w-xs rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Xác nhận thông tin</h4>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                Vui lòng kiểm tra kỹ số tài khoản và tên ngân hàng. Thông tin sai lệch sẽ ảnh hưởng đến việc nhận tiền giải ngân.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={confirmSave}
                className="w-full py-4 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Tôi đã kiểm tra kỹ
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Quay lại sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankInfoModal;

