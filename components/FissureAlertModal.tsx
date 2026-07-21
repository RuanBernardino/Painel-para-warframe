'use client';
import { useState, useEffect, useRef } from 'react';
import { triggerGlobalNotification } from './NotificationManager';

interface FissureAlertItem {
  id: string;
  category: string;
  tier: string;
  mission: string;
}

interface FissureAlertModalProps {
  fissuresData: any[];
  showAlertModal: boolean;
  setShowModalAlert: (show: boolean) => void;
}

export default function FissureAlertModal({ 
  fissuresData, 
  showAlertModal, 
  setShowModalAlert
}: FissureAlertModalProps) {
  // Estado para garantir que rodou apenas no cliente e evitar erro de hidratação
  const [isMounted, setIsMounted] = useState(false);

  // 1. Lista de múltiplos ativos (inicializa vazio no SSR para bater com o servidor)
  const [alertsList, setAlertsList] = useState<FissureAlertItem[]>([]);

  // Sincroniza o localStorage logo após a montagem no cliente
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('warframe_fissure_alerts');
    if (saved) {
      try {
        setAlertsList(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar alertas salvos:', e);
      }
    }
  }, []);

  // 2. Salva automaticamente no localStorage sempre que a lista de alertas mudar (e já estiver montado)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('warframe_fissure_alerts', JSON.stringify(alertsList));
    }
  }, [alertsList, isMounted]);

  // Configuração temporária para adicionar um novo alerta
  const [newAlertConfig, setNewAlertConfig] = useState({
    tier: 'Lith',
    mission: 'Survival',
    category: 'Normal'
  });

  // Trava para evitar que o alarme toque repetidamente para o mesmo alerta
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  // Referência para manter a lista atualizada dentro do useEffect sem quebrar as dependências do React
  const alertsListRef = useRef(alertsList);
  useEffect(() => {
    alertsListRef.current = alertsList;
  }, [alertsList]);

  const tiersOrder = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia'];

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

  // Adicionar novo alerta na lista
  const handleAddAlert = () => {
    const item: FissureAlertItem = {
      id: Math.random().toString(36).substring(2, 9),
      category: newAlertConfig.category,
      tier: newAlertConfig.tier,
      mission: newAlertConfig.mission
    };
    setAlertsList([...alertsList, item]);
  };

  // Remover alerta específico da lista
  const handleRemoveAlert = (id: string) => {
    setAlertsList(alertsList.filter(alert => alert.id !== id));
    triggeredIdsRef.current.delete(id);
  };

  // Efeito que monitora todos os alertas cadastrados em tempo real de forma segura
  useEffect(() => {
    const currentAlerts = alertsListRef.current;
    if (currentAlerts.length === 0) return;

    currentAlerts.forEach(alert => {
      const matchingFissure = fissuresData.find(f => {
        const matchesTier = f.tier === alert.tier;
        const matchesMission = f.missionType?.toLowerCase().includes(alert.mission.toLowerCase());
        
        let matchesCategory = false;
        if (alert.category === 'Void Storms') {
          matchesCategory = isFissureStorm(f);
        } else if (alert.category === 'Steel Path') {
          matchesCategory = isFissureSteelPath(f) && !isFissureStorm(f);
        } else {
          matchesCategory = !isFissureSteelPath(f) && !isFissureStorm(f);
        }

        return matchesTier && matchesMission && matchesCategory;
      });

      if (matchingFissure) {
        if (!triggeredIdsRef.current.has(alert.id)) {
          triggerGlobalNotification(
            'fissure', 
            `Fissura [${alert.category}] ${alert.tier}`, 
            `${alert.mission} em ${matchingFissure.node} está ONLINE!`
          );
          triggeredIdsRef.current.add(alert.id);
        }
      } else {
        triggeredIdsRef.current.delete(alert.id);
      }
    });
  }, [fissuresData]);

  // Se ainda estiver carregando no servidor, renderiza uma versão neutra (evita o mismatch)
  const hasAlerts = isMounted && alertsList.length > 0;

  return (
    <>
      {/* Botão de acionamento (fica na barra superior) */}
      <button 
        onClick={() => setShowModalAlert(true)}
        className={`text-xs px-3 py-1.5 rounded-lg font-mono transition flex items-center gap-1.5 border ${
          hasAlerts 
            ? 'bg-green-600/30 border-green-500 text-green-300 animate-pulse' 
            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800'
        }`}
      >
        🔔 Alertas de Fissura ({isMounted ? alertsList.length : 0})
      </button>

      {/* PAINEL / MODAL FLUTUANTE NA FRENTE DA TELA (OVERLAY) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-blue-500/40 w-full max-w-xl p-6 rounded-2xl shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">🎯 Gerenciar Alertas de Fissura</h3>
              <button 
                onClick={() => setShowModalAlert(false)} 
                className="text-gray-400 hover:text-white text-xs bg-gray-800 px-2.5 py-1 rounded-lg"
              >
                ✕ Fechar
              </button>
            </div>
            
            {/* Bloco de Configuração para Adicionar Novo Alerta */}
            <div className="bg-[#0e1422] border border-gray-800 p-4 rounded-xl mb-5">
              <p className="text-xs font-semibold text-gray-300 mb-3">Criar Novo Alerta:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Categoria:</span>
                  <select 
                    value={newAlertConfig.category} 
                    onChange={(e) => setNewAlertConfig({...newAlertConfig, category: e.target.value})}
                    className="w-full bg-[#131b2e] border border-gray-700 rounded p-2 text-white outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Steel Path">Steel Path</option>
                    <option value="Void Storms">Void Storms</option>
                  </select>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">Era (Tier):</span>
                  <select 
                    value={newAlertConfig.tier} 
                    onChange={(e) => setNewAlertConfig({...newAlertConfig, tier: e.target.value})}
                    className="w-full bg-[#131b2e] border border-gray-700 rounded p-2 text-white outline-none"
                  >
                    {tiersOrder.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <span className="text-gray-400 block mb-1">Missão:</span>
                  <select 
                    value={newAlertConfig.mission} 
                    onChange={(e) => setNewAlertConfig({...newAlertConfig, mission: e.target.value})}
                    className="w-full bg-[#131b2e] border border-gray-700 rounded p-2 text-white outline-none"
                  >
                    <option value="Survival">Survival</option>
                    <option value="Capture">Capture</option>
                    <option value="Extermination">Extermination</option>
                    <option value="Mobile Defense">Mobile Defense</option>
                    <option value="Defense">Defense</option>
                    <option value="Spy">Spy</option>
                    <option value="Skirmish">Skirmish (Railjack)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAddAlert}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs transition"
              >
                + Adicionar Alerta à Lista
              </button>
            </div>

            {/* Listagem dos Alertas Ativos com Opção de Excluir */}
            <div>
              <p className="text-xs font-semibold text-gray-300 mb-2">Alertas Cadastrados ({alertsList.length}):</p>
              
              {alertsList.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
                  Nenhum alerta cadastrado. Adicione um acima!
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {alertsList.map((alert) => {
                    const isOnline = fissuresData.some(f => {
                      const matchesTier = f.tier === alert.tier;
                      const matchesMission = f.missionType?.toLowerCase().includes(alert.mission.toLowerCase());
                      let matchesCategory = false;
                      if (alert.category === 'Void Storms') matchesCategory = isFissureStorm(f);
                      else if (alert.category === 'Steel Path') matchesCategory = isFissureSteelPath(f) && !isFissureStorm(f);
                      else matchesCategory = !isFissureSteelPath(f) && !isFissureStorm(f);
                      return matchesTier && matchesMission && matchesCategory;
                    });

                    return (
                      <div 
                        key={alert.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                          isOnline ? 'bg-green-950/40 border-green-500/60 text-green-300' : 'bg-[#0e1422] border-gray-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{isOnline ? '🟢' : '🔍'}</span>
                          <div>
                            <p className="font-bold">[{alert.category}] {alert.tier} - {alert.mission}</p>
                            <p className="text-[10px] text-gray-400">{isOnline ? 'Status: ONLINE na API!' : 'Status: Monitorando...'}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveAlert(alert.id)}
                          className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-400 px-2.5 py-1 rounded text-xs transition"
                        >
                          Excluir
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}