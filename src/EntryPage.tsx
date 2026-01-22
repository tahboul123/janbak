
import React, { useState, useEffect } from 'react';

interface EntryPageProps {
  onLogin: (nickname: string) => void;
}

const EntryPage: React.FC<EntryPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInsecure, setIsInsecure] = useState(false);

  useEffect(() => {
    // التحقق من بيئة التشغيل (يجب أن تكون HTTPS أو Localhost)
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setIsInsecure(true);
    }
  }, []);

  const requestPermissions = async () => {
    try {
      // 1. طلب الموقع
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      // 2. طلب المايكروفون
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // إيقاف التجربة فور الحصول على الإذن

      return true;
    } catch (err) {
      console.error("Permission denied:", err);
      setError("يجب السماح بالوصول للموقع والمايكروفون ليعمل تطبيق جنبك.");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isRequesting) return;

    setError(null);
    setIsRequesting(true);

    const granted = await requestPermissions();
    if (granted) {
      onLogin(name.trim());
    } else {
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-500 to-indigo-700">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-8 relative overflow-hidden">
        {isInsecure && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[10px] py-1 text-center font-bold">
            بيئة غير آمنة (HTTP): الصلاحيات قد لا تعمل. استخدم HTTPS.
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">جنبك</h1>
          <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">اسمع اللي جنبك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-right">
            <label htmlFor="nickname" className="block text-xs font-black text-slate-400 mr-1 uppercase tracking-tighter">أدخل اسمك المستعار</label>
            <input
              id="nickname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد"
              disabled={isRequesting}
              className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all duration-200 text-lg text-center font-bold"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-xs text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isRequesting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-5 rounded-2xl shadow-xl transform active:scale-95 transition-all duration-150 text-xl flex items-center justify-center gap-3"
          >
            {isRequesting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري تفعيل الحساسات...</span>
              </>
            ) : (
              'دخول'
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          لا تسجيل • لا حسابات • خصوصية تامة
        </div>
      </div>
    </div>
  );
};

export default EntryPage;
