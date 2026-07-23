'use client';
import { useState } from 'react';
import FissureCard from './FissureCard';
import FissureAlertModal from './FissureAlertModal';

interface VoidFissuresSectionProps {
  fissuresData: any[];
}

export default function VoidFissuresSection({ fissuresData }: VoidFissuresSectionProps) {
  const [mainCategory, setMainCategory] = useState('Normal');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTier, setFilterTier] = useState('Any');
  const [filterMission, setFilterMission] = useState('Any');
  const [showAlertModal, setShowModalAlert] = useState(false);

  const tiersOrder = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia'];

  // Funções de identificação
  const isFissureStorm = (f: any) => {
    return f.isStorm === true || f.isVoidStorm === true || (f.modifier && f.modifier.toLowerCase().includes('storm'));
  };

  const isFissureSteelPath = (f: any) => {
    return (
      f.isHard === true ||
      f.steelPath === true || 
      f.isSteelPath === true || 
      (f.id && f.id.toLowerCase().includes('sp')) ||
      (f.node && f.node.toLowerCase().includes('steel path')) ||
      JSON.stringify(f).toLowerCase().includes('steelpath')
    );
  };

  const categoryFissures = (Array.isArray(fissuresData) ? fissuresData : []).filter(f => {
    const storm = isFissureStorm(f);
    const sp = isFissureSteelPath(f);

    if (mainCategory === 'Void Storms') return storm;
    if (mainCategory === 'Steel Path') return sp && !storm;
    
    // Normal: não pode ser storm e nem steel path
    return !sp && !storm;
  });

  const filteredFissures = categoryFissures.filter(f => {
    if (filterTier !== 'Any' && f.tier !== filterTier) return false;
    if (filterMission !== 'Any' && !f.missionType?.toLowerCase().includes(filterMission.toLowerCase())) return false;
    return true;
  });

  const groupedFissures = tiersOrder.reduce((acc: any, tier) => {
    const items = filteredFissures.filter(f => f.tier === tier);
    if (items.length > 0) acc[tier] = items;
    return acc;
  }, {});

  return (
    <div className="bg-[#131b2e] p-5 rounded-xl border border-gray-800 mb-6 relative">
      
      {/* CABEÇALHO: ABAS, CONTADOR, FILTROS E O BOTÃO DE ALARME INTEGRADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {['Normal', 'Steel Path', 'Void Storms'].map((cat) => (
            <button
              key={cat}
              onClick={() => setMainCategory(cat)}
              className={`flex-1 md:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition border ${
                mainCategory === cat
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                  : 'bg-[#0e1422] text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-xs text-gray-400">Total: {categoryFissures.length}</span>
          
          <div className="flex items-center gap-2">
            {/* Botão de Alarme de Fissura integrado com ícone */}
            <FissureAlertModal 
              fissuresData={fissuresData}
              showAlertModal={showAlertModal}
              setShowModalAlert={setShowModalAlert}
            />

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-[#0e1422] hover:bg-gray-800 border border-gray-700 text-xs px-3 py-1.5 rounded-lg text-gray-300 transition flex items-center gap-1.5"
            >
              <span>🔍</span> {showFilters ? 'Ocultar Filtros' : 'Filtrar Era/Missão'}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 bg-[#0e1422] p-3 rounded-lg border border-gray-800/80">
          <select 
            value={filterTier} 
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-[#131b2e] border border-gray-700 text-xs rounded p-2 text-gray-200 outline-none"
          >
            <option value="Any">Era (Tier): Any</option>
            {tiersOrder.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            value={filterMission} 
            onChange={(e) => setFilterMission(e.target.value)}
            className="bg-[#131b2e] border border-gray-700 text-xs rounded p-2 text-gray-200 outline-none"
          >
            <option value="Any">Mission: Any</option>
            <option value="Survival">Survival</option>
            <option value="Capture">Capture</option>
            <option value="Extermination">Extermination</option>
            <option value="Mobile Defense">Mobile Defense</option>
            <option value="Defense">Defense</option>
            <option value="Spy">Spy</option>
            <option value="Skirmish">Skirmish</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
        {Object.keys(groupedFissures).length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-6">Nenhuma fissura encontrada nesta categoria...</div>
        ) : (
          Object.keys(groupedFissures).map((tier) => (
            <div key={tier} className="flex flex-col gap-2">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider px-1 pt-2 border-b border-gray-800 pb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {tier} Fissures ({groupedFissures[tier].length})
              </div>

              {groupedFissures[tier].map((fissure: any) => (
                <FissureCard key={fissure.id} fissure={fissure} category={mainCategory} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}