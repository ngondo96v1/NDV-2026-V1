import React, { useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Gift, Star, Sparkles, X, Trophy, Zap, RefreshCcw } from 'lucide-react';
import { User } from '../types';

interface LuckySpinProps {
  user: User;
  settings: any;
  onSpinResult: (prize: string, amount: number) => void;
  onClose: () => void;
}

const LuckySpin: React.FC<LuckySpinProps> = ({ user, settings, onSpinResult, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const controls = useAnimation();

  // Generate dynamic prizes based on settings (Always show all for visual consistency)
  const getDynamicPrizes = () => {
    const vouchers = settings?.LUCKY_SPIN_VOUCHERS || [];
    
    // We want 12 segments total
    const segments: any[] = [];
    
    // If no vouchers configured, all segments are "Better luck next time"
    if (vouchers.length === 0) {
      for (let i = 0; i < 12; i++) {
        segments.push({ label: 'May mắn lần sau', amount: 0, color: '#1a1a1a', textColor: '#666', weight: 100 });
      }
      return segments;
    }

    // Distribute win rate among vouchers
    // We'll alternate: Voucher, Lose, Voucher, Lose...
    // We always want 12 segments for a nice look
    const winRate = Number(settings?.LUCKY_SPIN_WIN_RATE || 30);
    const voucherWeight = winRate / Math.min(vouchers.length, 6);
    const loseWeight = (100 - winRate) / 6;

    for (let i = 0; i < 6; i++) {
      // Voucher segment
      const v = vouchers[i % vouchers.length];
      segments.push({ 
        label: `${(v.voucherValue / 1000).toLocaleString()}K`, 
        amount: v.voucherValue, 
        minProfit: v.minProfit, // Store for logic
        color: '#ff8c00', 
        textColor: '#000', 
        weight: voucherWeight 
      });
      
      // Lose segment
      segments.push({ 
        label: 'May mắn lần sau', 
        amount: 0, 
        color: '#1a1a1a', 
        textColor: '#666', 
        weight: loseWeight 
      });
    }

    return segments;
  };

  const dynamicPrizes = getDynamicPrizes();

  const handleSpin = async () => {
    if (isSpinning || (user.spins || 0) <= 0) return;

    setIsSpinning(true);
    setResult(null);

    // Calculate current total voucher value of the user
    const currentTotalVoucherValue = (user.vouchers || [])
      .filter(v => v.type === 'LUCKY_SPIN')
      .reduce((sum, v) => sum + v.amount, 0);

    // Find the maximum allowed voucher value from settings
    const vouchers = settings?.LUCKY_SPIN_VOUCHERS || [];
    const maxAllowedVoucherValue = vouchers.length > 0 
      ? Math.max(...vouchers.map(v => v.voucherValue))
      : 0;

    // Filter eligible segments based on user's totalProfit and limits
    // A segment is eligible if it's a "Lose" segment OR a Voucher the user qualifies for
    const userProfit = Number(user.totalProfit || 0);
    const eligiblePrizes = dynamicPrizes.map((p, index) => {
      const isLose = p.amount === 0;
      // A voucher is eligible if:
      // 1. User profit meets requirement
      // 2. Current total + this voucher's value <= max allowed value in settings
      const isEligibleVoucher = p.amount > 0 && 
                               userProfit >= Number(p.minProfit || 0) && 
                               (currentTotalVoucherValue + p.amount) <= maxAllowedVoucherValue;
      
      return {
        ...p,
        originalIndex: index,
        // If not eligible, set weight to 0 so it's never picked
        effectiveWeight: (isLose || isEligibleVoucher) ? p.weight : 0
      };
    });

    // Weighted random selection among eligible prizes
    const totalWeight = eligiblePrizes.reduce((sum, p) => sum + p.effectiveWeight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedIndex = 0;
    for (let i = 0; i < eligiblePrizes.length; i++) {
      random -= eligiblePrizes[i].effectiveWeight;
      if (random <= 0) {
        selectedIndex = eligiblePrizes[i].originalIndex;
        break;
      }
    }
    
    // Calculate rotation
    const segmentAngle = 360 / dynamicPrizes.length;
    const extraSpins = 10 + Math.floor(Math.random() * 5); 
    
    // Current rotation normalized to 0-360
    const currentNormalized = currentRotation % 360;
    // How much to reach 0?
    const toZero = 360 - currentNormalized;
    // How much from 0 to target?
    // Pointer is at the top (0 deg). Segment 0 is at the top.
    // To land segment i at the top, we need to rotate by (360 - i * segmentAngle - segmentAngle/2)
    const toTarget = 360 - (selectedIndex * segmentAngle) - (segmentAngle / 2);
    
    const newRotation = currentRotation + toZero + (extraSpins * 360) + toTarget;

    setCurrentRotation(newRotation);

    await controls.start({
      rotate: newRotation,
      transition: { duration: 6, ease: [0.15, 0, 0.05, 1] }
    });

    const selectedPrize = dynamicPrizes[selectedIndex];
    setResult(selectedPrize);
    setIsSpinning(false);
    
    setTimeout(() => {
      onSpinResult(selectedPrize.label, selectedPrize.amount);
    }, 1500);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Wheel Container */}
      <div className="relative w-40 h-40 mb-3 mt-1">
        {/* Pointer */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 text-[#ff8c00]">
          <div className="w-3 h-5 bg-[#ff8c00] shadow-[0_0_10px_rgba(255,140,0,0.5)]" style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }} />
        </div>

        {/* The Wheel */}
        <motion.div 
          animate={controls}
          className="w-full h-full rounded-full border-[4px] border-[#1a1a1a] shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden bg-[#0a0a0a] ring-2 ring-white/5"
          style={{ transformOrigin: 'center' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {dynamicPrizes.map((prize, i) => {
              const angle = 360 / dynamicPrizes.length;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;
              
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
              
              return (
                <g key={i}>
                  <path 
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                    stroke="#000"
                    strokeWidth="0.2"
                  />
                  <text
                    x="75"
                    y="50"
                    fill={prize.textColor}
                    fontSize="3.2"
                    fontWeight="900"
                    textAnchor="middle"
                    transform={`rotate(${startAngle + angle / 2}, 50, 50)`}
                    className="uppercase tracking-tighter"
                    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
                  >
                    {prize.label.replace('.000đ', 'K')}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center Cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#1a1a1a] rounded-full border border-white/10 shadow-2xl flex items-center justify-center z-20">
            <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center animate-pulse">
              <Zap className="text-black fill-black" size={8} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spin Button & Info */}
      <div className="w-full text-center px-1">
        <div className="mb-3 flex items-center justify-center gap-2 bg-white/5 py-1.5 rounded-lg border border-white/5">
          <div className="w-5 h-5 bg-[#ff8c00]/20 rounded-md flex items-center justify-center text-[#ff8c00]">
            <Zap size={10} className="fill-[#ff8c00]/20" />
          </div>
          <div className="text-left">
            <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">Lượt quay</p>
            <p className="text-[9px] font-black text-white uppercase tracking-tight"><span className="text-[#ff8c00]">{user.spins || 0}</span> Lượt</p>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || (user.spins || 0) <= 0}
          className={`w-full py-2.5 rounded-lg font-black text-[8px] tracking-[0.15em] uppercase shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            isSpinning || (user.spins || 0) <= 0
            ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-[#ff8c00] to-[#ff4500] text-black hover:shadow-[#ff8c00]/20'
          }`}
        >
          {isSpinning ? (
            <>
              <RefreshCcw size={12} className="animate-spin" />
              Đang quay...
            </>
          ) : (
            <>
              <Sparkles size={12} />
              QUAY NGAY
            </>
          )}
        </button>

        <div className="mt-3 p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <p className="text-[6px] text-blue-400/70 font-bold uppercase leading-relaxed tracking-wider text-center">
            * Thanh toán đúng hạn để nhận thêm lượt quay.<br/>
            * Giải thưởng quy đổi thành Voucher Tất Toán.
          </p>
        </div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center z-50 rounded-[32px]"
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#ff8c00]/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#ff8c00] to-[#ff4500] rounded-2xl flex items-center justify-center shadow-2xl rotate-12">
                {result.amount > 0 ? <Trophy size={32} className="text-black" /> : <Star size={32} className="text-black/40" />}
              </div>
            </div>
            
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">
              {result.amount > 0 ? 'CHÚC MỪNG!' : 'TIẾC QUÁ!'}
            </h3>
            
            <p className="text-[9px] font-bold text-gray-400 mb-4 uppercase tracking-widest leading-relaxed">
              {result.amount > 0 
                ? `Bạn đã trúng Voucher trị giá ${result.label}`
                : 'Chúc bạn may mắn hơn ở lần quay sau nhé!'}
            </p>

            {result.amount > 0 && (
              <div className="bg-white/5 border border-dashed border-[#ff8c00]/30 rounded-xl p-3 mb-4 w-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff8c00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="text-left">
                    <p className="text-[7px] font-black text-[#ff8c00] uppercase tracking-widest mb-0.5">Voucher Tất Toán</p>
                    <p className="text-sm font-black text-white tracking-tight">{result.label}</p>
                    <p className="text-[6px] font-bold text-gray-500 uppercase mt-1">Hạn dùng: 30 ngày</p>
                  </div>
                  <Gift size={24} className="text-[#ff8c00] opacity-50" />
                </div>
              </div>
            )}

            <button 
              onClick={() => setResult(null)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              ĐÓNG
            </button>
            
            {result.amount > 0 && <Sparkles className="absolute top-6 right-6 text-[#ff8c00] animate-pulse" size={16} />}
            {result.amount > 0 && <Sparkles className="absolute bottom-6 left-6 text-[#ff8c00] animate-pulse" size={16} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckySpin;
