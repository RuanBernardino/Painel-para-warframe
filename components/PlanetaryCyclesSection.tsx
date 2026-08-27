'use client';
import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import Timer from './Timer';
import { cetusInfo, vallisInfo, cambionInfo } from '@/lib/data/planetaryInfo';

interface CycleData {
  expiry?: string;
  isDay?: boolean;
  isWarm?: boolean;
  state?: string;
}

interface AlertState {
  active: boolean;
  targets: string[];
}

interface PlanetaryCyclesSectionProps {
  onTriggerAlert?: (message: string) => void;
}

export default function PlanetaryCyclesSection({ onTriggerAlert }: PlanetaryCyclesSectionProps) {
  const [cetus, setCetus] = useState<CycleData | null>(null);
  const [earth, setEarth] = useState<CycleData | null>(null);
  const [vallis, setVallis] = useState<CycleData | null>(null);
  const [cambion, setCambion] = useState<CycleData | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);

  // --- PERSISTÊNCIA DOS ALERTAS VIA LOCALSTORAGE ---

  const [earthAlert, setEarthAlert] = useState<AlertState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_earth_alert');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return { active: false, targets: ['Night'] };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warframe_earth_alert', JSON.stringify(earthAlert));
    }
  }, [earthAlert]);

  const [cetusAlert, setCetusAlert] = useState<AlertState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_cetus_alert');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return { active: false, targets: ['Night'] };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warframe_cetus_alert', JSON.stringify(cetusAlert));
    }
  }, [cetusAlert]);

  const [vallisAlert, setVallisAlert] = useState<AlertState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_vallis_alert');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return { active: false, targets: ['Warm'] };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warframe_vallis_alert', JSON.stringify(vallisAlert));
    }
  }, [vallisAlert]);

  const [cambionAlert, setCambionAlert] = useState<AlertState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_cambion_alert');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return { active: false, targets: ['Vome'] };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warframe_cambion_alert', JSON.stringify(cambionAlert));
    }
  }, [cambionAlert]);

  // Estados de visibilidade
  const [showEarthSettings, setShowEarthSettings] = useState(false);
  const [showCetusSettings, setShowCetusSettings] = useState(false);
  const [showVallisSettings, setShowVallisSettings] = useState(false);
  const [showCambionSettings, setShowCambionSettings] = useState(false);

  const [showCetusInfoModal, setShowCetusInfoModal] = useState(false);
  const [showVallisInfoModal, setShowVallisInfoModal] = useState(false);
  const [showCambionInfoModal, setShowCambionInfoModal] = useState(false);

  const earthContainerRef = useRef<HTMLDivElement>(null);
  const cetusContainerRef = useRef<HTMLDivElement>(null);
  const vallisContainerRef = useRef<HTMLDivElement>(null);
  const cambionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (earthContainerRef.current && !earthContainerRef.current.contains(event.target as Node)) {
        setShowEarthSettings(false);
      }
      if (cetusContainerRef.current && !cetusContainerRef.current.contains(event.target as Node)) {
        setShowCetusSettings(false);
        setShowCetusInfoModal(false);
      }
      if (vallisContainerRef.current && !vallisContainerRef.current.contains(event.target as Node)) {
        setShowVallisSettings(false);
        setShowVallisInfoModal(false);
      }
      if (cambionContainerRef.current && !cambionContainerRef.current.contains(event.target as Node)) {
        setShowCambionSettings(false);
        setShowCambionInfoModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevStatesRef = useRef({
    earth: null as string | null,
    cetus: null as string | null,
    vallis: null as string | null,
    cambion: null as string | null,
  });

  const lastFetchTimeRef = useRef<number>(0);
  const isPollingRef = useRef<boolean>(false);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função principal de busca com validação de ciclo novo
  const fetchCycles = useCallback(async (isExpirationCheck = false) => {
    const now = Date.now();
    
    // Se não for verificação de expiração, respeita o limite de segurança de 10s para cliques manuais
    if (!isExpirationCheck && now - lastFetchTimeRef.current < 10000) return;
    lastFetchTimeRef.current = now;

    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const serverTime = Number(res.headers.get('X-Server-Time'));
        return {
          data: await res.json() as CycleData,
          serverTime: Number.isFinite(serverTime) ? serverTime : null,
        };
      } catch (err) {
        console.error(`Erro ao buscar ${url}:`, err);
        return null;
      }
    };

    const [cetusData, earthData, vallisData, cambionData] = await Promise.all([
      safeFetch('/api/warframe/cetusCycle'),
      safeFetch('/api/warframe/earthCycle'),
      safeFetch('/api/warframe/vallisCycle'),
      safeFetch('/api/warframe/cambionCycle'),
    ]);

    const responses = [cetusData, earthData, vallisData, cambionData];
    const serverTime = responses.find((item) => item?.serverTime != null)?.serverTime;
    const nextOffset = serverTime ? serverTime - Date.now() : clockOffsetMs;
    if (serverTime) setClockOffsetMs(nextOffset);

    if (cetusData) setCetus(cetusData.data);
    if (earthData) setEarth(earthData.data);
    if (vallisData) setVallis(vallisData.data);
    if (cambionData) setCambion(cambionData.data);

    const syncedNow = Date.now() + nextOffset;
    return responses.every((item) => {
      const expiry = Date.parse(item?.data.expiry ?? '');
      return Number.isFinite(expiry) && expiry > syncedNow;
    });
  }, [clockOffsetMs]);

  // Função disparada quando qualquer timer zera
  const handleTimerExpire = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const poll = async () => {
      const updated = await fetchCycles(true);
      if (updated) {
        isPollingRef.current = false;
        return;
      }
      pollingTimeoutRef.current = setTimeout(poll, 3000);
    };

    await poll();
  }, [fetchCycles]);

  useEffect(() => {
    fetchCycles(false);
    const refreshInterval = setInterval(() => fetchCycles(true), 60000);
    return () => {
      clearInterval(refreshInterval);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [fetchCycles]);

  // Alertas de mudança de estado
  useEffect(() => {
    if (!onTriggerAlert) return;

    if (earth) {
      const currentEarthState = earth.isDay ? 'Day' : 'Night';
      const prev = prevStatesRef.current.earth;
      if (prev !== null && prev !== currentEarthState) {
        if (earthAlert.active && earthAlert.targets.includes(currentEarthState)) {
          onTriggerAlert(`🌍 Alerta de Earth! O ciclo mudou para ${currentEarthState.toUpperCase()}!`);
        }
      }
      prevStatesRef.current.earth = currentEarthState;
    }

    if (cetus) {
      const currentCetusState = cetus.isDay ? 'Day' : 'Night';
      const prev = prevStatesRef.current.cetus;
      if (prev !== null && prev !== currentCetusState) {
        if (cetusAlert.active && cetusAlert.targets.includes(currentCetusState)) {
          onTriggerAlert(`🌕 Alerta de Cetus! O ciclo mudou para ${currentCetusState.toUpperCase()}!`);
        }
      }
      prevStatesRef.current.cetus = currentCetusState;
    }

    if (vallis) {
      const currentVallisState = vallis.isWarm ? 'Warm' : 'Cold';
      const prev = prevStatesRef.current.vallis;
      if (prev !== null && prev !== currentVallisState) {
        if (vallisAlert.active && vallisAlert.targets.includes(currentVallisState)) {
          onTriggerAlert(`❄️ Alerta de Orb Vallis! O clima mudou para ${currentVallisState.toUpperCase()}!`);
        }
      }
      prevStatesRef.current.vallis = currentVallisState;
    }

    if (cambion && cambion.state) {
      const currentCambionState = cambion.state.charAt(0).toUpperCase() + cambion.state.slice(1).toLowerCase();
      const prev = prevStatesRef.current.cambion;
      if (prev !== null && prev !== currentCambionState) {
        if (cambionAlert.active && cambionAlert.targets.some(t => t.toLowerCase() === currentCambionState.toLowerCase())) {
          onTriggerAlert(`🔥 Alerta de Cambion Drift! O ciclo mudou para ${currentCambionState.toUpperCase()}!`);
        }
      }
      prevStatesRef.current.cambion = currentCambionState;
    }
  }, [earth, cetus, vallis, cambion, earthAlert, cetusAlert, vallisAlert, cambionAlert, onTriggerAlert]);

  const toggleTarget = (currentTargets: string[], target: string) => {
    if (currentTargets.includes(target)) {
      return currentTargets.filter(t => t !== target);
    } else {
      return [...currentTargets, target];
    }
  };

  const currentCetusData = (cetus?.isDay ?? true) ? cetusInfo.day : cetusInfo.night;
  const currentVallisData = (vallis?.isWarm ?? false) ? vallisInfo.warm : vallisInfo.cold;
  const currentCambionData = (cambion?.state?.toLowerCase() === 'fass') ? cambionInfo.fass : cambionInfo.vome;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* EARTH */}
      <div ref={earthContainerRef} className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30">🌍</div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                EARTH <span className={earth?.isDay ? "text-green-400" : "text-blue-400"}>{earth ? (earth.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {earth?.expiry ? <Timer targetDate={earth.expiry} onExpire={handleTimerExpire} clockOffsetMs={clockOffsetMs} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowEarthSettings(!showEarthSettings)}
            className={`p-2 rounded-lg transition ${earthAlert.active ? 'text-yellow-400 bg-yellow-500/15' : 'text-gray-400 hover:bg-gray-800'}`}
            title="Configurar Alarme"
          >
            🔔
          </button>
        </div>

        {showEarthSettings && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-4 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider border-b border-gray-800 pb-2">AVISAR QUANDO VIRAR:</div>
            <div className="grid grid-cols-2 gap-2">
              {['Day', 'Night'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEarthAlert({...earthAlert, targets: toggleTarget(earthAlert.targets, mode)})}
                  className={`py-2 rounded-lg text-xs font-semibold transition border ${
                    earthAlert.targets.includes(mode)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-[#131b2e] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setEarthAlert({...earthAlert, active: !earthAlert.active})}
              className={`py-2.5 rounded-lg font-bold text-xs transition ${
                earthAlert.active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {earthAlert.active ? 'Desativar Alarme' : 'Ativar Alarme'}
            </button>
          </div>
        )}
      </div>

      {/* CETUS */}
      <div ref={cetusContainerRef} className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => {
                setShowCetusInfoModal(!showCetusInfoModal);
                setShowCetusSettings(false);
              }}
              className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30 cursor-pointer hover:bg-blue-800/60 transition shadow-inner"
              title="Ver guia de recursos"
            >
              {cetus?.isDay ? '☀️' : '🌕'}
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                CETUS <span className={cetus?.isDay ? "text-yellow-400" : "text-purple-400"}>{cetus ? (cetus.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {cetus?.expiry ? <Timer targetDate={cetus.expiry} onExpire={handleTimerExpire} clockOffsetMs={clockOffsetMs} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowCetusSettings(!showCetusSettings);
              setShowCetusInfoModal(false);
            }}
            className={`p-2 rounded-lg transition ${cetusAlert.active ? 'text-yellow-400 bg-yellow-500/15' : 'text-gray-400 hover:bg-gray-800'}`}
            title="Configurar Alarme"
          >
            🔔
          </button>
        </div>

        {showCetusSettings && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-4 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider border-b border-gray-800 pb-2">AVISAR QUANDO VIRAR:</div>
            <div className="grid grid-cols-2 gap-2">
              {['Day', 'Night'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCetusAlert({...cetusAlert, targets: toggleTarget(cetusAlert.targets, mode)})}
                  className={`py-2 rounded-lg text-xs font-semibold transition border ${
                    cetusAlert.targets.includes(mode)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-[#131b2e] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCetusAlert({...cetusAlert, active: !cetusAlert.active})}
              className={`py-2.5 rounded-lg font-bold text-xs transition ${
                cetusAlert.active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {cetusAlert.active ? 'Desativar Alarme' : 'Ativar Alarme'}
            </button>
          </div>
        )}

        {showCetusInfoModal && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-2 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <div className="text-xs text-white font-bold tracking-wider uppercase">{currentCetusData.title}</div>
                <div className="text-[10px] text-gray-400">Guia rápido de recursos e spawns ativos</div>
              </div>
              <button onClick={() => setShowCetusInfoModal(false)} className="text-gray-400 hover:text-white text-xs font-bold p-1 rounded-lg bg-gray-800 transition">✕</button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300 max-h-60 overflow-y-auto pr-1">
              <div>
                <strong className="text-yellow-400 block mb-1">🐟 Peixes Disponíveis:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCetusData.peixes.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-900/60 text-blue-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-green-400 block mb-1">🌿 Recursos / Plantas:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCetusData.recursos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-purple-400 block mb-1">⚠️ Inimigos / Criaturas:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCetusData.inimigos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-900/60 text-purple-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowCetusInfoModal(false)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition mt-1">
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* VALLIS */}
      <div ref={vallisContainerRef} className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => {
                setShowVallisInfoModal(!showVallisInfoModal);
                setShowVallisSettings(false);
              }}
              className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30 cursor-pointer hover:bg-blue-800/60 transition shadow-inner"
              title="Ver guia de recursos"
            >
              {vallis?.isWarm ? '🔥' : '❄️'}
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                VALLIS <span className={vallis?.isWarm ? "text-orange-400" : "text-blue-300"}>{vallis ? (vallis.isWarm ? 'WARM' : 'COLD') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {vallis?.expiry ? <Timer targetDate={vallis.expiry} onExpire={handleTimerExpire} clockOffsetMs={clockOffsetMs} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowVallisSettings(!showVallisSettings);
              setShowVallisInfoModal(false);
            }}
            className={`p-2 rounded-lg transition ${vallisAlert.active ? 'text-yellow-400 bg-yellow-500/15' : 'text-gray-400 hover:bg-gray-800'}`}
            title="Configurar Alarme"
          >
            🔔
          </button>
        </div>

        {showVallisSettings && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-4 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider border-b border-gray-800 pb-2">AVISAR QUANDO VIRAR:</div>
            <div className="grid grid-cols-2 gap-2">
              {['Warm', 'Cold'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVallisAlert({...vallisAlert, targets: toggleTarget(vallisAlert.targets, mode)})}
                  className={`py-2 rounded-lg text-xs font-semibold transition border ${
                    vallisAlert.targets.includes(mode)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-[#131b2e] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setVallisAlert({...vallisAlert, active: !vallisAlert.active})}
              className={`py-2.5 rounded-lg font-bold text-xs transition ${
                vallisAlert.active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {vallisAlert.active ? 'Desativar Alarme' : 'Ativar Alarme'}
            </button>
          </div>
        )}

        {showVallisInfoModal && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-2 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <div className="text-xs text-white font-bold tracking-wider uppercase">{currentVallisData.title}</div>
                <div className="text-[10px] text-gray-400">Guia rápido de recursos e spawns ativos</div>
              </div>
              <button onClick={() => setShowVallisInfoModal(false)} className="text-gray-400 hover:text-white text-xs font-bold p-1 rounded-lg bg-gray-800 transition">✕</button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300 max-h-60 overflow-y-auto pr-1">
              <div>
                <strong className="text-yellow-400 block mb-1">🐟 Peixes Disponíveis:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentVallisData.peixes.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-900/60 text-blue-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-green-400 block mb-1">🌿 Recursos / Termais:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentVallisData.recursos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-purple-400 block mb-1">⚠️ Inimigos / Criaturas:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentVallisData.inimigos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-900/60 text-purple-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowVallisInfoModal(false)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition mt-1">
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* CAMBION */}
      <div ref={cambionContainerRef} className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => {
                setShowCambionInfoModal(!showCambionInfoModal);
                setShowCambionSettings(false);
              }}
              className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30 cursor-pointer hover:bg-blue-800/60 transition shadow-inner"
              title="Ver guia de recursos"
            >
              🔥
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                CAMBION <span className="text-orange-400">{cambion ? cambion.state?.toUpperCase() : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {cambion?.expiry ? <Timer targetDate={cambion.expiry} onExpire={handleTimerExpire} clockOffsetMs={clockOffsetMs} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowCambionSettings(!showCambionSettings);
              setShowCambionInfoModal(false);
            }}
            className={`p-2 rounded-lg transition ${cambionAlert.active ? 'text-yellow-400 bg-yellow-500/15' : 'text-gray-400 hover:bg-gray-800'}`}
            title="Configurar Alarme"
          >
            🔔
          </button>
        </div>

        {showCambionSettings && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-4 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="text-xs text-gray-300 font-bold uppercase tracking-wider border-b border-gray-800 pb-2">AVISAR QUANDO VIRAR:</div>
            <div className="grid grid-cols-2 gap-2">
              {['Vome', 'Fass'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCambionAlert({...cambionAlert, targets: toggleTarget(cambionAlert.targets, mode)})}
                  className={`py-2 rounded-lg text-xs font-semibold transition border ${
                    cambionAlert.targets.includes(mode)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-[#131b2e] border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCambionAlert({...cambionAlert, active: !cambionAlert.active})}
              className={`py-2.5 rounded-lg font-bold text-xs transition ${
                cambionAlert.active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {cambionAlert.active ? 'Desativar Alarme' : 'Ativar Alarme'}
            </button>
          </div>
        )}

        {showCambionInfoModal && (
          <div className="absolute left-0 right-0 top-20 z-50 mx-2 bg-[#0e1422] border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <div className="text-xs text-white font-bold tracking-wider uppercase">{currentCambionData.title}</div>
                <div className="text-[10px] text-gray-400">Guia rápido de recursos e spawns ativos</div>
              </div>
              <button onClick={() => setShowCambionInfoModal(false)} className="text-gray-400 hover:text-white text-xs font-bold p-1 rounded-lg bg-gray-800 transition">✕</button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300 max-h-60 overflow-y-auto pr-1">
              <div>
                <strong className="text-yellow-400 block mb-1">🐟 Peixes / Preservação:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCambionData.peixes.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-900/60 text-blue-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-green-400 block mb-1">🌿 Recursos / Resíduos:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCambionData.recursos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-purple-400 block mb-1">⚠️ Inimigos / Criaturas:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {currentCambionData.inimigos.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-900/60 text-purple-200 px-2 py-1 rounded text-[11px]">
                      {item.img && <img src={item.img} alt={item.nome} className="w-4 h-4 object-contain" />}
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowCambionInfoModal(false)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition mt-1">
              Fechar
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
