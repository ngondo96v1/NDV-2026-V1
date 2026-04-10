
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Bank, fetchBanks, MAJOR_BANKS } from '../services/bankService';

interface BankSearchableSelectProps {
  value: string;
  onChange: (bankName: string, bin: string) => void;
  placeholder?: string;
  className?: string;
}

const BankSearchableSelect: React.FC<BankSearchableSelectProps> = ({ value, onChange, placeholder = "Chọn ngân hàng", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBanks = async () => {
      setIsLoading(true);
      const fetchedBanks = await fetchBanks();
      if (fetchedBanks.length > 0) {
        setBanks(fetchedBanks);
      } else {
        // Fallback to major banks if API fails
        setBanks(MAJOR_BANKS.map(b => ({ ...b, id: 0, code: b.shortName, logo: '', transferSupported: 1, lookupSupported: 1, short_name: b.shortName, support: 1, isTransfer: 1, swift_code: '' } as Bank)));
      }
      setIsLoading(false);
    };
    loadBanks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bank.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (bank: Bank) => {
    onChange(bank.shortName || bank.name, bank.bin);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[9px] font-bold text-white outline-none cursor-pointer flex items-center justify-between"
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown size={12} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-[#111111] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-white/5 flex items-center gap-2">
            <Search size={12} className="text-gray-500" />
            <input 
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm ngân hàng..."
              className="flex-1 bg-transparent text-[9px] font-bold text-white outline-none placeholder-gray-700"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                <X size={12} className="text-gray-500" />
              </button>
            )}
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-[8px] font-black text-gray-500 uppercase tracking-widest">Đang tải...</div>
            ) : filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <div 
                  key={bank.bin + bank.name}
                  onClick={() => handleSelect(bank)}
                  className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                >
                  {bank.logo && <img src={bank.logo} alt={bank.shortName} className="w-6 h-6 object-contain rounded bg-white p-0.5" referrerPolicy="no-referrer" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-white truncate uppercase">{bank.name}</p>
                    <p className="text-[7px] font-bold text-gray-500 uppercase">{bank.shortName} - {bank.bin}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-[8px] font-black text-gray-500 uppercase tracking-widest">Không tìm thấy ngân hàng</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankSearchableSelect;
