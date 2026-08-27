'use client';
import { useState } from 'react';
import CircuitSection from '@/components/CircuitSection';
import ResourceCalculatorTab from '@/components/ResourceCalculatorTab';
import DropSearchTab from '@/components/DropSearchTab';
import { usePersistentCollapsed } from '@/lib/hooks/usePersistentCollapsed';

export default function DashboardTabs() {
  const { isCollapsed, toggleCollapsed } = usePersistentCollapsed('warframe_section_tools_collapsed');
  const [activeTab, setActiveTab] = useState('circuit');
  const [dropQuery, setDropQuery] = useState('');

  // Função disparada ao clicar em um recurso no Bloco de Notas
  const handleSelectResource = (resourceName: string) => {
    setDropQuery(resourceName);
    setActiveTab('drops'); // Muda automaticamente para a aba de Busca de Drops
  };

  const tabs = [
    { id: 'circuit', label: 'O Circuito (Duviri)' },
    { id: 'calculator', label: 'Crafting' },
    { id: 'drops', label: 'Busca de Drops' },
  ];

  return (
    <div className={`bg-[#111827] border border-gray-800 rounded-xl p-4 w-full shadow-lg flex flex-col ${isCollapsed ? 'gap-0' : 'gap-4'}`}>
      
      {/* ABAS DINÂMICAS */}
      <div className="flex items-center gap-2">
      {isCollapsed ? (
        <div className="flex-1 text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span>🛠️</span> Ferramentas
        </div>
      ) : <div className="flex flex-1 bg-gray-900/80 p-1 rounded-lg gap-1">
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
      </div>}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Abrir Ferramentas' : 'Recolher Ferramentas'}
          className="shrink-0 w-8 h-8 rounded-lg border border-gray-700 bg-[#0e1422] text-gray-300 hover:text-white hover:border-blue-500/60 transition flex items-center justify-center"
        >
          <span className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>▼</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
      <div className="min-h-0 overflow-hidden">
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
      </div>

    </div>
  );
}
