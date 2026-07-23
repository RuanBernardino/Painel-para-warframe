'use client';
import { useState } from 'react';
import CircuitSection from '@/components/CircuitSection';
import ResourceCalculatorTab from '@/components/ResourceCalculatorTab';
import DropSearchTab from '@/components/DropSearchTab';

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('circuit');
  const [dropQuery, setDropQuery] = useState('');

  // Função disparada ao clicar em um recurso no Bloco de Notas
  const handleSelectResource = (resourceName: string) => {
    setDropQuery(resourceName);
    setActiveTab('drops'); // Muda automaticamente para a aba de Busca de Drops
  };

  const tabs = [
    { id: 'circuit', label: 'The Circuit (Duviri)' },
    { id: 'calculator', label: 'Crafting' },
    { id: 'drops', label: 'Busca de Drops' },
  ];

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 w-full shadow-lg flex flex-col gap-4">
      
      {/* ABAS DINÂMICAS */}
      <div className="flex bg-gray-900/80 p-1 rounded-lg gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 text-center truncate ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      <div className="min-h-[280px]">
        {activeTab === 'circuit' && <CircuitSection />}

        {activeTab === 'calculator' && (
          <ResourceCalculatorTab onSelectResource={handleSelectResource} />
        )}

        {activeTab === 'drops' && (
          <DropSearchTab 
            initialSearch={dropQuery} 
            onConsumeInitialSearch={() => setDropQuery('')} 
          />
        )}
      </div>

    </div>
  );
}