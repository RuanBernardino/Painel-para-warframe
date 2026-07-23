'use client';
import { useState, useEffect } from 'react';

// Categorias permitidas
const ALLOWED_CATEGORIES = [
  'Primary', 'Secondary', 'Melee', 'Sentinel', 
  'Warframe', 'Arch-gun', 'Arch-melee', 'Archwing', 
  'Railjack', 'Misc', 'Arcanes', 'Fish'
];

// Mapeamento de recursos comuns para seus respectivos planetas/fontes no Warframe
const RESOURCE_PLANETS: { [key: string]: string } = {
  'hexenon': 'Júpiter (Disruption / Missões em Júpiter)',
  'nano spores': 'Saturno, Júpiter, Eris, Neptune',
  'neurodes': 'Terra, Eris, Deimos, Lua',
  'orokin cell': 'Saturno, Ceres',
  'plastids': 'Saturno, Urano, Fobos, Pluto, Eris',
  'polymer bundle': 'Mercúrio, Vênus, Urano',
  'circuits': 'Venus, Ceres',
  'alloy plate': 'Vênus, Fobos, Pluto, Ceres',
  'rubedo': 'Fobos, Terra, Pluto, Europa, Sedna, Lua, Void',
  'morphics': 'Mercúrio, Marte, Pluto, Europa',
  'gallium': 'Marte, Urano',
  'control module': 'Fobos, Europa, Void',
  'argon crystal': 'Void',
  'tellurium': 'Urano, Archwing, Grineer Sealab',
  'oxium': 'Corpus (Missões Corpus em geral)',
  'cryotic': 'Escavações (Excavation) em vários planetas'
};

export default function DropSearchTab({ 
  initialSearch = '', 
  onConsumeInitialSearch 
}: { 
  initialSearch?: string; 
  onConsumeInitialSearch?: () => void; 
}) {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [dropsData, setDropsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

  const [selectedDropItems, setSelectedDropItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_selected_drop_list');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const cleanItemName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/<[^>]*>?/gm, '')
      .replace(/&amp;/g, '&')
      .trim();
  };

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    localStorage.setItem('warframe_selected_drop_list', JSON.stringify(selectedDropItems));
  }, [selectedDropItems]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resItems, resDrops] = await Promise.all([
          fetch('https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json'),
          fetch('https://raw.githubusercontent.com/WFCD/warframe-drop-data/gh-pages/data/pc/dropData.json')
        ]);
        
        if (resItems.ok) {
          const itemsJson = await resItems.json();
          
          const filteredBaseItems = itemsJson.filter((i: any) => {
            const category = i.category || '';
            const rawName = cleanItemName(i.name || '').toLowerCase();

            if (!ALLOWED_CATEGORIES.includes(category)) return false;

            if (rawName.includes('animation') || rawName.includes('glyph') || category.toLowerCase().includes('animation') || category.toLowerCase().includes('glyph')) {
              return false;
            }

            return true;
          });

          setAllItems(filteredBaseItems);

          if (initialSearch) {
            const found = filteredBaseItems.find((i: any) => 
              cleanItemName(i.name).toLowerCase().includes(initialSearch.toLowerCase())
            );
            if (found) {
              setSelectedDropItems(prev => {
                if (!prev.some(p => p.uniqueName === found.uniqueName)) {
                  return [...prev, found];
                }
                return prev;
              });
              setExpandedItems(prev => ({ ...prev, [found.uniqueName]: false }));
              setSearchTerm('');
            }
            
            if (onConsumeInitialSearch) {
              onConsumeInitialSearch();
            }
          }
        }

        if (resDrops.ok) {
          const dropsJson = await resDrops.json();
          setDropsData(dropsJson);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [initialSearch]);

  const filteredItems = searchTerm.trim() === '' ? [] : allItems.filter((item: any) => {
    const cleanName = cleanItemName(item.name);
    const nameLower = cleanName.toLowerCase();
    const category = item.category || '';

    if (!ALLOWED_CATEGORIES.includes(category)) return false;
    if (nameLower.includes('animation') || nameLower.includes('glyph')) return false;

    return nameLower.includes(searchTerm.toLowerCase());
  }).slice(0, 10);

  const addItemToList = (item: any) => {
    const nameLower = cleanItemName(item.name).toLowerCase();
    const category = item.category || '';

    if (!ALLOWED_CATEGORIES.includes(category) || nameLower.includes('animation') || nameLower.includes('glyph')) {
      return; 
    }

    if (!selectedDropItems.some(i => i.uniqueName === item.uniqueName)) {
      setSelectedDropItems([...selectedDropItems, item]);
      setExpandedItems(prev => ({ ...prev, [item.uniqueName]: false }));
    }
    searchBarReset: setSearchTerm('');
  };

  const removeItemFromList = (uniqueName: string) => {
    setSelectedDropItems(selectedDropItems.filter(i => i.uniqueName !== uniqueName));
  };

  const toggleExpand = (uniqueName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [uniqueName]: !prev[uniqueName]
    }));
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const getDropsForItem = (item: any) => {
    if (!item) return [];
    
    const itemNameClean = cleanItemName(item.name);
    const itemNameLower = itemNameClean.toLowerCase();
    
    const targets: string[] = [itemNameLower];
    const foundDrops: any[] = [];
    const componentQuantities: { [key: string]: number } = {};

    const extractDropObject = (d: any, defaultResourceName: string, iconDefault: string) => {
      const loc = cleanItemName(d.location || d.place || d.source || 'Local Desconhecido');
      
      // Normaliza o nome do recurso removendo quantidades numéricas explícitas (ex: "200X Nano Spores" vira "Nano Spores")
      let dropResourceName = cleanItemName(d.type || d.item || defaultResourceName);
      dropResourceName = dropResourceName.replace(/^\d+x\s*/i, '').trim();
      
      if (!loc.toLowerCase().includes('hallowed')) {
        foundDrops.push({
          source: loc,
          resourceName: dropResourceName,
          chanceNum: d.chance !== undefined ? Number(d.chance) : 0,
          chance: d.chance !== undefined ? Number(d.chance) : 0,
          icon: iconDefault
        });
      }
    };

    // 1. Varre os componentes com tratamento correto para o índice 0 (Blueprint principal)
    if (item.components && Array.isArray(item.components)) {
      item.components.forEach((comp: any, index: number) => {
        let compName = cleanItemName(comp.name || '');
        if (!compName) return;

        if (index === 0) {
          if (!compName.toLowerCase().includes(itemNameLower)) {
            compName = `${itemNameClean} Blueprint`;
          }
        }

        targets.push(compName.toLowerCase());
        if (comp.itemCount) {
          componentQuantities[compName.toLowerCase()] = comp.itemCount;
        }
        
        if (comp.drops && Array.isArray(comp.drops) && comp.drops.length > 0) {
          comp.drops.forEach((d: any) => {
            extractDropObject(d, compName, index === 0 ? '📜' : '📦');
          });
        }
      });
    }

    // 2. Verifica drops diretos no item principal
    if (item.drops && Array.isArray(item.drops)) {
      item.drops.forEach((d: any) => {
        extractDropObject(d, `${itemNameClean} Blueprint`, '📜');
      });
    }

    // 3. Varredura global (Mission Rewards e EnemyDrops)
    if (dropsData) {
      if (dropsData.missionRewards) {
        Object.entries(dropsData.missionRewards).forEach(([planetNode, missionData]: [string, any]) => {
          const cleanPlanetNode = cleanItemName(planetNode);
          if (missionData.rewards) {
            Object.entries(missionData.rewards).forEach(([rot, rewardsList]: [string, any]) => {
              if (Array.isArray(rewardsList)) {
                rewardsList.forEach((reward: any) => {
                  if (reward.item) {
                    let cleanRewardItem = cleanItemName(reward.item);
                    cleanRewardItem = cleanRewardItem.replace(/^\d+x\s*/i, '').trim();
                    const rewardNameLower = cleanRewardItem.toLowerCase();
                    const matchedTarget = targets.find(t => rewardNameLower === t || rewardNameLower.includes(t) || t.includes(rewardNameLower));
                    if (matchedTarget) {
                      foundDrops.push({
                        source: `${cleanPlanetNode} (${rot.toUpperCase()})`,
                        resourceName: cleanRewardItem,
                        chanceNum: reward.chance || 0,
                        chance: reward.chance !== undefined ? reward.chance : 0,
                        icon: '📍'
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
          const cleanEnemyName = cleanItemName(enemy.enemyName || 'Inimigo Desconhecido');
          if (enemy.drops) {
            enemy.drops.forEach((drop: any) => {
              if (drop.item) {
                let cleanDropItem = cleanItemName(drop.item);
                cleanDropItem = cleanDropItem.replace(/^\d+x\s*/i, '').trim();
                const dropNameLower = cleanDropItem.toLowerCase();
                const matchedTarget = targets.find(t => dropNameLower === t || dropNameLower.includes(t) || t.includes(dropNameLower));
                
                if (matchedTarget) {
                  foundDrops.push({
                    source: `Inimigo: ${cleanEnemyName}`,
                    resourceName: cleanDropItem,
                    chanceNum: drop.chance || 0,
                    chance: drop.chance !== undefined ? drop.chance : 0,
                    icon: '👾'
                  });
                }
              }
            });
          }
        });
      }
    }

    // Fallback inteligente para componentes sem drop direto listado (recursos comuns)
    if (item.components && Array.isArray(item.components)) {
      item.components.forEach((comp: any, index: number) => {
        let compName = cleanItemName(comp.name || '');
        if (!compName) return;
        if (index === 0 && !compName.toLowerCase().includes(itemNameLower)) {
          compName = `${itemNameClean} Blueprint`;
        }
        
        const compNameLower = compName.toLowerCase();
        const hasAnyDrop = foundDrops.some(d => d.resourceName.toLowerCase() === compNameLower);
        
        if (!hasAnyDrop) {
          const mappedPlanet = RESOURCE_PLANETS[compNameLower];
          const sourceText = mappedPlanet ? `Planeta de Drop: ${mappedPlanet}` : 'Local de Coleta Padrão do Planeta / Sistema';

          foundDrops.push({
            source: index === 0 ? 'Local de Drop / Pesquisa / Mercado' : sourceText,
            resourceName: compName,
            chanceNum: -999,
            chance: -999,
            icon: index === 0 ? '📜' : '🪐'
          });
        }
      });
    }

    // Consolida entradas repetidas para o mesmo recurso + mesma fonte, somando as porcentagens
    const consolidatedMap = new Map();
    foundDrops.forEach(d => {
      const key = `${d.source}-${d.resourceName}`;
      if (consolidatedMap.has(key)) {
        const existing = consolidatedMap.get(key);
        if (existing.chanceNum > 0 && d.chanceNum > 0) {
          existing.chanceNum += d.chanceNum;
          existing.chance = existing.chanceNum;
        }
      } else {
        consolidatedMap.set(key, { ...d });
      }
    });

    // Formata a exibição final da porcentagem
    return Array.from(consolidatedMap.values()).map(d => ({
      ...d,
      chance: d.chance === -999 ? 'Disponível' : `${Number(d.chance).toFixed(2)}%`
    })).sort((a, b) => b.chanceNum - a.chanceNum);
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200 max-w-4xl mx-auto w-full">
      
      {/* BARRA DE PESQUISA COM LISTA FLUTUANTE */}
      <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex flex-col gap-2 relative overflow-visible z-50">
        <label className="block text-xs text-gray-400">Buscar Item na Base de Dados do Jogo:</label>
        <input
          type="text"
          placeholder={loading ? "Carregando base de dados do Warframe..." : "Digite o nome (ex: Acceltra, Rhino, Soma Prime)..."}
          disabled={loading}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 text-sm rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />

        {filteredItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
            {filteredItems.map((item: any) => {
              const displayName = cleanItemName(item.name);
              const itemCategory = item.category || 'Misc';
              return (
                <div 
                  key={item.uniqueName}
                  onClick={() => addItemToList(item)}
                  className="flex justify-between items-center px-3 py-2.5 text-xs hover:bg-blue-600/20 cursor-pointer border-b border-gray-900 last:border-none transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{displayName}</span>
                    <span className="text-[9px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">{itemCategory}</span>
                  </div>
                  <span className="text-blue-400 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">Adicionar ➕</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BLOCO ÚNICO DE ITENS SELECIONADOS E SEUS DROPS */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens Rastreados e Locais de Drop</h4>
        
        {selectedDropItems.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-8 text-center">Nenhum item adicionado à consulta. Use a busca acima para rastrear armas, warframes ou recursos!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedDropItems.map((item) => {
              const displayName = cleanItemName(item.name);
              const itemCategory = item.category || 'Misc';
              const drops = getDropsForItem(item);
              const isExpanded = !!expandedItems[item.uniqueName];

              const componentQuantities: { [key: string]: number } = {};
              if (item.components && Array.isArray(item.components)) {
                item.components.forEach((comp: any, index: number) => {
                  let compName = cleanItemName(comp.name || '');
                  if (!compName) return;
                  if (index === 0 && !compName.toLowerCase().includes(displayName.toLowerCase())) {
                    compName = `${displayName} Blueprint`;
                  }
                  if (comp.itemCount) {
                    componentQuantities[compName.toLowerCase()] = comp.itemCount;
                  }
                });
              }

              const groupedDrops = drops.reduce((acc: any, drop: any) => {
                const compKey = drop.resourceName || 'Outros';
                if (!acc[compKey]) {
                  acc[compKey] = [];
                }
                acc[compKey].push(drop);
                return acc;
              }, {});

              return (
                <div key={item.uniqueName} className="bg-gray-950/70 border border-gray-800 rounded-lg overflow-hidden transition">
                  
                  {/* CABEÇALHO DO ITEM */}
                  <div className="flex justify-between items-center p-3 bg-gray-900/80 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-bold text-sm text-blue-400 break-words">{displayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800 shrink-0">
                        {itemCategory}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800 shrink-0">
                        {drops.length} locais
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleExpand(item.uniqueName)}
                        className="text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition"
                      >
                        {isExpanded ? 'Ocultar ▲' : 'Mostrar ▼'}
                      </button>

                      <button 
                        onClick={() => removeItemFromList(item.uniqueName)}
                        className="text-red-400 hover:text-white font-bold px-2 py-1 bg-red-500/10 hover:bg-red-600 rounded transition text-xs"
                        title="Remover item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* CONTEÚDO DOS DROPS ORGANIZADOS POR GRUPOS DE COMPONENTES */}
                  {isExpanded && (
                    <div className="p-3 flex flex-col gap-4 border-t border-gray-800/60 bg-gray-950/30 max-h-80 overflow-y-auto pr-1">
                      {Object.keys(groupedDrops).length === 0 ? (
                        <span className="text-xs text-gray-500 italic">Este item não possui locais de drop válidos registrados nas tabelas oficiais.</span>
                      ) : (
                        Object.entries(groupedDrops).map(([componentName, componentDrops]: [string, any]) => {
                          const groupUniqueKey = `${item.uniqueName}-${componentName}`;
                          const isGroupCollapsed = !!collapsedGroups[groupUniqueKey];
                          const requiredQty = componentQuantities[componentName.toLowerCase()];

                          return (
                            <div key={componentName} className="flex flex-col gap-2 bg-gray-900/30 p-2.5 rounded-lg border border-gray-800/50">
                              
                              <div className="flex items-center justify-between text-xs font-bold text-green-400 border-b border-gray-800/80 pb-1.5">
                                <div className="flex items-center gap-2">
                                  <span>{componentName.toLowerCase().includes('blueprint') ? '📜' : '📦'}</span>
                                  <span>{componentName}</span>
                                  {requiredQty && (
                                    <span className="text-[10px] font-mono text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                      Qtd: {requiredQty}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                                    {(componentDrops as any[]).length} locais
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleGroupCollapse(groupUniqueKey)}
                                  className="text-[10px] font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white px-2 py-0.5 rounded transition"
                                >
                                  {isGroupCollapsed ? 'Expandir ▼' : 'Recolher ▲'}
                                </button>
                              </div>

                              {!isGroupCollapsed && (
                                <div className="flex flex-col gap-1.5">
                                  {(componentDrops as any[]).map((d: any, i: number) => (
                                    <div key={i} className="bg-gray-950/50 p-2 rounded border border-gray-800/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                                      <div className="text-gray-200 font-medium leading-relaxed">
                                        {d.icon} <span className="text-gray-100">{d.source}</span>
                                      </div>
                                      <div className="flex justify-between items-center sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-800/50 shrink-0">
                                        <span className="font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shrink-0">
                                          {d.chance}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}