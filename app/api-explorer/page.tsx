'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FULL_ARBITRATION_LIST, ArbitrationItem } from '@/lib/data/arbitrationData';

const endpoints = [
  'pc', 'alerts', 'arbitration', 'archonHunt', 'cetusCycle', 'constructionProgress', 
  'dailyDeals', 'darkSectors', 'duviriCycle', 'earthCycle', 'events', 'fissures', 
  'flashMissions', 'invasions', 'news', 'nightwave', 'outposts', 'rivens', 
  'sortie', 'steelPath', 'syndicateMissions', 'vallisCycle', 'voidTrader'
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Converte "Fri, July 24" + "15:00" em um objeto Date real
function parseArbDateTime(dateStr: string, timeStr: string, year: number): Date {
  const datePart = dateStr.split(',')[1]?.trim() ?? dateStr.trim();
  const [monthName, dayStr] = datePart.split(' ');
  const month = MONTHS.indexOf(monthName);
  const day = parseInt(dayStr, 10);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(year, month, day, hh, mm, 0, 0);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function ApiExplorer() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [formatado, setFormatado] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'endpoints' | 'dropsTest' | 'itemInspector' | 'arbitrationTest' | 'alertsInspector'>('endpoints');

  const [allItems, setAllItems] = useState<any[]>([]);
  const [solNodesMap, setSolNodesMap] = useState<Record<string, any>>({});
  const [dropsData, setDropsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [selectedDropItems, setSelectedDropItems] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Misc');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [inspectedItem, setInspectedItem] = useState<any>(null);

  const [arbitrationData, setArbitrationData] = useState<any>(null);
  const [loadingArbitration, setLoadingArbitration] = useState(false);

  // --- Lógica de arbitragem ativa em tempo real ---
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Anexa a data/hora real de início de cada item da lista
  const arbitrationWithDates = useMemo(() => {
    const year = new Date().getFullYear();
    return FULL_ARBITRATION_LIST.map((item) => ({
      ...item,
      start: parseArbDateTime(item.date, item.time, year),
    }));
  }, []);

  // Descobre qual item está ativo agora (comparando "now" com o intervalo de cada missão)
  const activeIndex = useMemo(() => {
    for (let i = 0; i < arbitrationWithDates.length; i++) {
      const start = arbitrationWithDates[i].start;
      const end = arbitrationWithDates[i + 1]?.start ?? new Date(start.getTime() + 60 * 60 * 1000);
      if (now >= start && now < end) return i;
    }
    return -1;
  }, [now, arbitrationWithDates]);

  const activeArbItem = activeIndex >= 0 ? arbitrationWithDates[activeIndex] : null;
  const nextArbItem = activeIndex >= 0 ? arbitrationWithDates[activeIndex + 1] : null;

  const countdownMs = nextArbItem ? nextArbItem.start.getTime() - now.getTime() : null;
  const countdownStr = countdownMs !== null ? formatCountdown(countdownMs) : null;

  const [selectedArbItem, setSelectedArbItem] = useState<ArbitrationItem | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Assim que descobrirmos qual está ativa, ela vira a selecionada por padrão (só uma vez)
  useEffect(() => {
    if (activeArbItem && !selectedArbItem) {
      setSelectedArbItem(activeArbItem);
    }
  }, [activeArbItem, selectedArbItem]);

  // Rola a lista até o item ativo automaticamente, uma vez
  useEffect(() => {
    if (activeIndex >= 0 && !hasAutoScrolled.current && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'center' });
      hasAutoScrolled.current = true;
    }
  }, [activeIndex]);

  const displayedArbItem = selectedArbItem ?? activeArbItem ?? arbitrationWithDates[0];

  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const [endpointSearch, setEndpointSearch] = useState('');
  const [loadingAllEndpoints, setLoadingAllEndpoints] = useState(false);

  useEffect(() => {
    async function fetchDropsTestData() {
      try {
        console.log("🔄 Carregando dados de suporte do Warframe...");
        const [resItems, resDrops, resNodes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json'),
          fetch('https://raw.githubusercontent.com/WFCD/warframe-drop-data/gh-pages/data/pc/dropData.json'),
          fetch('https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/solNodes.json')
        ]);
        if (resItems.ok) setAllItems(await resItems.json());
        if (resDrops.ok) setDropsData(await resDrops.json());
        if (resNodes.ok) setSolNodesMap(await resNodes.json());
        console.log("✅ Dados de suporte carregados com sucesso!");
      } catch (err) {
        console.error('❌ Erro ao carregar dados de suporte:', err);
      } finally {
        setLoadingDrops(false);
      }
    }
    fetchDropsTestData();
  }, []);

  const translateNode = (nodeKey: string) => {
    if (!nodeKey) return 'Desconhecido';
    if (solNodesMap && solNodesMap[nodeKey]) {
      const nodeInfo = solNodesMap[nodeKey];
      return `${nodeInfo.value || nodeInfo.name} (${nodeInfo.system || nodeInfo.planet || ''}) - ${nodeInfo.type || ''}`;
    }
    return nodeKey;
  };

  const testFetchArbitration = async () => {
    console.log("⚔️ Buscando estado da Arbitragem...");
    setLoadingArbitration(true);
    try {
      const res = await fetch('https://api.warframestat.us/pc');
      const data = await res.json();
      let found = data.arbitration;

      if (!found || found.node === 'SolNode000' || found.id === 'string') {
        const resArb = await fetch('https://api.warframestat.us/pc/arbitration');
        const dataArb = await resArb.json();
        found = dataArb;
      }

      setArbitrationData(found || { error: "Nenhuma arbitragem ativa no momento." });
      console.log("✅ Arbitragem processada:", found);
    } catch (err) {
      console.error('❌ Erro ao buscar arbitragem:', err);
      setArbitrationData({ error: "Falha na requisição da API." });
    } finally {
      setLoadingArbitration(false);
    }
  };

  const fetchAllAlerts = async () => {
    console.log("🚨 Buscando Alertas...");
    setLoadingAlerts(true);
    try {
      const res = await fetch('https://api.warframestat.us/pc/alerts');
      const data = await res.json();
      const validAlerts = Array.isArray(data) 
        ? data.filter(alert => alert.id !== 'string' && alert.mission?.node !== 'string') 
        : [];
      setAlertsData(validAlerts);
    } catch (err) {
      console.error('❌ Erro ao buscar alertas:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const cleanItemName = (name: string) => {
    if (!name) return '';
    return name.replace(/<[^>]*>?/gm, '').trim();
  };

  const filteredItems = searchTerm.trim() === '' ? [] : allItems.filter((item: any) => {
    return cleanItemName(item.name).toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 10);

  const availableCategories = Array.from(new Set(allItems.map((item: any) => item.category || 'Outros'))).sort();

  const filteredInspectorItems = allItems.filter((item: any) => {
    const itemCat = item.category || 'Outros';
    const matchesCategory = itemCat === selectedCategory;
    const matchesSearch = inspectorSearch.trim() === '' || cleanItemName(item.name).toLowerCase().includes(inspectorSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDropsForItem = (itemName: string) => {
    if (!dropsData) return [];
    const targetName = cleanItemName(itemName).toLowerCase();
    const foundDrops: any[] = [];

    if (dropsData.missionRewards) {
      Object.entries(dropsData.missionRewards).forEach(([planetNode, missionData]: [string, any]) => {
        if (missionData.rewards) {
          Object.entries(missionData.rewards).forEach(([rot, rewardsList]: [string, any]) => {
            if (Array.isArray(rewardsList)) {
              rewardsList.forEach((reward: any) => {
                if (reward.item) {
                  const dropName = reward.item.toLowerCase();
                  if (dropName.includes(targetName) || targetName.includes(dropName)) {
                    foundDrops.push({
                      type: 'Missão',
                      source: `${planetNode} (${rot.toUpperCase()})`,
                      chance: `${(reward.chance * 100).toFixed(1)}%`
                    });
                  }
                }
              });
            }
          });
        }
      });
    }

    if (dropsData.enemyDrops) {
      dropsData.enemyDrops.forEach((enemy: any) => {
        if (enemy.drops) {
          enemy.drops.forEach((drop: any) => {
            if (drop.item) {
              const dropName = drop.item.toLowerCase();
              if (dropName.includes(targetName) || targetName.includes(dropName)) {
                foundDrops.push({
                  type: 'Inimigo',
                  source: enemy.enemyName,
                  chance: `${(drop.chance * 100).toFixed(2)}%`
                });
              }
            }
          });
        }
      });
    }

    return Array.from(new Set(foundDrops.map(a => `${a.source}-${a.chance} (${a.type})`)))
      .map(stringKey => foundDrops.find(a => `${a.source}-${a.chance} (${a.type})` === stringKey))
      .slice(0, 6);
  };

  const fetchAll = async () => {
    console.log("🌐 Carregando todos os endpoints...");
    setLoadingAllEndpoints(true);
    const newResults: Record<string, any> = {};
    await Promise.all(endpoints.map(async (path) => {
      try {
        const url = path === 'pc' ? 'https://api.warframestat.us/pc' : `https://api.warframestat.us/pc/${path}`;
        const res = await fetch(url);
        newResults[path] = await res.json();
      } catch (e) {
        newResults[path] = { error: 'Falha ao buscar' };
      }
    }));
    setResults({ ...newResults });
    setLoadingAllEndpoints(false);
    console.log("✅ Endpoints carregados e estado atualizado.");
  };

  const formatData = (path: string, data: any) => {
    if (!formatado) return JSON.stringify(data, null, 2);
    if (data?.error) return data.error;

    switch(path) {
      case 'pc': return `Estado completo carregado (${Object.keys(data || {}).length} chaves principais)`;
      case 'alerts': 
        return Array.isArray(data) && data.length > 0 
          ? data.map((a: any) => `• ${translateNode(a.mission?.node)} | ${a.mission?.type}: ${a.mission?.reward?.asString || 'Sem recompensa'}`).join('\n') 
          : 'Nenhum alerta ativo encontrado.';
      case 'arbitration': 
        return data?.node ? `• Nó: ${translateNode(data.node)}\n• Tipo: ${data.type}\n• Facção: ${data.enemy}` : 'Dados de arbitragem indisponíveis.';
      default: return JSON.stringify(data, null, 2);
    }
  };

  return (
    <div className="p-6 bg-gray-950 text-white min-h-screen">
      <div className="flex gap-2 mb-4 border-b border-gray-800 pb-3 flex-wrap">
        <button onClick={() => setActiveSubTab('endpoints')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition cursor-pointer ${activeSubTab === 'endpoints' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          🌐 Endpoints ({Object.keys(results).length})
        </button>
        <button onClick={() => setActiveSubTab('alertsInspector')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition cursor-pointer ${activeSubTab === 'alertsInspector' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          🚨 Alertas ({alertsData.length})
        </button>
        <button onClick={() => setActiveSubTab('dropsTest')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition cursor-pointer ${activeSubTab === 'dropsTest' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          📦 Testador de Drops ({selectedDropItems.length})
        </button>
        <button onClick={() => setActiveSubTab('itemInspector')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition cursor-pointer ${activeSubTab === 'itemInspector' ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          🔍 Inspecionador de Itens
        </button>
        <button onClick={() => setActiveSubTab('arbitrationTest')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition cursor-pointer ${activeSubTab === 'arbitrationTest' ? 'bg-yellow-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          ⚔️ Arbitragem
        </button>
      </div>

      {activeSubTab === 'endpoints' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 items-center sticky top-0 bg-gray-950 p-4 z-10 border-b border-gray-800">
            <button onClick={fetchAll} disabled={loadingAllEndpoints} className="bg-blue-600 px-4 py-2.5 rounded text-xs font-bold uppercase hover:bg-blue-500 transition cursor-pointer shadow-lg">
              {loadingAllEndpoints ? 'Carregando Todos...' : 'Carregar Todos os Endpoints 🌐'}
            </button>
            <button onClick={() => setFormatado(!formatado)} className="bg-green-600 px-4 py-2.5 rounded text-xs font-bold uppercase hover:bg-green-500 transition cursor-pointer shadow-lg">
              {formatado ? 'Modo Bruto (JSON)' : 'Modo Formatado com Tradução'}
            </button>
            <input
              type="text"
              placeholder="Filtrar endpoints..."
              value={endpointSearch}
              onChange={(e) => setEndpointSearch(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 text-xs rounded-lg p-2.5 text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endpoints.map((path) => {
              const rawData = results[path];
              const formattedContent = rawData ? formatData(path, rawData) : 'Clique em "Carregar Todos os Endpoints" acima.';
              
              if (endpointSearch && !path.toLowerCase().includes(endpointSearch.toLowerCase()) && !formattedContent.toLowerCase().includes(endpointSearch.toLowerCase())) {
                return null;
              }

              return (
                <div key={path} className="bg-gray-900 p-4 rounded border border-gray-700 shadow-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-blue-400 font-bold uppercase text-xs truncate">{path}</h2>
                    <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                      {rawData ? 'Pronto' : 'Aguardando'}
                    </span>
                  </div>
                  <pre className="text-[10px] whitespace-pre-wrap max-h-60 overflow-y-auto bg-black p-2.5 rounded border border-gray-800 text-gray-300 font-mono">
                    {formattedContent}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'alertsInspector' && (
        <div className="flex flex-col gap-4">
          <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl flex flex-col gap-3">
            <h3 className="text-sm font-bold text-red-400 uppercase">Monitor de Alertas</h3>
            <button onClick={fetchAllAlerts} disabled={loadingAlerts} className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs px-4 py-2.5 rounded-lg transition w-max cursor-pointer shadow-lg">
              {loadingAlerts ? 'Buscando...' : 'Carregar Alertas Ativos 🚨'}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase">Lista ({alertsData.length})</h4>
              {alertsData.map((alert: any) => (
                <div key={alert.id} onClick={() => setSelectedAlert(alert)} className="p-3 bg-gray-950 border border-gray-800 rounded cursor-pointer hover:border-red-500 text-xs flex flex-col gap-1">
                  <span className="text-red-400 font-bold">{alert.mission?.type} • {translateNode(alert.mission?.node)}</span>
                  <span className="text-yellow-400">Recompensa: {alert.mission?.reward?.asString}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
              <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Detalhes Brutos</h4>
              <pre className="text-[10px] bg-black p-3 rounded text-red-300 overflow-y-auto max-h-80 font-mono">
                {selectedAlert ? JSON.stringify(selectedAlert, null, 2) : 'Selecione um alerta ao lado.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'dropsTest' && (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 relative z-50">
            <label className="block text-xs text-gray-400 mb-1">Buscar Item para Testar Drops:</label>
            <input
              type="text"
              placeholder={loadingDrops ? "Carregando base de dados..." : "Ex: Prime, Systems, Neuroptics..."}
              disabled={loadingDrops}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-sm rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
            />
            {filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
                {filteredItems.map((item: any) => {
                  const cleanName = cleanItemName(item.name);
                  return (
                    <div key={item.uniqueName} onClick={() => {
                      if (!selectedDropItems.some(i => i.uniqueName === item.uniqueName)) {
                        setSelectedDropItems([...selectedDropItems, { ...item, cleanName }]);
                      }
                      setSearchTerm('');
                    }} className="flex justify-between px-3 py-2.5 text-xs hover:bg-blue-600/20 cursor-pointer border-b border-gray-900">
                      <span>{cleanName}</span>
                      <span className="text-blue-400">Adicionar ➕</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Itens Selecionados ({selectedDropItems.length})</h4>
              {selectedDropItems.map((item) => (
                <div key={item.uniqueName} className="flex justify-between items-center bg-gray-800 p-2 rounded mb-2 text-xs">
                  <span>{item.cleanName}</span>
                  <button onClick={() => setSelectedDropItems(selectedDropItems.filter(i => i.uniqueName !== item.uniqueName))} className="text-red-400 font-bold">Remover ✕</button>
                </div>
              ))}
            </div>
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Resultados de Drops</h4>
              {selectedDropItems.map((item) => {
                const drops = getDropsForItem(item.cleanName);
                return (
                  <div key={item.uniqueName} className="bg-gray-950 p-2.5 rounded border border-gray-800 mb-2 text-xs">
                    <div className="font-bold text-blue-400 mb-1">{item.cleanName}</div>
                    {drops.length === 0 ? <span className="text-gray-500 italic">Nenhum drop encontrado.</span> : drops.map((d, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-gray-300">
                        <span>{d.source}</span>
                        <span className="text-blue-300 font-mono">{d.chance}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'itemInspector' && (
        <div className="flex flex-col gap-4">
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl flex flex-col md:flex-row gap-3">
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setInspectedItem(null); }} className="bg-gray-950 border border-purple-500/40 text-xs rounded-lg p-2.5 text-purple-200 outline-none font-bold">
              {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" placeholder="Filtrar..." value={inspectorSearch} onChange={(e) => setInspectorSearch(e.target.value)} className="flex-1 bg-gray-950 border border-purple-500/40 text-xs rounded-lg p-2.5 text-white outline-none" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 max-h-96 overflow-y-auto">
              {filteredInspectorItems.map((item: any) => (
                <div key={item.uniqueName} onClick={() => setInspectedItem(item)} className="p-2.5 rounded text-xs cursor-pointer mb-1 bg-gray-950 border border-gray-800 hover:border-purple-500 flex justify-between">
                  <span>{cleanItemName(item.name)}</span>
                  <span className="text-purple-400">Inspecionar</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
              <pre className="text-[10px] bg-black p-3 rounded text-purple-300 overflow-y-auto max-h-96 font-mono">
                {inspectedItem ? JSON.stringify(inspectedItem, null, 2) : 'Selecione um item.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'arbitrationTest' && (
        <div className="flex flex-col gap-4">
          {/* TOPO: O que está ativo no momento, com contagem regressiva */}
          <div className="bg-yellow-950/30 border border-yellow-500/50 p-4 rounded-xl flex flex-col gap-2 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${activeArbItem ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span>{activeArbItem ? 'ATIVO NO MOMENTO (LIVE)' : 'NENHUMA ARBITRAGEM ATIVA'}</span>
              </h3>
              {activeArbItem && (
                <span className="text-[10px] bg-yellow-500 text-black font-bold px-2 py-0.5 rounded uppercase">
                  {activeArbItem.date} às {activeArbItem.time}
                </span>
              )}
            </div>

            {activeArbItem ? (
              <>
                <div className="text-sm font-bold text-white flex items-center gap-3 flex-wrap">
                  <span className="text-yellow-300 font-mono">{activeArbItem.type}</span>
                  <span>•</span>
                  <span>{activeArbItem.faction}</span>
                  <span>@</span>
                  <span className="text-blue-400">{activeArbItem.node}</span>
                  <span className="text-xs bg-gray-900 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
                    {activeArbItem.tier}
                  </span>
                  {activeArbItem.bonus && (
                    <span className="text-xs text-green-400 bg-green-950/40 px-2 py-0.5 rounded border border-green-900">
                      🎁 {activeArbItem.bonus}
                    </span>
                  )}
                </div>

                {countdownStr && (
                  <div className="flex items-center gap-2 pt-1 border-t border-yellow-900/40 mt-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Termina em:</span>
                    <span className="text-lg font-mono font-bold text-yellow-300 tabular-nums">{countdownStr}</span>
                    {nextArbItem && (
                      <span className="text-[11px] text-gray-400">
                        → próxima: <span className="text-blue-300 font-bold">{nextArbItem.type}</span> @ <span className="text-blue-300 font-bold">{nextArbItem.node}</span>
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400 italic">
                A hora atual não está dentro do cronograma cadastrado.
              </div>
            )}
          </div>

          {/* CORPO: Lista de um lado, Inspeção do outro */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* LADO ESQUERDO: Lista Completa */}
            <div ref={listContainerRef} className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-gray-300 uppercase">Cronograma de Arbitragens ({arbitrationWithDates.length})</h4>
                <button onClick={testFetchArbitration} disabled={loadingArbitration} className="text-[10px] bg-yellow-600 hover:bg-yellow-500 text-black font-bold uppercase px-2 py-1 rounded transition">
                  {loadingArbitration ? 'Atualizando API...' : 'Testar API Real ⚔️'}
                </button>
              </div>

              {arbitrationWithDates.map((item, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = displayedArbItem?.time === item.time && displayedArbItem?.date === item.date;
                return (
                  <div 
                    key={idx}
                    ref={isActive ? activeItemRef : undefined}
                    onClick={() => setSelectedArbItem(item)} 
                    className={`p-3 rounded border text-xs cursor-pointer transition flex justify-between items-center ${
                      isSelected
                        ? 'bg-yellow-900/30 border-yellow-500 text-white shadow-md' 
                        : isActive
                        ? 'bg-green-950/20 border-green-600/60 text-gray-100'
                        : 'bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">{item.date} - {item.time}</span>
                      <span className="font-bold text-yellow-200">{item.type} @ {item.node}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">{item.tier}</span>
                      {isActive && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">ATUAL</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LADO DIREITO: Inspeção Detalhada */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-yellow-400 uppercase">🔍 Inspecionar Item Selecionado</h4>
              
              {displayedArbItem ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 flex flex-col gap-2 text-xs">
                    <div className="text-gray-400 font-mono border-b border-gray-900 pb-2">
                      📅 {displayedArbItem.date} | Horário: <span className="text-white font-bold">{displayedArbItem.time}</span>
                    </div>
                    <div className="text-white text-sm font-bold flex items-center gap-2 pt-1">
                      📍 {displayedArbItem.node}
                    </div>
                    <div className="text-gray-300">
                      Tipo de Missão: <span className="text-yellow-300 font-bold">{displayedArbItem.type}</span>
                    </div>
                    <div className="text-gray-300">
                      Facção: <span className="text-blue-300 font-bold">{displayedArbItem.faction}</span>
                    </div>
                    <div className="text-gray-300">
                      Tier: <span className="text-purple-300 font-bold">{displayedArbItem.tier}</span>
                    </div>
                    {displayedArbItem.bonus && (
                      <div className="text-gray-300">
                        Bônus de Recurso: <span className="text-green-400 font-bold">{displayedArbItem.bonus}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Texto Bruto Original:</span>
                    <pre className="text-[11px] bg-black p-3 rounded text-yellow-300 overflow-y-auto max-h-32 font-mono border border-gray-900">
                      {displayedArbItem.raw}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic p-4">Selecione um item na lista ao lado para inspecionar.</div>
              )}

              {/* Se o usuário também quiser testar o payload direto da API real embaixo */}
              {arbitrationData && (
                <div className="mt-2 pt-2 border-t border-gray-800 flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Payload Bruto da API Real:</span>
                  <pre className="text-[10px] bg-black p-2 rounded text-yellow-300 overflow-y-auto max-h-32 font-mono">
                    {JSON.stringify(arbitrationData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}