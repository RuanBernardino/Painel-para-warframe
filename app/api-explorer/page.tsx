'use client';
import { useState, useEffect } from 'react';

const endpoints = [
  'pc', 'alerts', 'arbitration', 'archonHunt', 'cetusCycle', 'constructionProgress', 
  'dailyDeals', 'darkSectors', 'duviriCycle', 'earthCycle', 'events', 'fissures', 
  'flashMissions', 'invasions', 'news', 'nightwave', 'outposts', 'rivens', 
  'sortie', 'steelPath', 'syndicateMissions', 'vallisCycle', 'voidTrader'
];

export default function ApiExplorer() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [formatado, setFormatado] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'endpoints' | 'dropsTest' | 'itemInspector'>('endpoints');

  const [allItems, setAllItems] = useState<any[]>([]);
  const [dropsData, setDropsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [selectedDropItems, setSelectedDropItems] = useState<any[]>([]);

  // Estados específicos para a aba de Inspeção de Itens por Categoria
  const [selectedCategory, setSelectedCategory] = useState<string>('Misc');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [inspectedItem, setInspectedItem] = useState<any>(null);

  useEffect(() => {
    async function fetchDropsTestData() {
      try {
        const [resItems, resDrops] = await Promise.all([
          fetch('https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json'),
          fetch('https://raw.githubusercontent.com/WFCD/warframe-drop-data/gh-pages/data/pc/dropData.json')
        ]);
        if (resItems.ok) setAllItems(await resItems.json());
        if (resDrops.ok) setDropsData(await resDrops.json());
      } catch (err) {
        console.error('Erro ao carregar dados de teste de drops:', err);
      } finally {
        setLoadingDrops(false);
      }
    }
    fetchDropsTestData();
  }, []);

  const cleanItemName = (name: string) => {
    if (!name) return '';
    return name.replace(/<[^>]*>?/gm, '').trim();
  };

  const filteredItems = searchTerm.trim() === '' ? [] : allItems.filter((item: any) => {
    return cleanItemName(item.name).toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 10);

  // Extrai todas as categorias disponíveis dinamicamente da base de dados
  const availableCategories = Array.from(new Set(allItems.map((item: any) => item.category || 'Outros'))).sort();

  // Filtra os itens da aba de inspeção com base na categoria selecionada e no termo de busca opcional
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

    const uniqueDrops = Array.from(new Set(foundDrops.map(a => `${a.source}-${a.chance} (${a.type})`)))
      .map(stringKey => foundDrops.find(a => `${a.source}-${a.chance} (${a.type})` === stringKey));

    return uniqueDrops.slice(0, 6);
  };

  const fetchAll = async () => {
    const newResults: Record<string, any> = {};
    await Promise.all(endpoints.map(async (path) => {
      try {
        const res = await fetch(`https://api.warframestat.us/pc/${path}`);
        const data = await res.json();
        newResults[path] = data;
        console.log(`[API Endpoint: ${path}]`, data);
      } catch (e) {
        newResults[path] = { error: 'Falha ao buscar' };
        console.error(`[API Endpoint Error: ${path}]`, e);
      }
    }));
    setResults(newResults);
  };

  const formatData = (path: string, data: any) => {
    if (!formatado) return JSON.stringify(data, null, 2);
    if (data.error) return "Erro ao carregar.";

    switch(path) {
      case 'pc': return `Estado completo carregado (${Object.keys(data).length} categorias)`;
      case 'alerts': return data.map((a: any) => `${a.mission.type}: ${a.mission.reward.asString}`).join('\n');
      case 'arbitration': return `${data.node} | ${data.enemy} (${data.type})`;
      case 'archonHunt': return `${data.boss} | ${data.faction}`;
      case 'cetusCycle': return `${data.isDay ? 'DIA' : 'NOITE'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'constructionProgress': return `Fomorian: ${data.fomorianProgress}% | Razorback: ${data.razorbackProgress}%`;
      case 'dailyDeals': return data.map((d: any) => `${d.item}: ${d.discount}% off`).join('\n');
      case 'darkSectors': return `Total de Setores: ${data.length}`;
      case 'duviriCycle': return `Estado: ${data.state} | Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'earthCycle': return `${data.isDay ? 'DIA' : 'NOITE'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'events': return data.map((e: any) => e.description).join('\n');
      case 'fissures': return `Total de Fissuras Ativas: ${data.length}`;
      case 'flashMissions': return data.length > 0 ? "Existem missões flash ativas" : "Nenhuma";
      case 'invasions': return `Total de Invasões: ${data.length}`;
      case 'news': return data.map((n: any) => n.message).slice(0, 3).join('\n---\n');
      case 'nightwave': return `Ativo: ${data.active ? 'SIM' : 'NÃO'}`;
      case 'outposts': return data.mission ? `Local: ${data.mission.node}` : "Nenhum posto ativo";
      case 'rivens': return `Total de dados Riven: ${data.length}`;
      case 'sortie': return `${data.boss} | Facção: ${data.faction}`;
      case 'steelPath': return `Incursão: ${data.currentReward ? 'Ativa' : 'Não'}`;
      case 'syndicateMissions': return `Total de Sindicatos: ${data.length}`;
      case 'vallisCycle': return `${data.isWarm ? 'QUENTE' : 'FRIO'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'voidTrader': return `${data.character} em ${data.location} | Ativo: ${data.active ? 'SIM' : 'NÃO'}`;
      default: return JSON.stringify(data).slice(0, 100) + "...";
    }
  };

  return (
    <div className="p-6 bg-gray-950 text-white min-h-screen">
      
      {/* Abas de Navegação */}
      <div className="flex gap-2 mb-4 border-b border-gray-800 pb-3 flex-wrap">
        <button 
          onClick={() => setActiveSubTab('endpoints')} 
          className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${activeSubTab === 'endpoints' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
        >
          Explorador de Endpoints (API Status)
        </button>
        <button 
          onClick={() => setActiveSubTab('dropsTest')} 
          className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${activeSubTab === 'dropsTest' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
        >
          Testador de Busca / Drops (Raw vs Tratado)
        </button>
        <button 
          onClick={() => setActiveSubTab('itemInspector')} 
          className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${activeSubTab === 'itemInspector' ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
        >
          🔍 Inspecionador por Categoria (JSON Console)
        </button>
      </div>

      {activeSubTab === 'endpoints' ? (
        <>
          <div className="flex gap-4 mb-6 sticky top-0 bg-gray-950 p-4 z-10 border-b border-gray-800">
            <button onClick={fetchAll} className="bg-blue-600 px-4 py-2 rounded text-sm font-bold uppercase hover:bg-blue-500 transition">Carregar Tudo</button>
            <button onClick={() => setFormatado(!formatado)} className="bg-green-600 px-4 py-2 rounded text-sm font-bold uppercase hover:bg-green-500 transition">
              {formatado ? 'Modo Bruto' : 'Modo Formatado'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endpoints.map((path) => (
              <div key={path} className="bg-gray-900 p-4 rounded border border-gray-700 shadow-lg">
                <h2 className="text-blue-400 font-bold mb-2 uppercase text-xs truncate">{path}</h2>
                <pre className="text-[10px] whitespace-pre-wrap max-h-60 overflow-y-auto bg-black p-2 rounded border border-gray-800 text-gray-300">
                  {results[path] ? formatData(path, results[path]) : 'Pressione "Carregar Tudo"'}
                </pre>
              </div>
            ))}
          </div>
        </>
      ) : activeSubTab === 'dropsTest' ? (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex flex-col gap-2 relative overflow-visible z-50">
            <label className="block text-xs text-gray-400">Ambiente de Teste - Buscar Item na Base de Dados:</label>
            <input
              type="text"
              placeholder={loadingDrops ? "Carregando bases de dados..." : "Digite o nome para inspecionar..."}
              disabled={loadingDrops}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-sm rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />

            {filteredItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
                {filteredItems.map((item: any) => {
                  const cleanName = cleanItemName(item.name);
                  return (
                    <div 
                      key={item.uniqueName}
                      onClick={() => {
                        if (!selectedDropItems.some(i => i.uniqueName === item.uniqueName)) {
                          const newItem = { ...item, cleanName };
                          setSelectedDropItems([...selectedDropItems, newItem]);
                          console.log('[Item Selecionado - Objeto Bruto]', item);
                          console.log('[Item Selecionado - String Tratada]', cleanName);
                        }
                        setSearchTerm('');
                      }}
                      className="flex justify-between items-center px-3 py-2.5 text-xs hover:bg-blue-600/20 cursor-pointer border-b border-gray-900 last:border-none transition"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{cleanName}</span>
                        <span className="text-[9px] text-gray-500 font-mono">Raw: {item.name}</span>
                      </div>
                      <span className="text-blue-400 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">Testar ➕</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-col gap-2 min-h-[220px]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens em Teste (Comparativo Bruto vs Tratado)</h4>
              {selectedDropItems.length === 0 ? (
                <p className="text-xs text-gray-500 italic my-auto text-center">Nenhum item selecionado para teste.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {selectedDropItems.map((item) => (
                    <div key={item.uniqueName} className="flex flex-col gap-1 bg-gray-800/60 p-2.5 rounded border border-gray-700/50 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-400 font-semibold">Tratado: {item.cleanName}</span>
                        <button onClick={() => setSelectedDropItems(selectedDropItems.filter(i => i.uniqueName !== item.uniqueName))} className="text-red-400 font-bold">Remover ✕</button>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono bg-black/40 p-1 rounded">Bruto (API/JSON): {item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-col gap-2 min-h-[220px]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resultado da Varredura de Drops</h4>
              {selectedDropItems.length === 0 ? (
                <p className="text-xs text-gray-500 italic my-auto text-center">Selecione itens ao lado para inspecionar os drops.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                  {selectedDropItems.map((item) => {
                    const drops = getDropsForItem(item.cleanName);
                    return (
                      <div key={item.uniqueName} className="bg-gray-950/60 p-2.5 rounded border border-gray-800 flex flex-col gap-1.5 text-xs">
                        <span className="font-bold text-blue-400 border-b border-gray-800 pb-1">{item.cleanName}</span>
                        {drops.length === 0 ? (
                          <span className="text-[11px] text-gray-500 italic">Nenhum drop encontrado na base oficial.</span>
                        ) : (
                          drops.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] text-gray-300">
                              <span>📍 {d.source} ({d.type})</span>
                              <span className="font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">{d.chance}</span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* NOVA ABA: Inspecionador por Categoria */
        <div className="flex flex-col gap-4">
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl flex flex-col gap-3">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Inspecionador de Itens por Categoria</h3>
            <p className="text-xs text-gray-400">
              Selecione uma categoria abaixo (como <code className="text-purple-300">Misc</code>) para listar todos os itens dela. Clique em qualquer item para logar o JSON completo no console (<kbd>F12</kbd>).
            </p>
            
            <div className="flex flex-col md:flex-row gap-3">
              {/* Seletor de Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setInspectedItem(null);
                }}
                className="bg-gray-950 border border-purple-500/40 text-xs rounded-lg p-2.5 text-purple-200 outline-none font-bold"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>Categoria: {cat}</option>
                ))}
              </select>

              {/* Filtro interno de busca na categoria */}
              <input
                type="text"
                placeholder={`Filtrar dentro de "${selectedCategory}"...`}
                value={inspectorSearch}
                onChange={(e) => setInspectorSearch(e.target.value)}
                className="flex-1 bg-gray-950 border border-purple-500/40 text-xs rounded-lg p-2.5 text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lista da Categoria Selecionada */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase">
                Itens em [{selectedCategory}] ({filteredInspectorItems.length})
              </h4>
              <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
                {loadingDrops ? (
                  <p className="text-xs text-gray-500 text-center py-6">Carregando base de itens...</p>
                ) : filteredInspectorItems.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Nenhum item encontrado nesta categoria.</p>
                ) : (
                  filteredInspectorItems.map((item: any) => (
                    <div
                      key={item.uniqueName}
                      onClick={() => {
                        setInspectedItem(item);
                        console.log('====================================');
                        console.log(`[CATEGORIA: ${selectedCategory}] ITEM:`, item.name, item);
                        console.log('====================================');
                      }}
                      className={`p-2.5 rounded text-xs cursor-pointer flex justify-between items-center border transition ${
                        inspectedItem?.uniqueName === item.uniqueName 
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200' 
                          : 'bg-gray-950/60 border-gray-800 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{cleanItemName(item.name)}</span>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {item.uniqueName}</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Inspecionar 🔍</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Exibição do JSON do Item Selecionado */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-purple-400 uppercase">JSON Bruto do Item</h4>
                {inspectedItem && (
                  <button 
                    onClick={() => console.log('JSON Inspecionado:', inspectedItem)}
                    className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded"
                  >
                    Logar no Console Novamente
                  </button>
                )}
              </div>
              
              {!inspectedItem ? (
                <div className="text-center py-20 text-gray-500 text-xs border border-dashed border-gray-800 rounded-lg my-auto">
                  Nenhum item selecionado. Clique em algum item da lista ao lado para ver o JSON completo!
                </div>
              ) : (
                <pre className="text-[10px] whitespace-pre-wrap max-h-96 overflow-y-auto bg-black p-3 rounded border border-gray-800 text-purple-300 font-mono">
                  {JSON.stringify(inspectedItem, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}