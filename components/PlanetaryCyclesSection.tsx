'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Timer from './Timer';

interface CycleData {
  expiry?: string;
  isDay?: boolean;
  isWarm?: boolean;
  state?: string;
}

interface PlanetaryCyclesSectionProps {
  onTriggerAlert?: (message: string) => void;
}

export default function PlanetaryCyclesSection({ onTriggerAlert }: PlanetaryCyclesSectionProps) {
  const [cetus, setCetus] = useState<CycleData | null>(null);
  const [earth, setEarth] = useState<CycleData | null>(null);
  const [vallis, setVallis] = useState<CycleData | null>(null);
  const [cambion, setCambion] = useState<CycleData | null>(null);

  // --- PERSISTÊNCIA DOS ALERTAS VIA LOCALSTORAGE ---

  // Earth Alert State
  const [earthAlert, setEarthAlert] = useState<{ active: boolean; targets: string[] }>(() => {
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

  // Cetus Alert State
  const [cetusAlert, setCetusAlert] = useState<{ active: boolean; targets: string[] }>(() => {
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

  // Vallis Alert State
  const [vallisAlert, setVallisAlert] = useState<{ active: boolean; targets: string[] }>(() => {
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

  // Cambion Alert State
  const [cambionAlert, setCambionAlert] = useState<{ active: boolean; targets: string[] }>(() => {
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

  // Estados de visibilidade dos modais de configuração
  const [showEarthSettings, setShowEarthSettings] = useState(false);
  const [showCetusSettings, setShowCetusSettings] = useState(false);
  const [showVallisSettings, setShowVallisSettings] = useState(false);
  const [showCambionSettings, setShowCambionSettings] = useState(false);

  const prevStatesRef = useRef({
    earth: null as string | null,
    cetus: null as string | null,
    vallis: null as string | null,
    cambion: null as string | null,
  });

  const fetchCycles = useCallback(async () => {
    const safeFetch = async (url: string, setter: Function) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setter(data);
      } catch (err) {
        console.error(`Erro ao buscar ${url}:`, err);
      }
    };

    await Promise.all([
      safeFetch('https://api.warframestat.us/pc/cetusCycle', setCetus),
      safeFetch('https://api.warframestat.us/pc/earthCycle', setEarth),
      safeFetch('https://api.warframestat.us/pc/vallisCycle', setVallis),
      safeFetch('https://api.warframestat.us/pc/cambionCycle', setCambion),
    ]);
  }, []);

  useEffect(() => {
    fetchCycles();
    const interval = setInterval(fetchCycles, 1000);
    return () => clearInterval(interval);
  }, [fetchCycles]);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* EARTH */}
      <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30">🌍</div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                EARTH <span className={earth?.isDay ? "text-green-400" : "text-blue-400"}>{earth ? (earth.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {earth?.expiry ? <Timer targetDate={earth.expiry} onExpire={fetchCycles} /> : 'Carregando...'}
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
      <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30">🌕</div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                CETUS <span className={cetus?.isDay ? "text-yellow-400" : "text-purple-400"}>{cetus ? (cetus.isDay ? 'DAY' : 'NIGHT') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {cetus?.expiry ? <Timer targetDate={cetus.expiry} onExpire={fetchCycles} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCetusSettings(!showCetusSettings)}
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
      </div>

      {/* VALLIS */}
      <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30">❄️</div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                VALLIS <span className={vallis?.isWarm ? "text-orange-400" : "text-blue-300"}>{vallis ? (vallis.isWarm ? 'WARM' : 'COLD') : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {vallis?.expiry ? <Timer targetDate={vallis.expiry} onExpire={fetchCycles} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowVallisSettings(!showVallisSettings)}
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
      </div>

      {/* CAMBION */}
      <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center border border-blue-500/30">🔥</div>
            <div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
                CAMBION <span className="text-orange-400">{cambion ? cambion.state?.toUpperCase() : '...'}</span>
              </div>
              <div className="text-lg font-mono font-semibold">
                {cambion?.expiry ? <Timer targetDate={cambion.expiry} onExpire={fetchCycles} /> : 'Carregando...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowCambionSettings(!showCambionSettings)}
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
      </div>

    </div>
  );
}