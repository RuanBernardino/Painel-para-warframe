'use client';
import { useEffect, useState } from 'react';

export default function ResetTimersSection() {
  const [timers, setTimers] = useState({
    weekly: '--',
    daily: '--',
    baro: '--',
    baroLocation: ''
  });

  useEffect(() => {
    async function fetchTimers() {
      try {
        const res = await fetch('https://api.warframestat.us/pc');
        const data = await res.json();

        const now = new Date();
        
        // Reset Diário (00:00 UTC)
        const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
        const diffDaily = nextMidnight.getTime() - now.getTime();
        const dailyStr = formatTimeDiff(diffDaily);

        // Reset Semanal (Segunda-feira 00:00 UTC)
        const dayOfWeek = now.getUTCDay();
        const daysUntilMonday = (1 + 7 - dayOfWeek) % 7 || 7;
        const nextWeekly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
        const diffWeekly = nextWeekly.getTime() - now.getTime();
        const weeklyStr = formatTimeDiffWeekly(diffWeekly);

        // Baro Ki'Teer
        let baroStr = 'Chegou / Ativo!';
        let locationStr = '';
        if (data.voidTrader) {
          const baroDate = new Date(data.voidTrader.activation).getTime();
          const diffBaro = baroDate - now.getTime();
          
          if (diffBaro > 0) {
            baroStr = formatTimeDiffWeekly(diffBaro);
            locationStr = `Próximo: ${data.voidTrader.location}`;
          } else {
            const expiryBaro = new Date(data.voidTrader.expiry).getTime();
            const diffExpiry = expiryBaro - now.getTime();
            if (diffExpiry > 0) {
              baroStr = `Ativo por ${formatTimeDiffWeekly(diffExpiry)}`;
              locationStr = `Local: ${data.voidTrader.location}`;
            } else {
              baroStr = 'Calculando...';
            }
          }
        }

        setTimers({
          weekly: weeklyStr,
          daily: dailyStr,
          baro: baroStr,
          baroLocation: locationStr
        });
      } catch (err) {
        console.error('Erro ao buscar reset timers:', err);
      }
    }

    fetchTimers();
    const interval = setInterval(fetchTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTimeDiff(ms: number) {
    if (ms <= 0) return '0h 0m 0s';
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function formatTimeDiffWeekly(ms: number) {
    if (ms <= 0) return '0d 0h 0m 0s';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return (
    <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 text-white">
      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 border-b border-gray-800 pb-2">
        Reset timers & Traders
      </h3>

      <div className="space-y-2.5 text-xs">
        {/* BARO KI'TEER */}
        <div className="flex justify-between items-center bg-[#0e1422] p-2.5 rounded-lg border border-gray-800/60">
          <div>
            <span className="text-gray-300 font-medium">Baro Ki'Teer</span>
            {timers.baroLocation && <div className="text-[10px] text-yellow-500 font-semibold">{timers.baroLocation}</div>}
          </div>
          <span className="font-mono font-bold text-yellow-300">{timers.baro}</span>
        </div>

        {/* WEEKLY */}
        <div className="flex justify-between items-center bg-[#0e1422] p-2.5 rounded-lg border border-gray-800/60">
          <span className="text-gray-300 font-medium">Reset semanal  <span className="text-[10px] text-gray-500">(Archons, Circuit...)</span></span>
          <span className="font-mono font-bold text-blue-300">{timers.weekly}</span>
        </div>

        {/* DAILY */}
        <div className="flex justify-between items-center bg-[#0e1422] p-2.5 rounded-lg border border-gray-800/60">
          <span className="text-gray-300 font-medium">Reset diários <span className="text-[10px] text-gray-500">(Tributo Diário, Night...)</span></span>
          <span className="font-mono font-bold text-green-300">{timers.daily}</span>
        </div>
      </div>
    </div>
  );
}