'use client';

import { useState, useEffect, useCallback } from 'react';
import Timer from './Timer';

export default function WorldCycles() {
  const [cetus, setCetus] = useState<any>(null);
  const [earth, setEarth] = useState<any>(null);
  const [duviri, setDuviri] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [darkSector, setDarkSector] = useState<any>(null);

  const fetchData = useCallback(async () => {
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

    await Promise.all([
      safeFetch('https://api.warframestat.us/pc/cetusCycle', setCetus),
      safeFetch('https://api.warframestat.us/pc/earthCycle', setEarth),
      safeFetch('https://api.warframestat.us/pc/duviriCycle', setDuviri),
      safeFetch('https://api.warframestat.us/pc/dailyDeals', setDaily),
      safeFetch('https://api.warframestat.us/pc/darkSectors', setDarkSector),
    ]);
  }, []);

  // Chamada única inicial ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcula o próximo reset (00:00 UTC) de forma estática com base no momento atual
  const getNextResetTimestamp = () => {
    const now = new Date();
    const nextReset = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate() + 1, 
      0, 0, 0
    ));
    return nextReset.toISOString();
  };

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-900 border border-gray-700 rounded-lg text-xs mb-6 text-white">
      
      {/* CETUS */}
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">
          Cetus <span className={cetus?.isDay ? "text-yellow-400" : "text-purple-400"}>{cetus ? (cetus.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
        </span>
        <span className="text-gray-300 font-mono">
          {cetus?.expiry ? <Timer targetDate={cetus.expiry} onExpire={fetchData} /> : 'Carregando...'}
        </span>
      </div>

      {/* EARTH */}
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">
          Earth <span className={earth?.isDay ? "text-green-400" : "text-blue-400"}>{earth ? (earth.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
        </span>
        <span className="text-gray-300 font-mono">
          {earth?.expiry ? <Timer targetDate={earth.expiry} onExpire={fetchData} /> : 'Carregando...'}
        </span>
      </div>

      {/* DUVIRI */}
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">
          Duviri <span className="text-blue-400">{duviri ? duviri.state?.toUpperCase() : '...'}</span>
        </span>
        <span className="text-gray-300 font-mono">
          {duviri?.expiry ? <Timer targetDate={duviri.expiry} onExpire={fetchData} /> : 'Carregando...'}
        </span>
      </div>

      {/* DARK SECTORS */}
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Dark Sectors</span>
        <span className="text-blue-400">{darkSector ? 'LOADED' : '...'}</span>
      </div>

      {/* DAILY DEALS */}
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">Daily Deals Reset</span>
        <span className="text-blue-400 font-mono">
          <Timer targetDate={getNextResetTimestamp()} onExpire={fetchData} />
        </span>
      </div>

      {/* BOTÃO API EXPLORER */}
      <a 
        href="/api-explorer" 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold uppercase transition ml-auto"
      >
        Abrir Explorador de API
      </a>
      
    </div>
  );
}