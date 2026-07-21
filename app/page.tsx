'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CircuitSection from '@/components/CircuitSection';
import VoidFissuresSection from '@/components/VoidFissuresSection';
import PlanetaryCyclesSection from '@/components/PlanetaryCyclesSection';
import ResetTimersSection from '@/components/ResetTimersSection';
import FissureAlertModal from '@/components/FissureAlertModal';
import NotificationManager, { triggerGlobalNotification } from '@/components/NotificationManager';

export default function WarframeDashboard() {
  const [fissuresData, setFissuresData] = useState<any[]>([]);
  const [showAlertModal, setShowModalAlert] = useState(false);

  useEffect(() => {
    async function fetchFissures() {
      try {
        const res = await fetch('https://api.warframestat.us/pc/fissures');
        if (!res.ok) return;
        const data = await res.json();
        setFissuresData(data);
      } catch (err) {
        console.error('Erro ao buscar fissuras:', err);
      }
    }

    fetchFissures();
    const interval = setInterval(fetchFissures, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-[#0b0f19] text-white min-h-screen font-sans relative">
      
      {/* GERENCIADOR GLOBAL DE NOTIFICAÇÕES EM CASCATA */}
      <NotificationManager />

      {/* Abas Superiores + Botões */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-6">
        <div className="flex gap-6 text-sm">
          <span className="font-bold border-b-2 border-blue-500 pb-3 cursor-pointer">Timers & Events</span>
          {/*<Link href="/notifications" className="text-gray-400 hover:text-white transition cursor-pointer">Histórico 📜</Link>*/}
        </div>
        
        <div className="flex items-center gap-3">
          {/*<button 
            onClick={() => triggerGlobalNotification('test', 'TESTE DO SISTEMA', 'Isso é um teste disparado diretamente pelo NotificationManager!')}
            className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 text-xs px-3 py-1.5 rounded-lg font-mono transition flex items-center gap-1.5"
          >
            🧪 Testar Notificação
          </button>*/}

          <FissureAlertModal 
  fissuresData={fissuresData}
  showAlertModal={showAlertModal}
  setShowModalAlert={setShowModalAlert}
/>

          {/*<Link 
            href="/api-explorer" 
            className="bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 text-xs px-3 py-1.5 rounded-lg font-mono transition"
          >
            ⚙️ Painel Dev
          </Link>*/}
          
        </div>
      </div>

      <PlanetaryCyclesSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <VoidFissuresSection fissuresData={fissuresData} />
        
        <div className="flex flex-col gap-4">
          <CircuitSection />
          <ResetTimersSection />
        </div>
      </div>
    </div>
  );
}