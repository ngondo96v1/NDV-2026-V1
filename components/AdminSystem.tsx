
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Database, 
  Settings, 
  RefreshCw, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Shield, 
  CreditCard, 
  Wrench, 
  Globe,
  AlertCircle, 
  Loader2, 
  X, 
  Hash,
  TrendingUp,
  Download,
  Upload,
  Search,
  MessageCircle,
  Eye,
  EyeOff,
  Zap,
  Gift,
  Plus,
  Trash2,
  Percent,
  Coins
} from 'lucide-react';
import BankSearchableSelect from './BankSearchableSelect';

interface AdminSystemProps {
  onReset: () => void;
  onImportSuccess: () => void;
  onBack: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  settings: any;
  onSettingsUpdate: (newSettings: any) => void;
}

const AdminSystem: React.FC<AdminSystemProps> = ({ onReset, onImportSuccess, onBack, authenticatedFetch, settings, onSettingsUpdate }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'settings'>('settings');
  const [isCheckingBank, setIsCheckingBank] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    connection: false,
    formats: false,
    payment: false,
    fees: false,
    tools: false,
    notification: false,
    ranks: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (field: string) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev[section];
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      newState[section] = !isCurrentlyExpanded;
      return newState;
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatNumberWithDots = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? val.replace(/\./g, '') : val.toString();
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberFromDots = (val: string) => {
    if (!val) return 0;
    return Number(val.replace(/\./g, ''));
  };

  const sqlSchema = `-- SQL Schema for NDV Money App
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  "fullName" TEXT,
  "idNumber" TEXT UNIQUE,
  balance NUMERIC DEFAULT 0,
  "totalLimit" NUMERIC DEFAULT 0,
  rank TEXT DEFAULT 'standard',
  "rankProgress" NUMERIC DEFAULT 0,
  "isLoggedIn" BOOLEAN DEFAULT false,
  "isAdmin" BOOLEAN DEFAULT false,
  "pendingUpgradeRank" TEXT,
  "rankUpgradeBill" TEXT,
  address TEXT,
  "joinDate" TEXT,
  "idFront" TEXT,
  "idBack" TEXT,
  "refZalo" TEXT UNIQUE,
  relationship TEXT,
  password TEXT,
  "lastLoanSeq" INTEGER DEFAULT 0,
  "bankName" TEXT,
  "bankAccountNumber" TEXT,
  "bankAccountHolder" TEXT,
  "hasJoinedZalo" BOOLEAN DEFAULT false,
  "payosOrderCode" BIGINT,
  "payosCheckoutUrl" TEXT,
  "payosAmount" NUMERIC,
  "payosExpireAt" BIGINT,
  "updatedAt" BIGINT
);

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  "userName" TEXT,
  amount NUMERIC NOT NULL,
  date TEXT,
  "createdAt" TEXT,
  status TEXT NOT NULL,
  fine NUMERIC DEFAULT 0,
  "billImage" TEXT,
  "bankTransactionId" TEXT,
  "settlementType" TEXT,
  "partialAmount" NUMERIC DEFAULT 0,
  signature TEXT,
  "rejectionReason" TEXT,
  "principalPaymentCount" INTEGER DEFAULT 0,
  "extensionCount" INTEGER DEFAULT 0,
  "partialPaymentCount" INTEGER DEFAULT 0,
  "payosOrderCode" BIGINT,
  "payosCheckoutUrl" TEXT,
  "payosAmount" NUMERIC,
  "payosExpireAt" BIGINT,
  "updatedAt" BIGINT
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  title TEXT,
  message TEXT,
  time TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT
);

-- 4. Config Table (for system settings)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Insert default config values
INSERT INTO config (key, value) VALUES 
('SYSTEM_BUDGET', '0'),
('TOTAL_RANK_PROFIT', '0'),
('TOTAL_LOAN_PROFIT', '0'),
('MONTHLY_STATS', '[]')
ON CONFLICT (key) DO NOTHING;

-- Add missing columns to existing tables (if they don't exist)
DO $$ 
BEGIN 
    -- Users table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosOrderCode') THEN
        ALTER TABLE users ADD COLUMN "payosOrderCode" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosCheckoutUrl') THEN
        ALTER TABLE users ADD COLUMN "payosCheckoutUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosAmount') THEN
        ALTER TABLE users ADD COLUMN "payosAmount" NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payosExpireAt') THEN
        ALTER TABLE users ADD COLUMN "payosExpireAt" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='idNumber') THEN
        ALTER TABLE users ADD COLUMN "idNumber" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='refZalo') THEN
        ALTER TABLE users ADD COLUMN "refZalo" TEXT;
    END IF;

    -- Loans table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosOrderCode') THEN
        ALTER TABLE loans ADD COLUMN "payosOrderCode" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosCheckoutUrl') THEN
        ALTER TABLE loans ADD COLUMN "payosCheckoutUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosAmount') THEN
        ALTER TABLE loans ADD COLUMN "payosAmount" NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='payosExpireAt') THEN
        ALTER TABLE loans ADD COLUMN "payosExpireAt" BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='partialAmount') THEN
        ALTER TABLE loans ADD COLUMN "partialAmount" NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='principalPaymentCount') THEN
        ALTER TABLE loans ADD COLUMN "principalPaymentCount" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='extensionCount') THEN
        ALTER TABLE loans ADD COLUMN "extensionCount" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='partialPaymentCount') THEN
        ALTER TABLE loans ADD COLUMN "partialPaymentCount" INTEGER DEFAULT 0;
    END IF;

    -- Constraints (Safe addition)
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_idNumber_unique UNIQUE ("idNumber");
    EXCEPTION WHEN duplicate_table THEN
        -- Do nothing if constraint already exists
    END;
    
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_refZalo_unique UNIQUE ("refZalo");
    EXCEPTION WHEN duplicate_table THEN
        -- Do nothing if constraint already exists
    END;
END $$;`;
  
  const defaultSettings = {
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    IMGBB_API_KEY: '',
    PAYMENT_ACCOUNT: { bankName: '', bankBin: '', accountNumber: '', accountName: '' },
    PRE_DISBURSEMENT_FEE: '',
    MAX_EXTENSIONS: '',
    UPGRADE_PERCENT: '',
    FINE_RATE: '',
    MAX_FINE_PERCENT: '30',
    MAX_LOAN_PER_CYCLE: '10000000',
    MIN_SYSTEM_BUDGET: '1000000',
    MAX_SINGLE_LOAN_AMOUNT: '10000000',
    PAYOS_CLIENT_ID: '',
    PAYOS_API_KEY: '',
    PAYOS_CHECKSUM_KEY: '',
    JWT_SECRET: '',
    ADMIN_PHONE: '',
    ADMIN_PASSWORD: '',
    PAYMENT_CONTENT_FULL_SETTLEMENT: 'TAT TOAN TAT CA {ID}',
    PAYMENT_CONTENT_PARTIAL_SETTLEMENT: 'TAT TOAN 1 PHAN {ID}',
    PAYMENT_CONTENT_EXTENSION: 'GIA HAN {SLGH}',
    PAYMENT_CONTENT_UPGRADE: 'NANG HANG {TEN HANG}',
    CONTRACT_CODE_FORMAT: 'HD-{MHD}',
    USER_ID_FORMAT: 'US-{RANDOM}',
    LUCKY_SPIN_VOUCHERS: [
      { minProfit: 1000000, voucherValue: 50000 },
      { minProfit: 2000000, voucherValue: 100000 },
      { minProfit: 5000000, voucherValue: 200000 }
    ],
    LUCKY_SPIN_WIN_RATE: '30'
  };

  const [localSettings, setLocalSettings] = useState<any>(() => {
    if (!settings) return defaultSettings;
    return {
      ...defaultSettings,
      ...settings,
      PAYMENT_ACCOUNT: {
        ...defaultSettings.PAYMENT_ACCOUNT,
        ...(settings.PAYMENT_ACCOUNT || {})
      }
    };
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ...defaultSettings,
        ...settings,
        PAYMENT_ACCOUNT: {
          ...defaultSettings.PAYMENT_ACCOUNT,
          ...(settings.PAYMENT_ACCOUNT || {})
        }
      });
    }
  }, [settings]);

  const handleSaveSettings = async (filterKeys?: string[]) => {
    setIsSavingSettings(true);
    setSettingsMessage(null);
    try {
      const changedSettings: any = {};
      
      const allKeys = [
        'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IMGBB_API_KEY', 'PAYMENT_ACCOUNT',
        'PRE_DISBURSEMENT_FEE', 'MAX_EXTENSIONS', 'UPGRADE_PERCENT', 'ENABLE_PAYOS',
        'ENABLE_VIETQR', 'FINE_RATE', 'MAX_FINE_PERCENT', 'MAX_LOAN_PER_CYCLE',
        'MIN_SYSTEM_BUDGET', 'MAX_SINGLE_LOAN_AMOUNT', 'PAYOS_CLIENT_ID', 'PAYOS_API_KEY',
        'PAYOS_CHECKSUM_KEY', 'JWT_SECRET', 'ADMIN_PHONE', 'ADMIN_PASSWORD',
        'PAYMENT_CONTENT_FULL_SETTLEMENT', 'PAYMENT_CONTENT_PARTIAL_SETTLEMENT',
        'PAYMENT_CONTENT_EXTENSION', 'PAYMENT_CONTENT_UPGRADE', 'CONTRACT_CODE_FORMAT',
        'USER_ID_FORMAT', 'ZALO_GROUP_LINK', 'SYSTEM_NOTIFICATION', 'SHOW_SYSTEM_NOTIFICATION',
        'LUCKY_SPIN_PAYMENTS_REQUIRED', 'LUCKY_SPIN_VOUCHERS', 'LUCKY_SPIN_WIN_RATE'
      ];

      const keysToCheck = filterKeys || allKeys;

      keysToCheck.forEach(key => {
        const localVal = localSettings[key];
        const remoteVal = settings?.[key];
        
        if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
          changedSettings[key] = localVal;
        }
      });

      if (Object.keys(changedSettings).length === 0) {
        setSettingsMessage({ type: 'error', text: 'Không có thay đổi nào để lưu' });
        setIsSavingSettings(false);
        return;
      }

      const response = await authenticatedFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify(changedSettings)
      });
      const result = await response.json();
      if (response.ok) {
        setSettingsMessage({ type: 'success', text: result.message || 'Đã lưu cấu hình thành công' });
        if (result.settings) {
          onSettingsUpdate(result.settings);
        } else {
          onSettingsUpdate({ ...settings, ...changedSettings });
        }
      } else {
        setSettingsMessage({ type: 'error', text: result.error || 'Lỗi khi lưu cài đặt' });
      }
    } catch (e) {
      setSettingsMessage({ type: 'error', text: 'Lỗi kết nối khi lưu cài đặt' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCheckBankAccount = async () => {
    if (!localSettings.PAYMENT_ACCOUNT.bankName || !localSettings.PAYMENT_ACCOUNT.accountNumber) {
      toast.error("Vui lòng nhập Ngân hàng và Số tài khoản");
      return;
    }

    setIsCheckingBank(true);
    try {
      // Find bank BIN (Bank Identification Number)
      // This is a simplified list, in a real app you'd fetch this from VietQR
      const banks = [
        { name: "MB Bank", bin: "970422" },
        { name: "Vietcombank", bin: "970436" },
        { name: "Techcombank", bin: "970407" },
        { name: "VietinBank", bin: "970415" },
        { name: "BIDV", bin: "970418" },
        { name: "Agribank", bin: "970405" },
        { name: "VPBank", bin: "970432" },
        { name: "TPBank", bin: "970423" },
        { name: "Sacombank", bin: "970403" },
        { name: "ACB", bin: "970416" }
      ];

      const bank = banks.find(b => b.name === localSettings.PAYMENT_ACCOUNT.bankName);
      if (!bank) {
        toast.warning("Ngân hàng này chưa hỗ trợ tra cứu tự động. Vui lòng nhập tên thủ công.");
        setIsCheckingBank(false);
        return;
      }

      const response = await authenticatedFetch(`/api/check-bank-account?bin=${bank.bin}&accountNumber=${localSettings.PAYMENT_ACCOUNT.accountNumber}`);
      const result = await response.json();
      
      if (response.ok && result.accountName) {
        setLocalSettings({
          ...localSettings,
          PAYMENT_ACCOUNT: {
            ...localSettings.PAYMENT_ACCOUNT,
            accountName: result.accountName
          }
        });
      } else {
        toast.error(result.error || "Không tìm thấy tài khoản ngân hàng");
      }
    } catch (e) {
      toast.error("Lỗi khi tra cứu tài khoản");
    } finally {
      setIsCheckingBank(false);
    }
  };

  const handleResetExecute = () => {
    onReset();
    setShowResetConfirm(false);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setImportMessage(null);
    try {
      const response = await authenticatedFetch('/api/migrate', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setImportMessage({ type: 'success', text: result.message });
      } else {
        setImportMessage({ type: 'error', text: result.message });
      }
    } catch (e) {
      setImportMessage({ type: 'error', text: 'Lỗi kết nối khi kiểm tra cấu trúc' });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await authenticatedFetch('/api/data?isAdmin=true');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      // Remove sensitive or unnecessary fields if needed
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.26'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ndv_money_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          // Basic validation
          if (!data.users || !data.loans) {
            throw new Error('Định dạng file không hợp lệ');
          }
          
          const response = await authenticatedFetch('/api/import', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi khi nhập dữ liệu');
          }

          setImportMessage({ type: 'success', text: 'Nhập dữ liệu thành công! Hệ thống đang cập nhật...' });
          setTimeout(() => onImportSuccess(), 1500);
        } catch (err: any) {
          setImportMessage({ type: 'error', text: err.message || 'Lỗi khi xử lý file' });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      setIsImporting(false);
      setImportMessage({ type: 'error', text: 'Lỗi khi đọc file' });
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRankUpdate = (index: number, field: string, value: any) => {
    const newRanks = [...(localSettings.RANK_CONFIG || [])];
    if (field === 'features') {
      newRanks[index] = { ...newRanks[index], features: typeof value === 'string' ? value.split(',').map((s: string) => s.trim()) : value };
    } else {
      newRanks[index] = { ...newRanks[index], [field]: value };
    }
    setLocalSettings({ ...localSettings, RANK_CONFIG: newRanks });
  };

  return (
    <div className="w-full bg-black px-5 pb-10 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-center justify-between pt-8 mb-6 px-1">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
          CÀI ĐẶT HỆ THỐNG
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="bg-red-600/10 border border-red-500/20 text-red-500 font-black px-3 py-2 rounded-xl text-[8px] uppercase tracking-widest hover:bg-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={12} />
            THỰC THI RESET
          </button>
          <button 
            onClick={handleMigrate}
            disabled={isMigrating}
            className="bg-blue-600/10 border border-blue-500/20 text-blue-500 font-black px-3 py-2 rounded-xl text-[8px] uppercase tracking-widest hover:bg-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isMigrating ? <Loader2 className="animate-spin" size={12} /> : <Database size={12} />}
            KIỂM TRA DB
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'settings' ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-900/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Settings size={14} />
          Cấu hình hệ thống
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'data' ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-900/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Database size={14} />
          Quản lý dữ liệu
        </button>
      </div>

      {activeTab === 'data' ? (
        /* Data Management Section */
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6 mb-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2.5">
            <Database className="text-[#ff8c00]" size={18} />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Quản lý dữ liệu</h4>
          </div>

          {/* Backup & Restore */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              </div>
              <div className="text-center">
                <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Xuất dữ liệu</h5>
                <p className="text-[7px] font-bold text-gray-500 uppercase mt-1">Sao lưu JSON</p>
              </div>
            </button>

            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              </div>
              <div className="text-center">
                <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Nhập dữ liệu</h5>
                <p className="text-[7px] font-bold text-gray-500 uppercase mt-1">Khôi phục từ file</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </button>
          </div>

          {importMessage && (
            <div className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              importMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              {importMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {importMessage.text}
            </div>
          )}
        </div>
      ) : (
        /* Advanced Settings Section */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {/* 1. Connection & Security Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('connection')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <Shield size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Kết nối & Bảo mật Admin</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Database, API & Tài khoản Admin</p>
                  </div>
                </div>
                {expandedSections.connection ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>
              
              {expandedSections.connection && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Row 1: Supabase */}
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Supabase URL</label>
                    <input 
                      type="text" 
                      value={localSettings.SUPABASE_URL || ''}
                      onChange={(e) => setLocalSettings({...localSettings, SUPABASE_URL: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Service Role Key</label>
                    <input 
                      type="text" 
                      value={localSettings.SUPABASE_SERVICE_ROLE_KEY || ''}
                      onChange={(e) => setLocalSettings({...localSettings, SUPABASE_SERVICE_ROLE_KEY: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>

                  {/* Row 2: ImgBB & JWT */}
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">ImgBB API Key</label>
                    <input 
                      type="text" 
                      value={localSettings.IMGBB_API_KEY || ''}
                      onChange={(e) => setLocalSettings({...localSettings, IMGBB_API_KEY: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">JWT Secret Key</label>
                    <input 
                      type="text" 
                      value={localSettings.JWT_SECRET || ''}
                      onChange={(e) => setLocalSettings({...localSettings, JWT_SECRET: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>

                  {/* Row 3: PayOS Client & API */}
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">PayOS Client ID</label>
                    <input 
                      type="text" 
                      value={localSettings.PAYOS_CLIENT_ID || ''}
                      onChange={(e) => setLocalSettings({...localSettings, PAYOS_CLIENT_ID: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">PayOS API Key</label>
                    <input 
                      type="text" 
                      value={localSettings.PAYOS_API_KEY || ''}
                      onChange={(e) => setLocalSettings({...localSettings, PAYOS_API_KEY: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>

                  {/* Row 4: PayOS Checksum & Zalo Link */}
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">PayOS Checksum</label>
                    <input 
                      type="text" 
                      value={localSettings.PAYOS_CHECKSUM_KEY || ''}
                      onChange={(e) => setLocalSettings({...localSettings, PAYOS_CHECKSUM_KEY: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Link Nhóm Zalo</label>
                    <input 
                      type="text" 
                      value={localSettings.ZALO_GROUP_LINK || ''}
                      onChange={(e) => setLocalSettings({...localSettings, ZALO_GROUP_LINK: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                      placeholder="https://zalo.me/g/..."
                    />
                  </div>

                  {/* Row 5: Admin Account */}
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">SĐT Admin</label>
                    <input 
                      type="text" 
                      value={localSettings.ADMIN_PHONE || ''}
                      onChange={(e) => setLocalSettings({...localSettings, ADMIN_PHONE: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Mật khẩu Admin</label>
                    <input 
                      type="text" 
                      value={localSettings.ADMIN_PASSWORD || ''}
                      onChange={(e) => setLocalSettings({...localSettings, ADMIN_PASSWORD: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <button 
                      onClick={() => handleSaveSettings(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IMGBB_API_KEY', 'JWT_SECRET', 'PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY', 'ZALO_GROUP_LINK', 'ADMIN_PHONE', 'ADMIN_PASSWORD'])}
                      disabled={isSavingSettings}
                      className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                      LƯU & ÁP DỤNG KẾT NỐI
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Format Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('formats')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <Hash size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full border-2 border-black"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Định dạng hệ thống</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Mã số & Quy tắc</p>
                  </div>
                </div>
                {expandedSections.formats ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>

              {expandedSections.formats && (
                <div className="space-y-5 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Định dạng Mã Hợp Đồng</label>
                      <input 
                        type="text" 
                        value={localSettings.CONTRACT_CODE_FORMAT || ''}
                        onChange={(e) => setLocalSettings({...localSettings, CONTRACT_CODE_FORMAT: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        placeholder="Ví dụ: HD-{MHD}"
                      />
                      <p className="text-[7px] text-gray-500 italic">Sử dụng {'{MHD}'} để tạo mã ngẫu nhiên.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Định dạng ID User</label>
                      <input 
                        type="text" 
                        value={localSettings.USER_ID_FORMAT || ''}
                        onChange={(e) => setLocalSettings({...localSettings, USER_ID_FORMAT: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        placeholder="Ví dụ: US-{RANDOM}"
                      />
                      <p className="text-[7px] text-gray-500 italic">Sử dụng {'{RANDOM}'} để tạo mã ngẫu nhiên.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveSettings(['CONTRACT_CODE_FORMAT', 'USER_ID_FORMAT'])}
                    disabled={isSavingSettings}
                    className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                    LƯU & ÁP DỤNG ĐỊNH DẠNG
                  </button>
                </div>
              )}
            </div>

            {/* 3. Rank & Limits Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('ranks')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <TrendingUp size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full border-2 border-black"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Cấu hình Hạng & Hạn mức</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Quản lý cấp bậc & Hạn mức vay</p>
                  </div>
                </div>
                {expandedSections.ranks ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>

              {expandedSections.ranks && (
                <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    {localSettings.RANK_CONFIG?.map((rank: any, idx: number) => (
                      <div key={rank.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rank.color }}></div>
                            <h6 className="text-[9px] font-black text-white uppercase tracking-widest">{rank.name}</h6>
                          </div>
                          <span className="text-[7px] font-bold text-gray-500 uppercase">ID: {rank.id}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Tên hiển thị</label>
                            <input 
                              type="text" 
                              value={rank.name}
                              onChange={(e) => handleRankUpdate(idx, 'name', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Màu sắc (Hex)</label>
                            <input 
                              type="text" 
                              value={rank.color}
                              onChange={(e) => handleRankUpdate(idx, 'color', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Hạn mức tối thiểu</label>
                            <input 
                              type="text" 
                              value={formatNumberWithDots(rank.minLimit)}
                              onChange={(e) => handleRankUpdate(idx, 'minLimit', parseNumberFromDots(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Hạn mức tối đa</label>
                            <input 
                              type="text" 
                              value={formatNumberWithDots(rank.maxLimit)}
                              onChange={(e) => handleRankUpdate(idx, 'maxLimit', parseNumberFromDots(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Đặc quyền (Cách nhau bằng dấu phẩy)</label>
                            <textarea 
                              value={rank.features?.join(', ')}
                              onChange={(e) => handleRankUpdate(idx, 'features', e.target.value)}
                              rows={2}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleSaveSettings(['RANK_CONFIG'])}
                    disabled={isSavingSettings}
                    className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                    LƯU CẤU HÌNH HẠNG
                  </button>
                </div>
              )}
            </div>

            {/* 4. Payment & Content Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('payment')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <CreditCard size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Thanh toán & Nội dung</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">PayOS & VietQR</p>
                  </div>
                </div>
                {expandedSections.payment ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>

              {expandedSections.payment && (
                <div className="space-y-5 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Payment Methods Toggle */}
                  <div className="space-y-4">
                    <h6 className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">Phương thức thanh toán</h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${localSettings.ENABLE_PAYOS ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            <Shield size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">Thanh toán PayOS</p>
                            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Tự động 24/7</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (localSettings.ENABLE_PAYOS && !localSettings.ENABLE_VIETQR) {
                              toast.warning("Phải có ít nhất một phương thức thanh toán được bật.");
                              return;
                            }
                            setLocalSettings({...localSettings, ENABLE_PAYOS: !localSettings.ENABLE_PAYOS});
                          }}
                          className={`w-10 h-5 rounded-full relative transition-all duration-300 ${localSettings.ENABLE_PAYOS ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${localSettings.ENABLE_PAYOS ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${localSettings.ENABLE_VIETQR ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            <CreditCard size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">Thanh toán VietQR</p>
                            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Chuyển khoản thủ công</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (localSettings.ENABLE_VIETQR && !localSettings.ENABLE_PAYOS) {
                              toast.warning("Phải có ít nhất một phương thức thanh toán được bật.");
                              return;
                            }
                            setLocalSettings({...localSettings, ENABLE_VIETQR: !localSettings.ENABLE_VIETQR});
                          }}
                          className={`w-10 h-5 rounded-full relative transition-all duration-300 ${localSettings.ENABLE_VIETQR ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${localSettings.ENABLE_VIETQR ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Account */}
                  {localSettings.ENABLE_VIETQR && (
                    <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in duration-300">
                      <h6 className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">Tài khoản nhận thanh toán</h6>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <BankSearchableSelect 
                            value={localSettings.PAYMENT_ACCOUNT?.bankName || ''}
                            onChange={(bankName, bin) => setLocalSettings({
                              ...localSettings, 
                              PAYMENT_ACCOUNT: { ...(localSettings.PAYMENT_ACCOUNT || {}), bankName, bankBin: bin }
                            })}
                            className="w-full"
                          />
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={localSettings.PAYMENT_ACCOUNT?.accountNumber || ''}
                            onChange={(e) => setLocalSettings({
                              ...localSettings, 
                              PAYMENT_ACCOUNT: { ...(localSettings.PAYMENT_ACCOUNT || {}), accountNumber: e.target.value.replace(/\D/g, '') }
                            })}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[9px] font-bold text-white outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={localSettings.PAYMENT_ACCOUNT?.accountName || ''}
                            onChange={(e) => setLocalSettings({
                              ...localSettings, 
                              PAYMENT_ACCOUNT: { ...(localSettings.PAYMENT_ACCOUNT || {}), accountName: e.target.value.toUpperCase() }
                            })}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[9px] font-black text-[#ff8c00] uppercase outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Content */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h6 className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">Nội dung thanh toán PayOS</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tất toán tất cả</label>
                        <input 
                          type="text" 
                          value={localSettings.PAYMENT_CONTENT_FULL_SETTLEMENT || ''}
                          onChange={(e) => setLocalSettings({...localSettings, PAYMENT_CONTENT_FULL_SETTLEMENT: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        />
                        <p className="text-[7px] text-gray-500 italic">Sử dụng {'{ID}'}, {'{MHD}'} hoặc {'{USER}'} để tạo nội dung.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tất toán 1 phần</label>
                        <input 
                          type="text" 
                          value={localSettings.PAYMENT_CONTENT_PARTIAL_SETTLEMENT || ''}
                          onChange={(e) => setLocalSettings({...localSettings, PAYMENT_CONTENT_PARTIAL_SETTLEMENT: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        />
                        <p className="text-[7px] text-gray-500 italic">Sử dụng {'{ID}'}, {'{MHD}'}, {'{SLTTMP}'} hoặc {'{USER}'} để tạo nội dung.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Gia hạn</label>
                        <input 
                          type="text" 
                          value={localSettings.PAYMENT_CONTENT_EXTENSION || ''}
                          onChange={(e) => setLocalSettings({...localSettings, PAYMENT_CONTENT_EXTENSION: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        />
                        <p className="text-[7px] text-gray-500 italic">Sử dụng {'{ID}'}, {'{MHD}'}, {'{SLGH}'} hoặc {'{USER}'} để tạo nội dung.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nâng hạng</label>
                        <input 
                          type="text" 
                          value={localSettings.PAYMENT_CONTENT_UPGRADE || ''}
                          onChange={(e) => setLocalSettings({...localSettings, PAYMENT_CONTENT_UPGRADE: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all"
                        />
                        <p className="text-[7px] text-gray-500 italic">Sử dụng {'{TEN HANG}'} hoặc {'{USER}'} để tạo nội dung.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveSettings(['ENABLE_PAYOS', 'ENABLE_VIETQR', 'PAYMENT_ACCOUNT', 'PAYMENT_CONTENT_FULL_SETTLEMENT', 'PAYMENT_CONTENT_PARTIAL_SETTLEMENT', 'PAYMENT_CONTENT_EXTENSION', 'PAYMENT_CONTENT_UPGRADE'])}
                    disabled={isSavingSettings}
                    className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                    LƯU & ÁP DỤNG THANH TOÁN
                  </button>
                </div>
              )}
            </div>

            {/* 5. Lucky Spin Configuration Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('luckyspin')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <Zap size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Vòng quay may mắn</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Cấu hình phần thưởng & Tỉ lệ</p>
                  </div>
                </div>
                {expandedSections.luckyspin ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>

              {expandedSections.luckyspin && (
                <div className="space-y-5 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tỉ lệ trúng Voucher (%)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0"
                          max="100"
                          value={localSettings.LUCKY_SPIN_WIN_RATE || '30'}
                          onChange={(e) => setLocalSettings({...localSettings, LUCKY_SPIN_WIN_RATE: e.target.value})}
                          className="flex-1 accent-[#ff8c00]"
                        />
                        <span className="text-[10px] font-black text-[#ff8c00] w-8">{localSettings.LUCKY_SPIN_WIN_RATE}%</span>
                      </div>
                      <p className="text-[7px] text-gray-500 italic">Tỉ lệ người chơi trúng Voucher (phần còn lại là "May mắn lần sau").</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h6 className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">Cấu hình Voucher theo Lợi nhuận</h6>
                      <button 
                        onClick={() => {
                          const vouchers = [...(localSettings.LUCKY_SPIN_VOUCHERS || [])];
                          vouchers.push({ minProfit: 0, voucherValue: 0 });
                          setLocalSettings({...localSettings, LUCKY_SPIN_VOUCHERS: vouchers});
                        }}
                        className="text-[7px] font-black text-[#ff8c00] uppercase tracking-widest hover:underline"
                      >
                        + Thêm mốc
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {(localSettings.LUCKY_SPIN_VOUCHERS || []).map((v: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                          <div className="flex-1 space-y-1">
                            <label className="text-[6px] font-black text-gray-500 uppercase">Lợi nhuận tối thiểu</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={formatNumberWithDots(v.minProfit)}
                              onChange={(e) => {
                                const vouchers = [...localSettings.LUCKY_SPIN_VOUCHERS];
                                vouchers[idx].minProfit = parseNumberFromDots(e.target.value);
                                setLocalSettings({...localSettings, LUCKY_SPIN_VOUCHERS: vouchers});
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-[9px] font-bold text-white outline-none"
                              placeholder="Lợi nhuận"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[6px] font-black text-gray-500 uppercase">Giá trị Voucher</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={formatNumberWithDots(v.voucherValue)}
                              onChange={(e) => {
                                const vouchers = [...localSettings.LUCKY_SPIN_VOUCHERS];
                                vouchers[idx].voucherValue = parseNumberFromDots(e.target.value);
                                setLocalSettings({...localSettings, LUCKY_SPIN_VOUCHERS: vouchers});
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-[9px] font-bold text-[#ff8c00] outline-none"
                              placeholder="Voucher"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const vouchers = localSettings.LUCKY_SPIN_VOUCHERS.filter((_: any, i: number) => i !== idx);
                              setLocalSettings({...localSettings, LUCKY_SPIN_VOUCHERS: vouchers});
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveSettings(['LUCKY_SPIN_VOUCHERS', 'LUCKY_SPIN_WIN_RATE'])}
                    disabled={isSavingSettings}
                    className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                    LƯU CẤU HÌNH VÒNG QUAY
                  </button>
                </div>
              )}
            </div>

            {/* 6. Utilities & Tools Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('tools')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <Wrench size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full border-2 border-black"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Tiện ích & Công cụ</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Zalo & Hệ thống</p>
                  </div>
                </div>
                {expandedSections.tools ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>

              {expandedSections.tools && (
                <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => copyToClipboard(sqlSchema, 'sql')}
                      className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                    >
                    <div className="flex items-center gap-3">
                      <Database size={14} className="text-[#ff8c00]" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Lấy mã SQL</span>
                    </div>
                    {copiedField === 'sql' ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    )}
                  </button>

                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/api/payment/webhook`, 'webhook')}
                    className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw size={14} className="text-[#ff8c00]" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Lấy Webhook</span>
                    </div>
                    {copiedField === 'webhook' ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    )}
                  </button>

                  <button
                    onClick={() => copyToClipboard(window.location.origin, 'appurl')}
                    className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={14} className="text-[#ff8c00]" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Lấy APP URL</span>
                    </div>
                    {copiedField === 'appurl' ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Fees & Limits Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('fees')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <TrendingUp size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Phí & Hạn mức</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Lãi suất & Giới hạn</p>
                  </div>
                </div>
                {expandedSections.fees ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>
              
              {expandedSections.fees && (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Row 1 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Phí giải ngân (%)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.PRE_DISBURSEMENT_FEE)}
                        onChange={(e) => setLocalSettings({...localSettings, PRE_DISBURSEMENT_FEE: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Gia hạn tối đa</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.MAX_EXTENSIONS)}
                        onChange={(e) => setLocalSettings({...localSettings, MAX_EXTENSIONS: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Phí nâng hạng (%)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.UPGRADE_PERCENT)}
                        onChange={(e) => setLocalSettings({...localSettings, UPGRADE_PERCENT: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Phí quá hạn (%/ngày)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={localSettings.FINE_RATE || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                            setLocalSettings({...localSettings, FINE_RATE: val});
                          }
                        }}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    {/* Row 3 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Phạt tối đa (%)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.MAX_FINE_PERCENT)}
                        onChange={(e) => setLocalSettings({...localSettings, MAX_FINE_PERCENT: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Hạn mức chu kỳ</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.MAX_LOAN_PER_CYCLE)}
                        onChange={(e) => setLocalSettings({...localSettings, MAX_LOAN_PER_CYCLE: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>

                    {/* Row 4 */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Ngân sách tối thiểu</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.MIN_SYSTEM_BUDGET)}
                        onChange={(e) => setLocalSettings({...localSettings, MIN_SYSTEM_BUDGET: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[7px] font-black text-gray-500 uppercase tracking-widest px-1">Hạn mức vay tối đa</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumberWithDots(localSettings.MAX_SINGLE_LOAN_AMOUNT)}
                        onChange={(e) => setLocalSettings({...localSettings, MAX_SINGLE_LOAN_AMOUNT: parseNumberFromDots(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:border-[#ff8c00]/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveSettings(['PRE_DISBURSEMENT_FEE', 'MAX_EXTENSIONS', 'UPGRADE_PERCENT', 'FINE_RATE', 'MAX_FINE_PERCENT', 'MAX_LOAN_PER_CYCLE', 'MIN_SYSTEM_BUDGET', 'MAX_SINGLE_LOAN_AMOUNT'])}
                    disabled={isSavingSettings}
                    className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                    LƯU & ÁP DỤNG PHÍ & HẠN MỨC
                  </button>
                </>
              )}
            </div>

            {/* 7. System Notification Card */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
              <button 
                onClick={() => toggleSection('notification')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center">
                      <MessageCircle size={16} className="text-[#ff8c00]" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h5 className="text-[9px] font-black text-white uppercase tracking-widest">THÔNG BÁO HỆ THỐNG</h5>
                    <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">Popup thông báo toàn hệ thống</p>
                  </div>
                </div>
                {expandedSections.notification ? <ChevronUp size={14} className="text-[#ff8c00]" /> : <ChevronDown size={14} className="text-gray-600" />}
              </button>
              
              {expandedSections.notification && (
                <>
                  <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="space-y-0.5">
                        <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Bật thông báo Popup</h5>
                        <p className="text-[7px] font-bold text-gray-500 uppercase">Hiển thị popup cho người dùng khi đăng nhập</p>
                      </div>
                      <button 
                        onClick={() => setLocalSettings({...localSettings, SHOW_SYSTEM_NOTIFICATION: !localSettings.SHOW_SYSTEM_NOTIFICATION})}
                        className={`w-12 h-6 rounded-full transition-all relative ${localSettings.SHOW_SYSTEM_NOTIFICATION ? 'bg-[#ff8c00]' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.SHOW_SYSTEM_NOTIFICATION ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Nội dung thông báo</label>
                      <textarea 
                        value={localSettings.SYSTEM_NOTIFICATION || ''}
                        onChange={(e) => setLocalSettings({...localSettings, SYSTEM_NOTIFICATION: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-[11px] font-bold text-white focus:border-[#ff8c00] outline-none transition-all min-h-[120px] resize-none leading-relaxed"
                        placeholder="Nhập nội dung thông báo cho tất cả người dùng..."
                      />
                      <p className="text-[7px] text-gray-500 italic px-1">Thông báo này sẽ hiển thị dưới dạng Popup cho tất cả User sau khi đăng nhập nếu tính năng được Bật.</p>
                    </div>

                    <button 
                      onClick={() => handleSaveSettings(['SYSTEM_NOTIFICATION', 'SHOW_SYSTEM_NOTIFICATION'])}
                      disabled={isSavingSettings}
                      className="w-full bg-[#ff8c00]/10 border border-[#ff8c00]/20 hover:bg-[#ff8c00]/20 text-[#ff8c00] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingSettings ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                      LƯU & ÁP DỤNG THÔNG BÁO
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {settingsMessage && (
            <div className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              settingsMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              {settingsMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {settingsMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-10 text-center opacity-30">
        <p className="text-[7px] font-black text-gray-500 uppercase tracking-[0.3em]">System Kernel v1.26 PRO</p>
      </div>

      {/* Popup xác nhận Reset hệ thống */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-[#111111] border border-red-500/20 w-full max-w-sm rounded-3xl p-6 space-y-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                 <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">RESET HỆ THỐNG?</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed px-3">
                  Thao tác này sẽ <span className="text-red-500 font-black">XÓA VĨNH VIỄN</span> toàn bộ khách hàng, lịch sử vay và <span className="text-red-500 font-black">dòng tiền</span>. Ngân sách sẽ quay về <span className="text-white font-black">30.000.000 đ</span>.
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
                 onClick={handleResetExecute}
                 className="flex-1 py-3.5 bg-red-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
               >
                 <Check size={12} /> ĐỒNG Ý RESET
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem;
