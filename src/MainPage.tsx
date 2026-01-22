
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, LocationState } from '../types';
import MicToggleButton from '../components/MicToggleButton';
import ChatSection from '../components/ChatSection';
import { GoogleGenAI, Modality } from '@google/genai';

interface MainPageProps {
  nickname: string;
  onLogout: () => void;
}

const GRID_PRECISION = 0.0025; 

const MainPage: React.FC<MainPageProps> = ({ nickname, onLogout }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [location, setLocation] = useState<LocationState>({ 
    lat: null, 
    lng: null, 
    isInsideRange: false, 
    roomId: null,
    accuracy: null 
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const calculateRoomId = (lat: number, lng: number) => {
    const roundedLat = Math.round(lat / GRID_PRECISION) * GRID_PRECISION;
    const roundedLng = Math.round(lng / GRID_PRECISION) * GRID_PRECISION;
    return `room_${roundedLat.toFixed(4)}_${roundedLng.toFixed(4)}`;
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newRoomId = calculateRoomId(latitude, longitude);
        
        setLocation(prev => ({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          roomId: newRoomId,
          isInsideRange: true 
        }));
        setIsSyncing(false);
      },
      (err) => {
        console.error("Location error:", err);
        setLocation(prev => ({ ...prev, error: err.message, isInsideRange: false }));
        setIsMuted(true);
        setIsSyncing(false);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggleMic = async () => {
    if (!location.isInsideRange || isSyncing) return;

    // iOS Safari: Resume AudioContext on user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsMuted(!isMuted);
  };

  const sendMessage = (text: string) => {
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: nickname,
      text,
      timestamp: new Date(),
      isSelf: true
    };
    setMessages(prev => [...prev, newMsg]);

    if (text.length > 2) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'جار قريب',
          text: 'وصلت رسالتك في غرفتنا: ' + (location.roomId || 'مجهولة'),
          timestamp: new Date(),
          isSelf: false
        }]);
      }, 1500);
    }
  };

  const setupLiveSession = useCallback(async () => {
    if (!location.roomId) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
             console.debug('Janbak Voice Connected to room:', location.roomId);
             setIsLiveActive(true);
          },
          onmessage: async (message) => {},
          onerror: (e) => console.error(e),
          onclose: () => setIsLiveActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `أنت مساعد تطبيق "جنبك" الصوتي. الغرفة الحالية: ${location.roomId}. المستخدم: ${nickname}. النطاق الجغرافي: 250 متر.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Voice connection failed", e);
    }
  }, [nickname, location.roomId]);

  useEffect(() => {
    if (!isMuted && !isLiveActive && location.roomId) {
      setupLiveSession();
    } else if (isMuted && isLiveActive) {
      sessionRef.current?.close();
      setIsLiveActive(false);
    }
  }, [isMuted, isLiveActive, setupLiveSession, location.roomId]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">ج</div>
          <div>
            <h2 className="font-black text-slate-800 leading-tight">جنبك</h2>
            <div className="flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : location.isInsideRange ? 'bg-green-500' : 'bg-red-500'}`}></span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                 {isSyncing ? 'جاري التحديد...' : location.isInsideRange ? 'داخل النطاق' : 'لا توجد صلاحية'}
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">اسمك</p>
            <p className="font-black text-slate-700 text-sm">{nickname}</p>
          </div>
          <button onClick={onLogout} className="p-2.5 bg-slate-100 rounded-xl text-slate-500 hover:text-red-500 transition-all active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {isSyncing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-indigo-600 font-black text-sm animate-pulse uppercase tracking-widest">جاري تحديد منطقتك...</p>
          </div>
        )}

        {!location.isInsideRange && !isSyncing && (
          <div className="absolute inset-0 bg-slate-50/95 z-40 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-800">تعذر تحديد الموقع</h4>
              <p className="text-slate-500 text-sm font-medium">يتطلب "جنبك" صلاحية الموقع الدقيق والعمل عبر HTTPS ليعمل بشكل صحيح.</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">تحديث الصفحة</button>
          </div>
        )}

        <div className="flex flex-col items-center gap-10 w-full max-w-xs">
          <div className="text-center space-y-3">
            <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
              نطاق جيرانك (250م)
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {isMuted ? 'المايك مكتوم' : 'أنت مباشر'}
            </h3>
            <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">
              {isMuted ? 'اضغط لتشغيل المايك والحديث مع الغرفة' : 'جيرانك يمكنهم سماعك بوضوح الآن'}
            </p>
          </div>

          <MicToggleButton 
            isActive={!isMuted} 
            onClick={toggleMic} 
            disabled={!location.isInsideRange || isSyncing}
          />

          <div className="flex items-center gap-2 py-2 px-5 bg-white rounded-full shadow-sm border border-slate-100">
             <div className={`w-2.5 h-2.5 rounded-full ${!isMuted ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`}></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
               {isMuted ? 'جاهز للاتصال' : 'بث مباشر نشط'}
             </span>
          </div>
        </div>
      </main>

      <div className="shrink-0">
        <ChatSection 
          messages={messages} 
          onSendMessage={sendMessage} 
          disabled={!location.isInsideRange || isSyncing}
        />
      </div>
    </div>
  );
};

export default MainPage;
