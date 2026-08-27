'use client';
import { useState, useEffect, useCallback } from 'react';
import CircuitSection from '@/components/CircuitSection';
import VoidFissuresSection from '@/components/VoidFissuresSection';
import PlanetaryCyclesSection from '@/components/PlanetaryCyclesSection';
import ResetTimersSection from '@/components/ResetTimersSection';
import NotificationManager, { triggerGlobalNotification } from '@/components/NotificationManager';
import DashboardTabs from '@/components/DashboardTabs';
import ArbitrationSection from '@/components/ArbitrationSection';

export default function WarframeDashboard() {
  const [fissuresData, setFissuresData] = useState<any[]>([]);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [activeTab, setActiveTab] = useState<'principal' | 'outra'>('principal');
  const handleCycleAlert = useCallback((message: string) => {
    triggerGlobalNotification('cycle', '🌍 Mudança de ciclo!', message);
  }, []);

  useEffect(() => {
    async function fetchFissures() {
      try {
        const res = await fetch('/api/warframe/fissures', { cache: 'no-store' });
        if (!res.ok) return;
        const serverTime = Number(res.headers.get('X-Server-Time'));
        const nextClockOffset = Number.isFinite(serverTime) ? serverTime - Date.now() : 0;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        setClockOffsetMs(nextClockOffset);
        const gracePeriod = Date.now() + nextClockOffset - 3000;
        setFissuresData(data.filter((fissure) => {
          const expiry = Date.parse(fissure?.expiry);
          return Number.isFinite(expiry) && expiry > gracePeriod;
        }));
      } catch (err) {
        console.error('Erro ao buscar fissuras:', err);
      }
    }

    fetchFissures();
    const interval = setInterval(fetchFissures, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-[#0b0f19] text-white min-h-screen font-sans relative space-y-6">
      
      {/* GERENCIADOR GLOBAL DE NOTIFICAÇÕES EM CASCATA */}
      <NotificationManager />

      {/* BARRA SUPERIOR COM OS RELÓGIOS RETANGULARES INTEGRADOS */}
      <ResetTimersSection />

      {/* Ciclos Planetários */}
      <PlanetaryCyclesSection onTriggerAlert={handleCycleAlert} />
      {/* BOTÕES */}
      {/*<div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setActiveTab('principal')}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
            activeTab === 'principal'
              ? 'bg-blue-600 text-white border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105'
              : 'bg-[#0e1422] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
          }`}
        >
          <span>⚡</span> Painel de Missões & Fissuras
        </button>

        <button
          onClick={() => setActiveTab('outra')}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
            activeTab === 'outra'
              ? 'bg-blue-600 text-white border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105'
              : 'bg-[#0e1422] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
          }`}
        >
          <span>🛠️</span> Ferramentas & Outras Infos
        </button>
      </div> */}

      {/* CONTEÚDO USANDO 'hidden' EM VEZ DE DESMONTAR (EVITA O BUG DE NOTIFICAÇÕES) */}
      <div>
        {/* ABA PRINCIPAL */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-start ${activeTab === 'principal' ? 'block' : 'hidden'}`}>
          <VoidFissuresSection fissuresData={fissuresData} clockOffsetMs={clockOffsetMs} />
          
          <div className="flex flex-col gap-4">
            <ArbitrationSection />
            <DashboardTabs />
          </div>
        </div>

        {/* ABA ALTERNATIVA */}
        <div className={`bg-[#0e1422] border border-gray-800 rounded-2xl p-8 text-center shadow-lg ${activeTab === 'outra' ? 'block' : 'hidden'}`}>
          <div className="max-w-md mx-auto space-y-3">
            <span className="text-3xl">🚀</span>
            <h2 className="text-lg font-mono font-bold text-rose-400">Página Alternativa</h2>
            <p className="text-xs font-mono text-gray-400">
              Aqui você pode colocar aquele componente do Archon Hunt, farm de relíquias ou qualquer outra aba que quiser isolar da tela principal!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
