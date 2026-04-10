import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRank, AppSettings } from '../types';
import { 
  Medal, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Trophy, 
  X, 
  ArrowUpCircle, 
  ArrowDownToLine,
  ChevronLeft, 
  CircleHelp,
  Info,
  Check,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Landmark,
  Loader2,
  Copy,
  Camera,
  MessageCircle,
  Download
} from 'lucide-react';
import { compressImage, uploadToImgBB } from '../utils';
import { BANK_BINS } from '../constants';

interface RankLimitsProps {
  user: User | null;
  isGlobalProcessing: boolean;
  onBack: () => void;
  onUpgrade: (targetRank: UserRank, bill: string) => Promise<void> | void;
  onPayOSUpgrade: (rank: string, amount: number) => Promise<void> | void;
  onCancelUpgrade?: () => Promise<void> | void;
  settings: AppSettings;
}

enum RankView {
  LIST = 'LIST',
  PAYMENT = 'PAYMENT'
}

const RankLimits: React.FC<RankLimitsProps> = ({ user, isGlobalProcessing, onBack, onUpgrade, onPayOSUpgrade, onCancelUpgrade, settings }) => {
  const [view, setView] = useState<RankView>(RankView.LIST);
  const [selectedRank, setSelectedRank] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PAYOS' | 'VIETQR'>(settings.ENABLE_PAYOS ? 'PAYOS' : 'VIETQR');
  const [qrLoading, setQrLoading] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ranks = useMemo(() => {
    if (settings.RANK_CONFIG && settings.RANK_CONFIG.length > 0) {
      return settings.RANK_CONFIG.map(r => {
        let icon = <Medal size={24} className="text-gray-500" />;
        if (r.id === 'bronze' || r.id === 'silver') icon = <Star size={24} style={{ color: r.color }} />;
        else if (r.id === 'gold') icon = <Medal size={24} style={{ color: r.color }} />;
        else if (r.id === 'diamond') icon = <ShieldCheck size={24} style={{ color: r.color }} />;
        
        return {
          ...r,
          min: `${(r.minLimit / 1000000).toLocaleString()} triệu đ`,
          max: `${(r.maxLimit / 1000000).toLocaleString()} triệu đ`,
          limitVal: r.maxLimit,
          icon
        };
      });
    }

    const initial = Number(settings.INITIAL_LIMIT || 2000000);
    const max = Number(settings.MAX_SINGLE_LOAN_AMOUNT || 10000000);
    const step = (max - initial) / 4;

    return [
      {
        id: 'standard',
        name: 'TIÊU CHUẨN',
        code: 'USER',
        min: '1.000.000 đ',
        max: `${(initial / 1000000).toLocaleString()} triệu đ`,
        limitVal: initial,
        icon: <Medal size={24} className="text-gray-500" />,
        features: [`Hạn mức 1 - ${initial / 1000000} triệu`, 'Duyệt trong 24h'],
      },
      {
        id: 'bronze',
        name: 'ĐỒNG',
        code: 'DONG',
        min: '1.000.000 đ',
        max: `${((initial + step) / 1000000).toLocaleString()} triệu đ`,
        limitVal: initial + step,
        icon: <Star size={24} className="text-orange-300" />,
        features: [`Hạn mức 1 - ${(initial + step) / 1000000} triệu`, 'Ưu tiên duyệt lệnh'],
      },
      {
        id: 'silver',
        name: 'BẠC',
        code: 'BAC',
        min: '1.000.000 đ',
        max: `${((initial + step * 2) / 1000000).toLocaleString()} triệu đ`,
        limitVal: initial + step * 2,
        icon: <Star size={24} className="text-blue-200" />,
        features: [`Hạn mức 1 - ${(initial + step * 2) / 1000000} triệu`, 'Hỗ trợ 24/7'],
      },
      {
        id: 'gold',
        name: 'VÀNG',
        code: 'VANG',
        min: '1.000.000 đ',
        max: `${((initial + step * 3) / 1000000).toLocaleString()} triệu đ`,
        limitVal: initial + step * 3,
        icon: <Medal size={24} className="text-yellow-400" />,
        features: [`Hạn mức 1 - ${(initial + step * 3) / 1000000} triệu`, 'Giảm 10% phí phạt'],
      },
      {
        id: 'diamond',
        name: 'KIM CƯƠNG',
        code: 'KIMCUONG',
        min: '1.000.000 đ',
        max: `${(max / 1000000).toLocaleString()} triệu đ`,
        limitVal: max,
        icon: <ShieldCheck size={24} className="text-blue-400" />,
        features: [`Hạn mức 1 - ${max / 1000000} triệu`, 'Duyệt lệnh tức thì'],
      }
    ];
  }, [settings]);

  const currentRankIndex = ranks.findIndex(r => r.id === (user?.rank || 'standard'));

  const handleDownloadQR = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_Nang_Hang_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Lỗi khi tải QR:', error);
      window.open(url, '_blank');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBill(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 800);
          const fileName = `UPGRADE_${user?.fullName || 'user'}_${Date.now()}`;
          const imageUrl = await uploadToImgBB(compressed, fileName, settings.IMGBB_API_KEY);
          setBillImage(imageUrl);
        } catch (error) {
          console.error("Lỗi xử lý ảnh biên lai:", error);
        } finally {
          setIsUploadingBill(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Tự động chuyển sang màn hình thanh toán/trạng thái nếu có yêu cầu đang chờ duyệt
    // Chỉ thực hiện khi component mount lần đầu
    if (user?.pendingUpgradeRank && view === RankView.LIST) {
      const pendingRank = ranks.find(r => r.id === user.pendingUpgradeRank);
      if (pendingRank) {
        setSelectedRank(pendingRank);
        setView(RankView.PAYMENT);
      }
    }
  }, []); // Chạy 1 lần khi mount

  const handleOpenPayment = (rank: any) => {
    setSelectedRank(rank);
    setView(RankView.LIST); // Need this for animation
    setTimeout(() => setView(RankView.PAYMENT), 50);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const hasPending = !!user?.pendingUpgradeRank;

  if (view === RankView.PAYMENT && selectedRank) {
    const isPending = user?.pendingUpgradeRank === selectedRank.id;
    const upgradePercent = Number(settings.UPGRADE_PERCENT) || 10;
    const fee = Math.round(selectedRank.limitVal * (upgradePercent / 100));
    
    // Generate payment content from settings template
    const template = settings.PAYMENT_CONTENT_UPGRADE || "HANG {RANK} {USER}";
    const rankNames: Record<string, string> = {
      'standard': 'TIEU CHUAN',
      'bronze': 'DONG',
      'silver': 'BAC',
      'gold': 'VANG',
      'diamond': 'KIM CUONG'
    };
    const rankName = rankNames[selectedRank.id] || selectedRank.name || selectedRank.code;
    const content = template
      .replace(/\{ID\}|\{USER\}|\{MÃ USER\}|\{MA USER\}|\{TEN USER\}/gi, (user?.id || '').replace(/-/g, ''))
      .replace(/\{PHONE\}|\{SĐT\}|\{SDT\}|\{SỐ ĐIỆN THOẠI\}|\{SO DIEN THOAI\}/gi, (user?.phone || '').replace(/\s/g, ''))
      .replace(/\{RANK\}|\{HẠNG\}|\{HANG\}|\{TÊN HẠNG CẦN NÂNG\}|\{TEN HANG NANG CAP\}|\{TEN HANG\}|\{TÊN HẠNG\}/gi, rankName);
    
    // Find bank BIN from settings or constants
    const bankBin = settings.PAYMENT_ACCOUNT.bankBin || BANK_BINS[settings.PAYMENT_ACCOUNT.bankName.toUpperCase()] || "970422";
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${settings.PAYMENT_ACCOUNT.accountNumber}-compact2.png?amount=${fee}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(settings.PAYMENT_ACCOUNT.accountName)}`;

    const showPayOS = settings.ENABLE_PAYOS;
    const showVietQR = settings.ENABLE_VIETQR;
    
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
        <div className="w-full p-3 flex items-center justify-between bg-black text-white border-b border-white/5 flex-none">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                // Chỉ hủy yêu cầu nếu chưa gửi bill (không phải trạng thái isPending)
                if (!isPending && onCancelUpgrade) {
                  onCancelUpgrade();
                }
                setView(RankView.LIST);
              }}
              className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-widest leading-none">Phí nâng hạng {selectedRank.name}</h3>
              <p className="text-[6px] font-bold text-gray-500 uppercase mt-0.5 tracking-tighter">XÁC THỰC GIAO DỊCH NDV-SAFE</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)} 
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400'}`}
          >
            <CircleHelp size={16} />
          </button>
        </div>

        <div className="flex-1 bg-black px-2 pt-1 pb-2 overflow-hidden flex flex-col">
          <div className="bg-[#111111] w-full rounded-2xl p-3 relative overflow-hidden shadow-2xl border border-white/10 flex-1 flex flex-col">
            <div className="flex-1 min-h-0 space-y-1.5 flex flex-col">
              {showHelp ? (
                <div className="h-full bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-300 space-y-5 overflow-y-auto">
                   <div className="flex items-center gap-3">
                      <Info size={18} className="text-[#ff8c00]" />
                      <span className="text-[14px] font-black text-[#ff8c00] uppercase tracking-widest">
                        {paymentMethod === 'PAYOS' ? 'Hướng dẫn PayOS' : 'Hướng dẫn VietQR'}
                      </span>
                   </div>
                   <div className="space-y-4">
                      {(paymentMethod === 'PAYOS' ? [
                        "Thanh toán: Hệ thống sử dụng cổng PayOS để thanh toán tự động, an toàn và bảo mật tuyệt đối.",
                        "Xác nhận: Sau khi thanh toán thành công, tài khoản của bạn sẽ được nâng hạng ngay lập tức.",
                        "Bảo mật: Mọi giao dịch đều được mã hóa và bảo vệ bởi hệ thống NDV-SAFE.",
                        "Hỗ trợ: Nếu gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ bộ phận CSKH 24/7."
                      ] : [
                        "Chuyển khoản: Thực hiện chuyển khoản chính xác số tiền và nội dung hiển thị trên màn hình.",
                        "Biên lai: Sau khi chuyển khoản thành công, hãy chụp ảnh biên lai và tải lên để hệ thống xác thực.",
                        "Xác thực: Bộ phận kế toán sẽ kiểm tra và phê duyệt yêu cầu của bạn trong 5-15 phút.",
                        "Lưu ý: Vui lòng giữ lại biên lai gốc cho đến khi tài khoản được nâng hạng thành công."
                      ]).map((text, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-6 h-6 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[12px] text-black">{idx + 1}</div>
                          <p className="text-[12px] font-bold text-gray-300 leading-relaxed">{text}</p>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      <div className="space-y-4 pb-4">
                        {showPayOS && showVietQR && (
                          <div className="space-y-3 shrink-0">
                            <div className="flex items-center justify-between px-1">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-[#ff8c00] rounded-full"></div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Phương thức thanh toán</h4>
                              </div>
                            </div>
                            <div className="flex bg-black/60 p-1 rounded-2xl border border-white/5 gap-1">
                              <button
                                onClick={() => setPaymentMethod('PAYOS')}
                                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all border ${
                                  paymentMethod === 'PAYOS' 
                                    ? 'bg-white/10 text-[#ff8c00] font-black border-[#ff8c00]/40 shadow-inner' 
                                    : 'text-gray-500 hover:text-white border-transparent'
                                }`}
                              >
                                <ShieldCheck size={12} />
                                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">Tự động (PayOS)</span>
                              </button>
                              <button
                                onClick={() => setPaymentMethod('VIETQR')}
                                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all border ${
                                  paymentMethod === 'VIETQR' 
                                    ? 'bg-white/10 text-[#ff8c00] font-black border-[#ff8c00]/40 shadow-inner' 
                                    : 'text-gray-500 hover:text-white border-transparent'
                                }`}
                              >
                                <CreditCard size={12} />
                                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">Thủ công (VietQR)</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-[#ff8c00] rounded-full"></div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Chi tiết nâng hạng</h4>
                          </div>
                        </div>

                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          {isPending ? (
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-6 flex flex-col items-center text-center">
                              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                                <Loader2 size={32} className="animate-spin" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-[14px] font-black text-white uppercase tracking-wider">Yêu cầu đang chờ duyệt</h3>
                                <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                                  Hệ thống đang kiểm tra biên lai thanh toán của bạn. Quá trình này thường mất từ 5-15 phút.
                                </p>
                              </div>
                              
                              {user?.rankUpgradeBill && (
                                <div className="w-full space-y-2">
                                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-left">Biên lai đã gửi</p>
                                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 relative group">
                                    <img 
                                      src={user.rankUpgradeBill} 
                                      className="w-full h-full object-cover" 
                                      alt="Biên lai đã gửi" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => window.open(user.rankUpgradeBill, '_blank')}
                                        className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black uppercase tracking-widest"
                                      >
                                        Xem ảnh lớn
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-blue-400 text-left leading-tight">
                                  Nếu quá 30 phút chưa được duyệt, vui lòng liên hệ bộ phận CSKH để được hỗ trợ nhanh nhất.
                                </p>
                              </div>
                            </div>
                          ) : paymentMethod === 'PAYOS' ? (
                            <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-5 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#ff8c00]/10 rounded-full flex items-center justify-center text-[#ff8c00]">
                                  <ShieldCheck size={20} />
                                </div>
                                <div>
                                  <h3 className="text-[12px] font-black text-white uppercase tracking-wider">Nâng hạng qua PayOS</h3>
                                  <p className="text-[9px] font-bold text-[#ff8c00]/60 uppercase tracking-widest">Tự động • Nâng hạng ngay • Bảo mật</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full"></div>
                                  <span>Tài khoản được nâng hạng ngay sau khi thanh toán thành công</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full"></div>
                                  <span>Hệ thống tự động xử lý 24/7</span>
                                </div>
                              </div>

                              <div className="pt-2">
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                  <span className="text-[10px] font-black text-gray-500 uppercase">Phí nâng hạng</span>
                                  <span className="text-[18px] font-black text-[#ff8c00]">{fee.toLocaleString()} đ</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="bg-white rounded-2xl p-3 shadow-xl">
                                <div className="flex gap-3">
                                  {/* Left: QR Code */}
                                  <div className="w-[40%] flex flex-col items-center justify-center">
                                    <div className="relative group w-full">
                                      <div className="absolute -inset-2 bg-orange-500/5 rounded-2xl blur-xl group-hover:bg-orange-500/10 transition-all duration-500"></div>
                                      <div className="relative bg-white p-1.5 rounded-xl shadow-inner border border-gray-100 w-full aspect-square flex items-center justify-center">
                                        {qrLoading && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                          </div>
                                        )}
                                        <img 
                                          src={qrUrl} 
                                          alt="VietQR" 
                                          className="w-full h-full object-contain"
                                          onLoad={() => setQrLoading(false)}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleDownloadQR(qrUrl)}
                                      className="flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-orange-500/10 rounded-full hover:bg-orange-500/20 transition-all active:scale-95"
                                    >
                                      <Download size={8} className="text-[#ff8c00]" />
                                      <span className="text-[7px] font-black text-[#ff8c00] uppercase tracking-widest">Tải về QR</span>
                                    </button>
                                  </div>

                                  {/* Right: Payment Details */}
                                  <div className="flex-1 space-y-2">
                                    <div className="space-y-1">
                                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Thông tin thụ hưởng</p>
                                      <div 
                                        onClick={() => copyToClipboard(`${settings.PAYMENT_ACCOUNT.bankName} ${settings.PAYMENT_ACCOUNT.accountNumber}`)}
                                        className="bg-gray-50 p-1.5 rounded-lg border border-gray-100 cursor-pointer active:scale-95 transition-all group"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <p className="text-[8px] font-black text-black uppercase truncate">{settings.PAYMENT_ACCOUNT.bankName}</p>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></div>
                                            <p className="text-[9px] font-black text-orange-600 tracking-tighter shrink-0">{settings.PAYMENT_ACCOUNT.accountNumber}</p>
                                          </div>
                                          <Copy size={9} className="text-gray-400 group-hover:text-orange-600 shrink-0" />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Chủ tài khoản</p>
                                      <div 
                                        onClick={() => copyToClipboard(settings.PAYMENT_ACCOUNT.accountName)}
                                        className="flex items-center justify-between bg-gray-50 px-1.5 py-1 rounded-lg border border-gray-100 cursor-pointer active:scale-95 transition-all group"
                                      >
                                        <p className="text-[8px] font-black text-black uppercase">{settings.PAYMENT_ACCOUNT.accountName}</p>
                                        <Copy size={9} className="text-gray-400 group-hover:text-orange-600" />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Nội dung chuyển khoản</p>
                                      <div 
                                        onClick={() => copyToClipboard(content)}
                                        className="flex items-center justify-between bg-orange-50 px-1.5 py-1 rounded-lg border border-orange-100 cursor-pointer active:scale-95 transition-all group"
                                      >
                                        <p className="text-[8px] font-black text-orange-600 uppercase">{content}</p>
                                        <Copy size={9} className="text-orange-400 group-hover:text-orange-600" />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Số tiền thanh toán</p>
                                      <div 
                                        onClick={() => copyToClipboard(fee.toString())}
                                        className="flex items-center justify-between bg-orange-50 px-1.5 py-1 rounded-lg border border-orange-100 cursor-pointer active:scale-95 transition-all group"
                                      >
                                        <p className="text-[11px] font-black text-orange-600">{fee.toLocaleString()} đ</p>
                                        <Copy size={9} className="text-orange-400 group-hover:text-orange-600" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 flex items-start gap-2.5">
                                <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[8px] font-bold text-blue-400 leading-tight">
                                  Vui lòng chuyển chính xác số tiền và nội dung để hệ thống tự động nhận diện. Sau khi hoàn tất, hãy tải ảnh biên lai lên để xác thực.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-[#ff8c00] rounded-full"></div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Xác thực biên lai</h4>
                                  </div>
                                </div>
                                
                                <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  accept="image/*"
                                  className="hidden"
                                />

                                <div 
                                  onClick={() => !isUploadingBill && fileInputRef.current?.click()}
                                  className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all overflow-hidden relative ${
                                    billImage ? 'border-green-500/50 bg-green-500/5' : 'border-[#332a1e] bg-[#1a1a1e]'
                                  }`}
                                >
                                  {billImage ? (
                                    <>
                                      <img src={billImage} className="w-full h-full object-cover opacity-60" alt="Biên lai" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-green-500/10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-0.5">
                                          <CheckCircle2 size={12} color="black" />
                                        </div>
                                        <span className="text-[7px] font-black text-white uppercase tracking-widest">
                                          {billImage.startsWith('http') ? 'Xác thực OK' : 'Đã nén'}
                                        </span>
                                      </div>
                                      <div className="absolute top-1.5 right-1.5 z-10">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setBillImage(null);
                                          }}
                                          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    </>
                                  ) : isUploadingBill ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="w-4 h-4 border-2 border-[#ff8c00] border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-[7px] font-black text-gray-600 uppercase">Đang xử lý...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Camera size={16} className="text-[#ff8c00]" />
                                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tải lên biên lai</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 p-3 bg-black flex gap-2 z-[110] border-t border-white/5 mt-auto">
          {isPending ? (
            <button
              onClick={() => onCancelUpgrade?.()}
              disabled={isGlobalProcessing}
              className="w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <X size={14} />
              Hủy yêu cầu nâng hạng
            </button>
          ) : paymentMethod === 'PAYOS' ? (
            <button
              onClick={() => onPayOSUpgrade(selectedRank.id, fee)}
              disabled={isSubmitting || isGlobalProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 bg-[#ff8c00] text-black shadow-orange-950/20`}
            >
              {isSubmitting || isGlobalProcessing ? 'ĐANG XỬ LÝ...' : 'NÂNG HẠNG TỰ ĐỘNG NGAY'}
            </button>
          ) : (
            <button
              onClick={async () => {
                if (billImage) {
                  setIsSubmitting(true);
                  try {
                    await onUpgrade(selectedRank.id, billImage);
                    setSuccessToast(true);
                    setTimeout(() => {
                      setSuccessToast(false);
                      onBack();
                    }, 2000);
                  } catch (error) {
                    console.error("Lỗi nâng hạng:", error);
                  } finally {
                    setIsSubmitting(false);
                  }
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isSubmitting || isGlobalProcessing || isUploadingBill}
              className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 ${
                billImage 
                  ? 'bg-[#ff8c00] text-black shadow-orange-950/20' 
                  : 'bg-white/10 text-gray-500 border border-white/5'
              } flex items-center justify-center gap-2`}
            >
              {isUploadingBill ? (
                <Loader2 size={14} className="animate-spin" />
              ) : billImage ? (
                <CheckCircle2 size={14} />
              ) : (
                <ArrowUpCircle size={14} />
              )}
              {isUploadingBill ? 'ĐANG XỬ LÝ ẢNH...' : billImage ? 'GỬI BIÊN LAI XÁC THỰC' : 'TẢI BIÊN LAI LÊN'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black px-4 flex flex-col animate-in fade-in duration-500 overflow-hidden relative">
      {copyToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            Đã sao chép thành công
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            Gửi biên lai thành công
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-1 py-4 flex-none">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="w-7 h-7 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-white tracking-tighter uppercase">Hạng & Hạn mức</h2>
            {user?.pendingUpgradeRank && (
              <div className="bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Đang duyệt nâng hạng</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-500'}`}
        >
          <CircleHelp size={16} />
        </button>
      </div>

      {showHelp && (
        <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-5 mb-3 animate-in fade-in zoom-in duration-300 space-y-4 flex-none">
           <div className="flex items-center gap-3">
              <Info size={18} className="text-[#ff8c00]" />
              <span className="text-[14px] font-black text-[#ff8c00] uppercase tracking-widest">Quy định nâng hạng</span>
           </div>
           <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[12px] text-black">1</div>
                <p className="text-[12px] font-bold text-gray-300 leading-relaxed">Nâng hạng giúp tăng hạn mức vay tối đa, ưu tiên xét duyệt lệnh và nhận các đặc quyền riêng biệt theo từng cấp bậc.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[12px] text-black">2</div>
                <p className="text-[12px] font-bold text-gray-300 leading-relaxed">Phí nâng hạng được tính là {settings.UPGRADE_PERCENT}% dựa trên hạn mức tối đa của cấp bậc mục tiêu bạn muốn đạt đến.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[12px] text-black">3</div>
                <p className="text-[12px] font-bold text-gray-300 leading-relaxed">Sau khi gửi yêu cầu và biên lai, vui lòng đợi hệ thống kiểm tra và phê duyệt trong vòng 5-15 phút (giờ hành chính).</p>
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 pb-4 overflow-hidden">
        {ranks.map((rank, idx) => {
          const isCurrent = user?.rank === rank.id;
          const isTargetPending = user?.pendingUpgradeRank === rank.id;
          const isHigherRank = idx > currentRankIndex;

          return (
            <div 
              key={rank.id}
              onClick={() => isTargetPending && handleOpenPayment(rank)}
              className={`flex-1 min-h-0 bg-[#111111] rounded-xl p-3 relative transition-all duration-300 border flex flex-col justify-center ${
                isTargetPending ? 'cursor-pointer active:scale-[0.98]' : ''
              } ${
                isCurrent ? 'border-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.1)]' : 'border-white/5'
              } ${!isCurrent && (currentRankIndex === ranks.length - 1 || hasPending) ? 'opacity-40' : 'opacity-100'}`}
            >
              {(isCurrent || isTargetPending) && (
                <div className={`absolute right-3 top-2 text-[8px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-lg ${
                  isCurrent ? 'bg-[#ff8c00] text-black shadow-orange-500/20' : 'bg-blue-600 text-white shadow-blue-500/20 animate-pulse'
                }`}>
                  {isCurrent ? 'Hạng hiện tại' : 'Đang chờ duyệt'}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  {React.cloneElement(rank.icon as React.ReactElement, { size: 16 })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-black text-white leading-tight tracking-tight uppercase">{rank.name}</h3>
                    <span className="text-[7px] font-black text-[#ff8c00] tracking-widest">{rank.max}</span>
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    {rank.features.slice(0, 2).map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1">
                        <CheckCircle2 size={6} className={isCurrent ? 'text-[#ff8c00]' : 'text-gray-600'} />
                        <span className="text-[7px] font-bold text-gray-500 whitespace-nowrap">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {isHigherRank && !hasPending && (
                  <button 
                    onClick={() => handleOpenPayment(rank)}
                    className="bg-[#ff8c00] text-black font-black px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-orange-950/20 active:scale-95 transition-all text-[7px] uppercase tracking-widest"
                  >
                    <ArrowUpCircle size={10} />
                    NÂNG CẤP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankLimits;