'use client';
import { useState, useEffect } from 'react';

interface FissureAlert {
  id: string;
  category: string;
  tier: string;
  mission: string;
}

export default function FissureAlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [fissureAlerts, setFissureAlerts] = useState<FissureAlert[]>([]);
  
  // Exemplo de estados para os selects do formulário dentro da modal
  const [category, setCategory] = useState('Normal');
  const [tier, setTier] = useState('Lith');
  const [mission, setMission] = useState('Survival');

  // Carrega do localStorage ao iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('warframe_fissure_alerts');
      if (saved) {
        setFissureAlerts(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
    }
  }, []);

  const saveToStorage = (updated: FissureAlert[]) => {
    setFissureAlerts(updated);
    try {
      localStorage.setItem('warframe_fissure_alerts', JSON.stringify(updated));
    } catch (err) {
      console.error('Erro ao salvar alertas:', err);
    }
  };

  const handleAddAlert = () => {
    const newAlert: FissureAlert = {
      id: Math.random().toString(36).substring(2, 9),
      category,
      tier,
      mission,
    };
    saveToStorage([...fissureAlerts, newAlert]);
  };

  const handleRemoveAlert = (id: string) => {
    saveToStorage(fissureAlerts.filter(item => item.id !== id));
  };

  const hasAlerts = fissureAlerts.length > 0;

  return (
    <>
      {/* Botão com o número e piscando */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border ${
          hasAlerts 
            ? 'bg-green-600/30 border-green-500 text-green-300 animate-pulse' 
            : 'bg-[#0e1422] border-gray-700 text-gray-300 hover:bg-gray-800'
        }`}
        title="Gerenciar Alertas de Fissura"
      >
        <span>🔔</span>
        {hasAlerts && (
          <span className="font-bold text-[11px] bg-green-500 text-black px-1.5 py-0.5 rounded-full">
            {fissureAlerts.length}
          </span>
        )}
      </button>

      {/* Modal / Pop-up */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> GERENCIAR ALERTAS DE FISSURA
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs transition font-semibold"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Criar Alerta */}
            <div className="bg-[#0e1422] p-4 rounded-xl border border-gray-800/60 space-y-3">
              <span className="text-xs font-bold text-gray-300 block">Criar Novo Alerta:</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Categoria:</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#131b2e] border border-gray-700 text-white p-2 rounded-lg text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Steel Path">Steel Path</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Era (Tier):</label>
                  <select 
                    value={tier} 
                    onChange={e => setTier(e.target.value)}
                    className="w-full bg-[#131b2e] border border-gray-700 text-white p-2 rounded-lg text-xs"
                  >
                    <option value="Lith">Lith</option>
                    <option value="Meso">Meso</option>
                    <option value="Neo">Neo</option>
                    <option value="Axi">Axi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Missão:</label>
                  <select 
                    value={mission} 
                    onChange={e => setMission(e.target.value)}
                    className="w-full bg-[#131b2e] border border-gray-700 text-white p-2 rounded-lg text-xs"
                  >
                    <option value="Survival">Survival</option>
                    <option value="Defense">Defense</option>
                    <option value="Spy">Spy</option>
                    <option value="Rescue">Rescue</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAddAlert}
                className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-xs transition"
              >
                + Adicionar Alerta à Lista
              </button>
            </div>

            {/* Lista Cadastrada */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-300 block">
                Alertas Cadastrados ({fissureAlerts.length}):
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {fissureAlerts.length === 0 ? (
                  <div className="bg-[#0e1422] p-4 rounded-xl border border-dashed border-gray-800 text-center text-gray-500 text-xs">
                    Nenhum alerta cadastrado. Adicione um acima!
                  </div>
                ) : (
                  fissureAlerts.map(item => (
                    <div key={item.id} className="bg-[#0e1422] p-3 rounded-xl border border-gray-800/60 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🔔</span>
                        <div>
                          <div className="font-bold text-xs text-white">
                            [{item.category}] {item.tier} - {item.mission}
                          </div>
                          <div className="text-[10px] text-gray-400">Status: Monitorando...</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveAlert(item.id)}
                        className="bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}