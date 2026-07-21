'use client';

import { useState, useEffect } from 'react';

export default function WorldCycles() {
  const [cetus, setCetus] = useState<any>(null);
  const [earth, setEarth] = useState<any>(null);
  const [duviri, setDuviri] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [darkSector, setDarkSector] = useState<any>(null);
  
  // Estado para forçar a atualização do cronômetro a cada segundo
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      const safeFetch = async (url: string, setter: Function) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          setter(data);
        } catch (err) {
          console.error(`Erro ao buscar ${url}:`, err);
        }
      };

      safeFetch('https://api.warframestat.us/pc/cetusCycle', setCetus);
      safeFetch('https://api.warframestat.us/pc/earthCycle', setEarth);
      safeFetch('https://api.warframestat.us/pc/duviriCycle', setDuviri);
      safeFetch('https://api.warframestat.us/pc/dailyDeals', setDaily);
      safeFetch('https://api.warframestat.us/pc/darkSectors', setDarkSector);
    }

    fetchData();

    // Intervalo de 1 segundo para atualizar o cronômetro
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-900 border border-gray-700 rounded-lg text-xs mb-6 text-white">
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Cetus</span>
        <span className="text-blue-400">{cetus ? (cetus.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Earth</span>
        <span className="text-blue-400">{earth ? (earth.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Duviri</span>
        <span className="text-blue-400">{duviri ? duviri.state?.toUpperCase() : '...'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Dark Sectors</span>
        <span className="text-blue-400">{darkSector ? 'LOADED' : '...'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Daily Deals</span>
        <span className="text-blue-400">
          {(() => {
            // Calcula o próximo reset (00:00 UTC) baseado no estado 'now'
            const nextReset = new Date(Date.UTC(
              now.getUTCFullYear(), 
              now.getUTCMonth(), 
              now.getUTCDate() + 1, 
              0, 0, 0
            ));
            
            const diff = nextReset.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            return `${hours}h ${minutes}m ${seconds}s`;
          })()}
        </span>
      </div>
      <a 
            href="/api-explorer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold uppercase transition"
            >
            Abrir Explorador de API
        </a>
    </div>
  );
}