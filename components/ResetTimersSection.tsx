'use client';
import { useEffect, useState, useRef } from 'react';
import ArchonHuntSection from '@/components/ArchonHuntSection';

export default function ResetTimersSection() {
  const [timers, setTimers] = useState({
    weekly: '--',
    daily: '--',
    baro: '--',
    baroLocation: ''
  });

  const [isArchonPopupOpen, setIsArchonPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rawData: any = null;

    async function fetchTimersData() {
      try {
        const res = await fetch('https://api.warframestat.us/pc');
        rawData = await res.json();
        updateCalculations();
      } catch (err) {
        console.error('Erro ao buscar reset timers:', err);
      }
    }

    function updateCalculations() {
      const now = new Date();
      
      const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffDaily = nextMidnight.getTime() - now.getTime();
      const dailyStr = formatTimeDiff(diffDaily);

      const dayOfWeek = now.getUTCDay();
      const daysUntilMonday = (1 + 7 - dayOfWeek) % 7 || 7;
      const nextWeekly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
      const diffWeekly = nextWeekly.getTime() - now.getTime();
      const weeklyStr = formatTimeDiffWeekly(diffWeekly);

      let baroStr = 'Chegou / Ativo!';
      let locationStr = '';
      if (rawData && rawData.voidTrader) {
        const baroDate = new Date(rawData.voidTrader.activation).getTime();
        const diffBaro = baroDate - now.getTime();
        
        const rawLocation = rawData.voidTrader.location || '';
        const cleanLocation = rawLocation.includes(',') 
          ? `${rawLocation.split(',')[0].trim()} (${rawLocation.split(',')[1].trim()})` 
          : rawLocation;

        if (diffBaro > 0) {
          baroStr = formatTimeDiffWeekly(diffBaro);
          locationStr = cleanLocation ? `Destino: ${cleanLocation}` : '';
        } else {
          const expiryBaro = new Date(rawData.voidTrader.expiry).getTime();
          const diffExpiry = expiryBaro - now.getTime();
          if (diffExpiry > 0) {
            baroStr = `Ativo (${formatTimeDiffWeekly(diffExpiry)})`;
            locationStr = cleanLocation ? `Local: ${cleanLocation}` : '';
          } else {
            baroStr = 'transitando';
          }
        }
      }

      setTimers({
        weekly: weeklyStr,
        daily: dailyStr,
        baro: baroStr,
        baroLocation: locationStr
      });
    }

    fetchTimersData();

    const apiInterval = setInterval(fetchTimersData, 60000);
    const tickInterval = setInterval(updateCalculations, 1000);

    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsArchonPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(apiInterval);
      clearInterval(tickInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function formatTimeDiff(ms: number) {
    if (ms <= 0) return 'transitando';
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function formatTimeDiffWeekly(ms: number) {
    if (ms <= 0) return 'transitando';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return (
    <div className="bg-[#131b2e] px-4 py-3 rounded-xl border border-gray-800 text-white w-full flex flex-col md:flex-row items-center justify-between gap-4 relative">
      <div className="flex items-center gap-3 whitespace-nowrap">
        <img 
          src="/favicon.ico" 
          alt="Logo" 
          className="w-8 h-8 object-contain drop-shadow-[0_0_6px_#3b82f6]" 
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-wider bg-gradient-to-r from-white via-gray-200 to-blue-400 bg-clip-text text-transparent">
            PAINEL WARFRAME
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto flex-1 max-w-4xl">
        <div className="bg-[#0e1422] px-3 py-2 rounded-lg border border-gray-800/60 flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium text-xs">Baro Ki'Teer</span>
            <span className="font-mono font-bold text-yellow-300 text-xs">{timers.baro}</span>
          </div>
          {timers.baroLocation && (
            <div className="text-[10px] text-yellow-500 font-semibold mt-0.5 truncate">
              {timers.baroLocation}
            </div>
          )}
        </div>

        <div className="bg-[#0e1422] px-3 py-2 rounded-lg border border-gray-800/60 flex items-center justify-between gap-3">
          <div>
            <span className="text-gray-300 font-medium text-xs block">Reset Semanal</span>
            <span className="text-[9px] text-gray-500 block">(Archons)</span>
          </div>
          <span className="font-mono font-bold text-blue-300 text-xs whitespace-nowrap">{timers.weekly}</span>
        </div>

        <div className="bg-[#0e1422] px-3 py-2 rounded-lg border border-gray-800/60 flex items-center justify-between gap-3">
          <div>
            <span className="text-gray-300 font-medium text-xs block">Reset Diário</span>
            <span className="text-[9px] text-gray-500 block">(Tributo)</span>
          </div>
          <span className="font-mono font-bold text-green-300 text-xs whitespace-nowrap">{timers.daily}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 relative" ref={popupRef}>
        <button
          type="button"
          onClick={() => setIsArchonPopupOpen(!isArchonPopupOpen)}
          className="bg-[#0e1422] hover:bg-gray-800 border border-gray-700 text-xs px-3 py-2 rounded-lg text-gray-300 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Caçada Archon"
        >
          <img 
            src="/IconNarmer.webp" 
            alt="Narmer" 
            className="w-5 h-5 object-contain" 
          />
        </button>
          
        <button
          type="button"
          className="bg-[#0e1422] hover:bg-gray-800 border border-gray-700 text-xs px-3 py-2 rounded-lg text-gray-300 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <img 
            src="/Config.svg" 
            alt="Narmer" 
            className="w-4 h-4 object-contain" 
          />
        </button>

        {isArchonPopupOpen && (
          <div className="absolute right-0 top-12 z-50 w-[380px] sm:w-[420px] bg-[#0e1422] border border-gray-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-800">
              
              {/* Lado esquerdo: Título */}
              <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <img 
                 src="/IconNarmer.webp" 
                 alt="Narmer" 
                 className="w-5 h-5 object-contain" 
                /> Caçada Archon
              </span>
              
              {/* Lado direito: Timer ao lado do botão X */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-rose-400">
                  {timers.weekly}
                </span>

                <button 
                  onClick={() => setIsArchonPopupOpen(false)}
                  className="text-gray-400 hover:text-white font-mono text-xs bg-gray-800/60 hover:bg-gray-700 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              <ArchonHuntSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}