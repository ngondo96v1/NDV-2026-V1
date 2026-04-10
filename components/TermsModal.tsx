
import React from 'react';
import { X, ShieldCheck, FileText, AlertCircle, Lock } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[90dvh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#ff8c00]/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">Điều khoản sử dụng</h3>
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Cập nhật: 16/03/2026</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#ff8c00]">
              <ShieldCheck size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">1. QUY ĐỊNH CHUNG</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Bằng việc đăng ký tài khoản tại NDV Money, khách hàng (sau đây gọi là "Bên vay") thừa nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được quy định tại đây. NDV Money có quyền thay đổi nội dung điều khoản mà không cần thông báo trước, các thay đổi sẽ có hiệu lực ngay khi được cập nhật trên ứng dụng.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#ff8c00]">
              <Lock size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">2. BẢO MẬT THÔNG TIN</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              NDV Money cam kết bảo mật tuyệt đối thông tin cá nhân, hình ảnh CCCD và dữ liệu giao dịch của khách hàng. Chúng tôi chỉ sử dụng thông tin này cho mục đích xác thực danh tính, đánh giá tín nhiệm và thực hiện các thủ tục giải ngân theo yêu cầu của khách hàng. Thông tin sẽ không được cung cấp cho bên thứ ba trừ khi có yêu cầu từ cơ quan pháp luật có thẩm quyền.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#ff8c00]">
              <AlertCircle size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">3. TRÁCH NHIỆM CỦA KHÁCH HÀNG</h4>
            </div>
            <ul className="space-y-2.5">
              <li className="flex gap-2.5">
                <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full mt-1.5 shrink-0"></div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Cung cấp thông tin cá nhân, số điện thoại Zalo và hình ảnh CCCD chính chủ, rõ nét, không qua chỉnh sửa.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full mt-1.5 shrink-0"></div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Chịu trách nhiệm hoàn toàn trước pháp luật về tính chính xác của thông tin đã cung cấp. Mọi hành vi gian lận thông tin sẽ bị từ chối giải ngân vĩnh viễn.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="w-1.5 h-1.5 bg-[#ff8c00] rounded-full mt-1.5 shrink-0"></div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Thực hiện nghĩa vụ thanh toán khoản vay đúng hạn theo thỏa thuận trên hợp đồng điện tử.</p>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#ff8c00]">
              <ShieldCheck size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">4. QUY TRÌNH GIẢI NGÂN & PHÍ</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Khoản vay sẽ được giải ngân vào tài khoản ngân hàng chính chủ của khách hàng sau khi hồ sơ được phê duyệt. Khách hàng đồng ý với các điều khoản và quy định được hiển thị minh bạch tại thời điểm đăng ký khoản vay. Hệ thống sẽ thực hiện giải ngân nhanh chóng ngay khi hợp đồng được xác thực thành công.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle size={14} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">5. XỬ LÝ VI PHẠM</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Trong trường hợp khách hàng chậm thanh toán, hệ thống sẽ tự động áp dụng phí phạt quá hạn (không quá 30% giá trị khoản vay) và thực hiện hạ hạng thành viên. NDV Money có quyền chuyển hồ sơ cho bộ phận thu hồi nợ hoặc cơ quan pháp luật nếu khách hàng có dấu hiệu cố tình chiếm đoạt tài sản.
            </p>
          </section>

          <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/10 rounded-2xl p-4">
            <p className="text-[9px] font-bold text-[#ff8c00] text-center italic">
              "NDV Money - Uy tín tạo niềm tin, đồng hành cùng bạn."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 shrink-0 bg-[#111111]">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-xl shadow-orange-950/20"
          >
            Tôi đã hiểu và đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
