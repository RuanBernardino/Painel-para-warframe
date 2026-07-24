'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CircuitSection from '@/components/CircuitSection';
import VoidFissuresSection from '@/components/VoidFissuresSection';
import PlanetaryCyclesSection from '@/components/PlanetaryCyclesSection';
import ResetTimersSection from '@/components/ResetTimersSection';
import NotificationManager from '@/components/NotificationManager';
import DashboardTabs from '@/components/DashboardTabs';
import ArbitrationSection from '@/components/ArbitrationSection';

export default function WarframeDashboard() {
  const [fissuresData, setFissuresData] = useState<any[]>([]);

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
    <div className="p-6 bg-[#0b0f19] text-white min-h-screen font-sans relative space-y-6">
      
      {/* GERENCIADOR GLOBAL DE NOTIFICAÇÕES EM CASCATA */}
      <NotificationManager />

      {/* BARRA SUPERIOR COM OS RELÓGIOS RETANGULARES INTEGRADOS */}
      <ResetTimersSection />

      {/* Ciclos Planetários */}
      <PlanetaryCyclesSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Fissuras */}
        <VoidFissuresSection fissuresData={fissuresData} />
        
        <div className="flex flex-col gap-4">
          <ArbitrationSection />
          <DashboardTabs />
        </div>
      </div>
    </div>
  );
}