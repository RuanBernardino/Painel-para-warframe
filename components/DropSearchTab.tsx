'use client';
import { useState, useEffect } from 'react';

const ALLOWED_CATEGORIES = [
  'Primary', 'Secondary', 'Melee', 'Sentinel', 
  'Warframe', 'Warframes', 'Suits', 'Arch-gun', 'Arch-melee', 'Archwing', 
  'Railjack', 'Misc', 'Arcanes', 'Fish'
];

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
            const category = (i.category || '').toLowerCase();
            const type = (i.type || '').toLowerCase();
            const rawName = cleanItemName(i.name || '').toLowerCase();
            const uniqueName = (i.uniqueName || '').toLowerCase();

            if (
              uniqueName.includes('/recipes/') || 
              uniqueName.includes('/store/') ||
              uniqueName.includes('/powers/') ||
              category === 'abilities' ||
              type === 'abilities' ||
              rawName.includes('chassis blueprint') ||
              rawName.includes('neuroptics blueprint') ||
              rawName.includes('systems blueprint')
            ) {
              return false;
            }

            const isAllowed = ALLOWED_CATEGORIES.some(c => 
              category === c.toLowerCase() || 
              type === c.toLowerCase() || 
              category.includes('warframe') || 
              type.includes('warframe') ||
              category.includes('suit') ||
              type.includes('suit')
            );

            if (!isAllowed) return false;

            if (
              rawName.includes('animation') || 
              rawName.includes('glyph') || 
              rawName.includes('sigil') || 
              rawName.includes('k-drive') ||
              rawName.includes('specter') ||
              rawName.includes('kuaka') ||
              rawName.includes('skin') ||
              rawName.includes('helmet') ||
              category.includes('skins') ||
              type.includes('skins') ||
              category.includes('helmet') ||
              type.includes('helmet')
            ) {
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
    const cleanName = cleanItemName(item.name).toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    return cleanName.includes(term);
  }).sort((a, b) => {
    const nameA = cleanItemName(a.name).toLowerCase();
    const nameB = cleanItemName(b.name).toLowerCase();
    const term = searchTerm.toLowerCase().trim();
    
    const aStartsWith = nameA.startsWith(term);
    const bStartsWith = nameB.startsWith(term);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    return nameA.localeCompare(nameB);
  }).slice(0, 10);

  const addItemToList = (item: any) => {
    if (!selectedDropItems.some(i => i.uniqueName === item.uniqueName)) {
      setSelectedDropItems([...selectedDropItems, item]);
      setExpandedItems(prev => ({ ...prev, [item.uniqueName]: false }));
    }
    setSearchTerm('');
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

  const getDetailedComponentData = (item: any) => {
    if (!item) return [];
    
    const itemNameClean = cleanItemName(item.name);
    const itemNameLower = itemNameClean.toLowerCase();
    const isPrimeItem = itemNameLower.includes('prime');
    const componentList: any[] = [];

    const extractDropObject = (d: any, defaultResourceName: string, iconDefault: string) => {
      const loc = cleanItemName(d.location || d.place || d.source || 'Local Desconhecido');
      
      let dropResourceName = cleanItemName(d.type || d.item || defaultResourceName);
      dropResourceName = dropResourceName.replace(/^\d+x\s*/i, '').trim();
      
      if (!loc.toLowerCase().includes('hallowed')) {
        let detectedTier = '';
        let detectedRelicName = '';
        const locLower = loc.toLowerCase();
        if (locLower.includes('lith')) detectedTier = 'Lith';
        else if (locLower.includes('meso')) detectedTier = 'Meso';
        else if (locLower.includes('neo')) detectedTier = 'Neo';
        else if (locLower.includes('axi')) detectedTier = 'Axi';
        else if (locLower.includes('requiem')) detectedTier = 'Requiem';

        return {
          source: loc,
          resourceName: dropResourceName,
          chanceNum: d.chance !== undefined ? Number(d.chance) : 0,
          chance: d.chance !== undefined ? Number(d.chance) : 0,
          icon: iconDefault,
          isRelic: locLower.includes('relíquia') || locLower.includes('void') || detectedTier !== '',
          tier: detectedTier,
          relicNameStr: detectedRelicName
        };
      }
      return null;
    };

    if (item.components && Array.isArray(item.components)) {
      item.components.forEach((comp: any, index: number) => {
        let compName = cleanItemName(comp.name || '');
        if (!compName) return;

        if (compName.toLowerCase() === 'blueprint' || (index === 0 && !compName.toLowerCase().includes(itemNameLower))) {
          compName = `${itemNameClean} Blueprint`;
        }

        const compNameLower = compName.toLowerCase();
        const foundDrops: any[] = [];

        if (comp.drops && Array.isArray(comp.drops) && comp.drops.length > 0) {
          comp.drops.forEach((d: any) => {
            const parsedDrop = extractDropObject(d, compName, compName.toLowerCase().includes('blueprint') ? '📜' : '📦');
            if (parsedDrop) foundDrops.push(parsedDrop);
          });
        }

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
                        
                        if (rewardNameLower === compNameLower || rewardNameLower.includes(compNameLower) || compNameLower.includes(rewardNameLower)) {
                          let targetResName = cleanRewardItem;
                          if (rewardNameLower === 'blueprint') {
                            targetResName = compName;
                          }
                          foundDrops.push({
                            source: `${cleanPlanetNode} (${rot.toUpperCase()})`,
                            resourceName: targetResName,
                            chanceNum: reward.chance || 0,
                            chance: reward.chance !== undefined ? reward.chance : 0,
                            icon: '📍',
                            isRelic: false
                          });
                        }
                      }
                    });
                  }
                });
              }
            });
          }

          const searchRelics = (relicsList: any[]) => {
            if (!Array.isArray(relicsList)) return;
            relicsList.forEach((relic: any) => {
              const relicName = `${relic.tier} ${relic.relicName}`;
              if (relic.rewards) {
                relic.rewards.forEach((r: any) => {
                  const rItem = cleanItemName(r.item || '').toLowerCase();
                  if (rItem === compNameLower || rItem.includes(compNameLower) || compNameLower.includes(rItem)) {
                    foundDrops.push({
                      source: `Relíquia Void: ${relicName} (${r.rarity || 'Comum'})`,
                      resourceName: compName,
                      chanceNum: r.chance || 0,
                      chance: r.chance !== undefined ? r.chance : 0,
                      icon: '✨',
                      isRelic: true,
                      tier: relic.tier,
                      relicNameStr: relic.relicName,
                      rarity: r.rarity || 'Comum'
                    });
                  }
                });
              }
            });
          };

          if (dropsData.relics) {
            searchRelics(dropsData.relics);
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
                    
                    if (dropNameLower === compNameLower || dropNameLower.includes(compNameLower) || compNameLower.includes(dropNameLower)) {
                      let targetResName = cleanDropItem;
                      if (dropNameLower === 'blueprint') {
                        targetResName = compName;
                      }
                      foundDrops.push({
                        source: `Chefes / Inimigo: ${cleanEnemyName}`,
                        resourceName: targetResName,
                        chanceNum: drop.chance || 0,
                        chance: drop.chance !== undefined ? drop.chance : 0,
                        icon: '👾',
                        isRelic: false
                      });
                    }
                  }
                });
              }
            });
          }
        }

        if (foundDrops.length === 0) {
          const mappedPlanet = RESOURCE_PLANETS[compNameLower];
          const sourceText = isPrimeItem 
            ? 'Disponível em Relíquias Void (Verifique o Codex)' 
            : (mappedPlanet ? `Planeta de Drop: ${mappedPlanet}` : 'Local de Coleta / Pesquisa / Mercado');

          foundDrops.push({
            source: isPrimeItem ? 'Relíquia Void (Ativa ou Descontinuada)' : sourceText,
            resourceName: compName,
            chanceNum: -999,
            chance: -999,
            icon: isPrimeItem ? '✨' : '🪐',
            isRelic: false
          });
        }

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

        const formattedDrops = Array.from(consolidatedMap.values()).map(d => ({
          ...d,
          chance: d.chance === -999 ? 'Disponível' : `${Number(d.chance).toFixed(2)}%`
        })).sort((a, b) => {
          if (a.isRelic && b.isRelic) {
            const tierOrder: { [key: string]: number } = { 'Lith': 1, 'Meso': 2, 'Neo': 3, 'Axi': 4, 'Requiem': 5 };
            const orderA = tierOrder[a.tier] || 99;
            const orderB = tierOrder[b.tier] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.source.localeCompare(b.source);
          }
          if (a.isRelic && !b.isRelic) return -1;
          if (!a.isRelic && b.isRelic) return 1;
          
          return b.chanceNum - a.chanceNum;
        });

        const craftIngredients: any[] = [];
        if (comp.components && Array.isArray(comp.components)) {
          comp.components.forEach((ing: any) => {
            craftIngredients.push({
              name: cleanItemName(ing.name || 'Recurso'),
              count: ing.itemCount || 1
            });
          });
        }

        componentList.push({
          componentName: compName,
          itemCount: comp.itemCount || 1,
          buildPrice: comp.buildPrice || 0,
          buildTime: comp.buildTime || 0,
          drops: formattedDrops,
          craftIngredients: craftIngredients
        });
      });
    }

    return componentList;
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200 max-w-4xl mx-auto w-full">
      
      {/* BARRA DE PESQUISA */}
      <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex flex-col gap-2 relative overflow-visible z-50">
        <label className="block text-xs text-gray-400">Buscar Warframe ou Item:</label>
        <input
          type="text"
          placeholder={loading ? "Carregando base de dados..." : "Digite o nome (ex: Excalibur, Rhino Prime, Saryn)..."}
          disabled={loading}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 text-sm rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />

        {filteredItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
            {filteredItems.map((item: any) => {
              const displayName = cleanItemName(item.name);
              const itemCategory = item.category || item.type || 'Misc';
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

      {/* PAINEL DE ITENS SELECIONADOS */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens Rastreados (Warframes & Primes)</h4>
        
        {selectedDropItems.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-8 text-center">Nenhum item adicionado à consulta. Busque por Excalibur, Rhino Prime, etc.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedDropItems.map((item) => {
              const displayName = cleanItemName(item.name);
              const itemCategory = item.category || item.type || 'Misc';
              const componentDetails = getDetailedComponentData(item);
              const isExpanded = !!expandedItems[item.uniqueName];

              return (
                <div key={item.uniqueName} className="bg-gray-950/70 border border-gray-800 rounded-lg overflow-hidden transition">
                  
                  <div className="flex justify-between items-center p-3 bg-gray-900/80 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-bold text-sm text-blue-400 break-words">{displayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800 shrink-0">
                        {itemCategory}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800 shrink-0">
                        {componentDetails.length} partes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleExpand(item.uniqueName)}
                        className="text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition"
                      >
                        {isExpanded ? 'Ocultar Partes ▲' : 'Mostrar Partes ▼'}
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

                  {isExpanded && (
                    <div className="p-3 flex flex-col gap-4 border-t border-gray-800/60 bg-gray-950/30 max-h-[32rem] overflow-y-auto pr-1">
                      {componentDetails.length === 0 ? (
                        <span className="text-xs text-gray-500 italic">Este item não possui componentes registrados.</span>
                      ) : (
                        componentDetails.map((comp: any) => {
                          const groupUniqueKey = `${item.uniqueName}-${comp.componentName}`;
                          const isGroupCollapsed = collapsedGroups[groupUniqueKey] !== undefined ? collapsedGroups[groupUniqueKey] : true;

                          return (
                            <div key={comp.componentName} className="flex flex-col gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-800/60">
                              
                              <div className="flex items-center justify-between text-xs font-bold text-green-400 border-b border-gray-800/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span>{comp.componentName.toLowerCase().includes('blueprint') ? '📜' : '⚙️'}</span>
                                  <span className="text-sm text-white">{comp.componentName}</span>
                                  <span className="text-[10px] font-mono text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                    Qtd: {comp.itemCount}
                                  </span>
                                  {comp.buildPrice > 0 && (
                                    <span className="text-[10px] font-mono text-gray-400 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                                      Créditos: {comp.buildPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleGroupCollapse(groupUniqueKey)}
                                  className="text-[10px] font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white px-2 py-1 rounded transition"
                                >
                                  {isGroupCollapsed ? 'Expandir Detalhes ▼' : 'Recolher ▲'}
                                </button>
                              </div>

                              {!isGroupCollapsed && (
                                <div className="flex flex-col gap-3">
                                  
                                  {/* DROPS / RELÍQUIAS ORDENADAS POR NOME/TIER */}
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">📍 Onde Encontrar / Relíquias Void (Ordenadas por Nome/Tier):</span>
                                    {comp.drops.length === 0 ? (
                                      <span className="text-xs text-gray-500 italic pl-2">Nenhum local de drop registrado.</span>
                                    ) : (
                                      <div className="flex flex-col gap-1 pl-1">
                                        {comp.drops.map((d: any, i: number) => (
                                          <div key={i} className="bg-gray-950/60 p-2 rounded border border-gray-800/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                                            <div className="text-gray-200 font-medium leading-relaxed">
                                              {d.icon} <span className="text-gray-100">{d.source}</span>
                                            </div>
                                            <span className="font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shrink-0 self-start sm:self-auto">
                                              {d.chance}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* MATERIAIS DE CRAFT */}
                                  <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-800/40">
                                    <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">🛠️ Materiais para Construir na Fundição:</span>
                                    {comp.craftIngredients.length === 0 ? (
                                      <span className="text-xs text-gray-500 italic pl-2">Esta parte não exige materiais adicionais de fundição.</span>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                                        {comp.craftIngredients.map((ing:any, i: number) => (
                                          <div key={i} className="bg-gray-950/60 p-2 rounded border border-gray-800/60 flex justify-between items-center text-xs">
                                            <span className="text-gray-300 font-medium">📦 {ing.name}</span>
                                            <span className="font-mono text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 shrink-0">
                                              x{ing.count}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

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