'use client';
import { useState, useEffect } from 'react';

export default function ResourceCalculatorTab({ 
  onSelectResource 
}: { 
  onSelectResource?: (resourceName: string) => void; 
}) {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar a ordenação da lista de compras ('desc' = maior ➔ menor, 'asc' = menor ➔ maior)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Estado para controlar quais itens da wishlist estão expandidos (padrão: fechados = false)
  const [expandedWishlist, setExpandedWishlist] = useState<{ [key: string]: boolean }>({});
  
  const [wishlist, setWishlist] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_crafting_wishlist');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('warframe_crafting_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    async function fetchWarframeItems() {
      try {
        const res = await fetch('https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json');
        if (!res.ok) return;
        const data = await res.json();
        const craftableItems = data.filter((item: any) => item.components && item.components.length > 0);
        setItems(craftableItems);
      } catch (err) {
        console.error('Erro ao buscar itens do Warframe:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWarframeItems();
  }, []);

  const filteredItems = searchTerm.trim() === '' ? [] : items.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const handleAddWishlist = (item: any) => {
    if (!wishlist.some(w => w.uniqueName === item.uniqueName)) {
      setWishlist([...wishlist, item]);
      setExpandedWishlist(prev => ({ ...prev, [item.uniqueName]: false })); // Entra fechado por padrão
      setSearchTerm('');
    }
  };

  const handleRemoveWishlist = (uniqueName: string) => {
    setWishlist(wishlist.filter(w => w.uniqueName !== uniqueName));
  };

  const toggleExpandWishlist = (uniqueName: string) => {
    setExpandedWishlist(prev => ({
      ...prev,
      [uniqueName]: !prev[uniqueName]
    }));
  };

  const handleResourceClick = (rawResourceName: string) => {
    let cleanName = rawResourceName.split('(')[0].trim();
    if (onSelectResource) {
      onSelectResource(cleanName);
    }
  };

  // UNIFICA E SOMA TUDO COMO UMA LISTA DE COMPRAS
  const unifiedShoppingList = wishlist.reduce((acc, item) => {
    if (item.components) {
      item.components.forEach((comp: any) => {
        let resourceName = comp.name;
        
        const genericNames = ['blueprint', 'chassis', 'systems', 'neuroptics', 'helmet'];
        const isGeneric = genericNames.some(g => resourceName.toLowerCase().includes(g));
        
        if (isGeneric && !resourceName.toLowerCase().includes(item.name.toLowerCase())) {
          resourceName = `${comp.name} (${item.name})`;
        }

        const count = comp.itemCount || 1;
        acc[resourceName] = (acc[resourceName] || 0) + count;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedShoppingList = Object.entries(unifiedShoppingList).sort((a: [string, any], b: [string, any]) => {
    if (sortOrder === 'desc') {
      return b[1] - a[1];
    } else {
      return a[1] - b[1];
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200">
      
      {/* BARRA DE BUSCA */}
      <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex flex-col gap-2 relative">
        <label className="block text-xs text-gray-400">Buscar Item na Base de Dados do Jogo:</label>
        <input
          type="text"
          placeholder={loading ? "Carregando base de dados do Warframe..." : "Digite o nome (ex: Soma Prime, Rhino, Excalibur)..."}
          disabled={loading}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-950 border border-gray-700 text-sm rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />

        {filteredItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-gray-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {filteredItems.map((item: any) => (
              <div 
                key={item.uniqueName}
                onClick={() => handleAddWishlist(item)}
                className="flex justify-between items-center px-3 py-2 text-xs hover:bg-blue-600/20 cursor-pointer border-b border-gray-900 last:border-none transition"
              >
                <span className="font-medium text-white">{item.name}</span>
                <span className="text-blue-400 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Adicionar ➕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRADE: ITENS EM PRODUÇÃO + LISTA DE COMPRAS UNIFICADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sua Lista de Foco */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens em Produção</h4>
          {wishlist.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">Nenhum item na lista.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {wishlist.map((item) => {
                const isExpanded = !!expandedWishlist[item.uniqueName];
                return (
                  <div key={item.uniqueName} className="bg-gray-950/70 border border-gray-800 rounded-lg overflow-hidden transition">
                    
                    {/* CABEÇALHO DO ITEM */}
                    <div className="flex justify-between items-center p-2.5 bg-gray-900/80 gap-2">
                      <span className="font-semibold text-xs text-white truncate">{item.name}</span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleExpandWishlist(item.uniqueName)}
                          className="text-[10px] font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded transition"
                        >
                          {isExpanded ? 'Ocultar ▲' : 'Mostrar ▼'}
                        </button>

                        <button 
                          onClick={() => handleRemoveWishlist(item.uniqueName)}
                          className="text-red-400 hover:text-white font-bold px-1.5 py-0.5 bg-red-500/10 hover:bg-red-600 rounded transition text-xs"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* COMPONENTES DO ITEM */}
                    {isExpanded && (
                      <div className="p-2.5 flex flex-col gap-1 border-t border-gray-800/60 bg-gray-950/30">
                        {item.components?.map((comp: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => handleResourceClick(comp.name)}
                            className="flex justify-between items-center text-[11px] cursor-pointer hover:text-blue-400 hover:bg-blue-500/10 px-1.5 py-1 rounded transition"
                            title="Clique para ver os drops deste item"
                          >
                            <span className="text-gray-300">• {comp.name}</span>
                            <span className="font-mono text-gray-400 font-semibold">x{comp.itemCount || 1}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LISTA DE COMPRAS UNIFICADA COM ÍCONE DE ORDENAÇÃO ELEGANTE */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lista de Compras / Total Geral</h4>
            
            {sortedShoppingList.length > 0 && (
              <button
                onClick={toggleSortOrder}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-md transition flex items-center justify-center border border-gray-700"
                title={sortOrder === 'desc' ? "Ordenado: Maior para Menor (Clique para inverter)" : "Ordenado: Menor para Maior (Clique para inverter)"}
              >
                {sortOrder === 'desc' ? '⬇️' : '⬆️'}
              </button>
            )}
          </div>

          {sortedShoppingList.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">Adicione itens para ver a lista unificada.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
              {sortedShoppingList.map(([resourceName, amount]) => (
                <div 
                  key={resourceName} 
                  onClick={() => handleResourceClick(resourceName)}
                  className="flex justify-between items-center text-xs bg-gray-950/60 px-2.5 py-1.5 rounded cursor-pointer hover:bg-blue-600/20 hover:border-blue-500/40 border border-transparent transition"
                  title="Clique para ver os drops deste item"
                >
                  <span className="text-gray-300">{resourceName}</span>
                  <span className="font-mono text-blue-400 font-bold">{(amount as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}