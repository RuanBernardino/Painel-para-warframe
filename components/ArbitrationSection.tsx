'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { FULL_ARBITRATION_LIST } from '@/lib/data/arbitrationData';
import { triggerGlobalNotification } from '@/components/NotificationManager';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ALL_MISSION_TYPES = [
  'Alchemy', 'Defection', 'Defense', 'Disruption', 'Excavation', 
  'Infested Salvage', 'Interception', 'Mirror Defense', 'Survival', 
  'Conjunction Survival', 'Void Cascade', 'Void Flood', 'Void Armageddon'
];

interface ArbitrationAlert {
  id: string;
  type: string; // Ex: 'Survival', 'Defense', etc.
}

function parseArbDateTime(dateStr: string, timeStr: string, year: number): Date {
  const datePart = dateStr.split(',')[1]?.trim() ?? dateStr.trim();
  const [monthName, dayStr] = datePart.split(' ');
  const month = MONTHS.indexOf(monthName);
  const day = parseInt(dayStr, 10);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(year, month, day, hh, mm, 0, 0);
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Expirado / Atualizando...';
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${minutes}m ${seconds}s`;
}

export default function ArbitrationSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<ArbitrationAlert[]>([]);
  const [selectedMissionType, setSelectedMissionType] = useState(ALL_MISSION_TYPES[0]);
  
  const lastAlertedNodeRef = useRef<string | null>(null);

  // Carrega alertas salvos no localStorage ao iniciar e marca como montado
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('warframe_arbitration_alerts');
      if (saved) {
        setAlerts(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Erro ao carregar alertas de arbitragem:', err);
    }
  }, []);

  // Salva alertas no localStorage sempre que houver mudança
  const saveAlertsToStorage = (updatedAlerts: ArbitrationAlert[]) => {
    setAlerts(updatedAlerts);
    try {
      localStorage.setItem('warframe_arbitration_alerts', JSON.stringify(updatedAlerts));
    } catch (err) {
      console.error('Erro ao salvar alertas de arbitragem:', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const arbitrationWithDates = useMemo(() => {
    const year = new Date().getFullYear();
    return FULL_ARBITRATION_LIST.map((item) => ({
      ...item,
      start: parseArbDateTime(item.date, item.time, year),
    }));
  }, []);

  const activeIndex = useMemo(() => {
    for (let i = 0; i < arbitrationWithDates.length; i++) {
      const start = arbitrationWithDates[i].start;
      const end = arbitrationWithDates[i + 1]?.start ?? new Date(start.getTime() + 60 * 60 * 1000);
      if (now >= start && now < end) return i;
    }
    return -1;
  }, [now, arbitrationWithDates]);

  const arbitration = activeIndex >= 0 ? arbitrationWithDates[activeIndex] : null;
  const nextArbitration = activeIndex >= 0 ? arbitrationWithDates[activeIndex + 1] : null;

  // 🔔 VERIFICAÇÃO E DISPARO DE ALARME BASEADO NOS ALERTAS CADASTRADOS
  useEffect(() => {
    if (!arbitration || alerts.length === 0) return;

    if (lastAlertedNodeRef.current === arbitration.node) return;

    // Checa se a missão atual bate com algum dos alertas cadastrados pelo usuário
    const matchedAlert = alerts.find(alert => 
      arbitration.type.toLowerCase().includes(alert.type.toLowerCase())
    );

    if (matchedAlert) {
      triggerGlobalNotification(
        'general',
        '🚨 Alerta de Arbitragem!',
        `${arbitration.type} em ${arbitration.node} (${arbitration.faction})`
      );

      lastAlertedNodeRef.current = arbitration.node;
    }
  }, [arbitration, alerts]);

  const handleAddAlert = () => {
    // Evita duplicados do mesmo tipo
    if (alerts.some(a => a.type.toLowerCase() === selectedMissionType.toLowerCase())) return;

    const newAlert: ArbitrationAlert = {
      id: Math.random().toString(36).substring(2, 9),
      type: selectedMissionType,
    };

    saveAlertsToStorage([...alerts, newAlert]);
  };

  const handleRemoveAlert = (id: string) => {
    saveAlertsToStorage(alerts.filter(a => a.id !== id));
  };

  const timeLeft = useMemo(() => {
    if (!arbitration || !nextArbitration) return '--';
    const diff = nextArbitration.start.getTime() - now.getTime();
    return formatTimeLeft(diff);
  }, [arbitration, nextArbitration, now]);

  return (
    <>
      <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 text-white w-full">
        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚔️</span> ARBITRATION (ARBITRAGEM)
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Botão de Alerta idêntico ao estilo das Fissuras */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border ${
                alerts.length > 0 
                  ? 'bg-green-600/30 border-green-500 text-green-300 animate-pulse' 
                  : 'bg-[#0e1422] border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
              title="Gerenciar Alertas de Arbitragem"
            >
              <span>🔔</span>
              {alerts.length > 0 && (
                <span className="bg-green-500 text-black text-[10px] font-bold px-1.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
            
            <span className="font-mono text-xs text-yellow-300 bg-[#0e1422] px-2 py-0.5 rounded border border-gray-800">
              {isMounted ? timeLeft : '--'}
            </span>
          </div>
        </div>

        {arbitration ? (
          <div className="space-y-3 text-xs">
            <div className="bg-[#0e1422] p-2.5 rounded-lg border border-gray-800/60 flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{arbitration.node}</div>
                <div className="text-gray-400 text-[11px]">{arbitration.type} • {arbitration.faction}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0e1422] p-2 rounded-lg border border-gray-800/60">
                <span className="text-gray-400 text-[10px] uppercase block mb-1">Início</span>
                <span className="font-bold text-green-300 text-sm">
                  {arbitration.date} às {arbitration.time}
                </span>
              </div>

              <div className="bg-[#0e1422] p-2 rounded-lg border border-gray-800/60">
                <span className="text-gray-400 text-[10px] uppercase block mb-1">Bônus de Recurso</span>
                <span className="font-bold text-yellow-300 text-sm">
                  {arbitration.bonus || 'Nenhum'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0e1422] p-4 rounded-lg border border-gray-800/60 text-center text-gray-400 text-xs">
            Nenhuma arbitragem ativa no cronograma para o horário atual.
          </div>
        )}
      </div>

      {/* MODAL DE GERENCIAMENTO DE ALERTAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131b2e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5">
            
            {/* Header da Modal */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <span>🎯</span> GERENCIAR ALERTAS DE ARBITRAGEM
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs transition font-semibold"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Criar Novo Alerta */}
            <div className="bg-[#0e1422] p-4 rounded-xl border border-gray-800/60 space-y-3">
              <span className="text-xs font-bold text-gray-300 block">Criar Novo Alerta:</span>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase block">Tipo de Missão:</label>
                <select 
                  value={selectedMissionType}
                  onChange={(e) => setSelectedMissionType(e.target.value)}
                  className="w-full bg-[#131b2e] border border-gray-700 text-white p-2 rounded-lg text-xs focus:outline-none focus:border-yellow-500"
                >
                  {ALL_MISSION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleAddAlert}
                className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-lg shadow-green-900/20"
              >
                + Adicionar Alerta à Lista
              </button>
            </div>

            {/* Alertas Cadastrados */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-300 block">
                Alertas Cadastrados ({alerts.length}):
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {alerts.length === 0 ? (
                  <div className="bg-[#0e1422] p-4 rounded-xl border border-dashed border-gray-800 text-center text-gray-500 text-xs">
                    Nenhum alerta cadastrado. Adicione um acima!
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="bg-[#0e1422] p-3 rounded-xl border border-gray-800/60 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🔔</span>
                        <div>
                          <div className="font-bold text-xs text-white">Missão: {alert.type}</div>
                          <div className="text-[10px] text-gray-400">Status: Monitorando...</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveAlert(alert.id)}
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