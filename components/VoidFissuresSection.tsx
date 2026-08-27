'use client';
import { useEffect, useRef, useState } from 'react';
import FissureCard from './FissureCard';
import FissureAlertModal from './FissureAlertModal';
import { triggerGlobalNotification } from './NotificationManager';
import { translateMissionName } from '@/lib/data/missionTranslations';
import { usePersistentCollapsed } from '@/lib/hooks/usePersistentCollapsed';

interface VoidFissuresSectionProps {
  fissuresData: any[];
  clockOffsetMs?: number;
}

export default function VoidFissuresSection({ fissuresData, clockOffsetMs = 0 }: VoidFissuresSectionProps) {
  const { isCollapsed, toggleCollapsed } = usePersistentCollapsed('warframe_section_fissures_collapsed');
  const [mainCategory, setMainCategory] = useState('Normal');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTier, setFilterTier] = useState('Any');
  const [filterMission, setFilterMission] = useState('Any');
  const [showAlertModal, setShowModalAlert] = useState(false);
  const knownFissureIdsRef = useRef<Set<string> | null>(null);

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

  useEffect(() => {
    const currentIds = new Set(fissuresData.map(fissure => String(fissure.id)));
    const previousIds = knownFissureIdsRef.current;
    knownFissureIdsRef.current = currentIds;

    // A primeira carga apenas cria a base e não alerta sobre fissuras antigas.
    if (!previousIds) return;

    let alerts: Array<{ category: string; tier: string; mission: string }> = [];
    let omniaEnabled = false;
    try {
      alerts = JSON.parse(localStorage.getItem('warframe_fissure_alerts') ?? '[]');
      omniaEnabled = JSON.parse(localStorage.getItem('warframe_omnia_alert') ?? 'false');
    } catch {
      return;
    }

    for (const fissure of fissuresData) {
      if (previousIds.has(String(fissure.id))) continue;

      const storm = isFissureStorm(fissure);
      const steelPath = isFissureSteelPath(fissure);
      const fissureCategory = storm ? 'Void Storms' : steelPath ? 'Steel Path' : 'Normal';
      const mission = String(fissure.missionType ?? '');
      const matchesConfiguredAlert = alerts.some(alert =>
        alert.category === fissureCategory &&
        alert.tier === fissure.tier &&
        mission.toLowerCase().includes(alert.mission.toLowerCase())
      );

      if ((omniaEnabled && fissure.tier === 'Omnia') || matchesConfiguredAlert) {
        triggerGlobalNotification(
          'fissure',
          '🟢 Nova fissura!',
          `${fissure.tier} · ${translateMissionName(mission)} em ${fissure.node}`
        );
      }
    }
  }, [fissuresData]);

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
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-800 pb-3 ${isCollapsed ? '' : 'mb-4'}`}>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {isCollapsed ? (
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <span>🌀</span> Fissuras do Void
            </div>
          ) : ['Normal', 'Steel Path', 'Void Storms'].map((cat) => (
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

            {!isCollapsed && <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-[#0e1422] hover:bg-gray-800 border border-gray-700 text-xs px-3 py-1.5 rounded-lg text-gray-300 transition flex items-center gap-1.5"
            >
              <span>🔍</span> {showFilters ? 'Ocultar Filtros' : 'Filtrar Era/Missão'}
            </button>}

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Abrir Fissuras' : 'Recolher Fissuras'}
              className="w-8 h-8 rounded-lg border border-gray-700 bg-[#0e1422] text-gray-300 hover:text-white hover:border-blue-500/60 transition flex items-center justify-center"
            >
              <span className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>▼</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="min-h-0 overflow-hidden">
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
                <FissureCard
                  key={fissure.id}
                  fissure={fissure}
                  category={mainCategory}
                  clockOffsetMs={clockOffsetMs}
                />
              ))}
            </div>
          ))
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
