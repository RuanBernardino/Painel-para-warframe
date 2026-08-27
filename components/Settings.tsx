'use client';
import { useState, useEffect, useRef } from 'react';
import { getNotificationPermission, requestNotificationPermission } from './NotificationManager';

export default function SettingsSection() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_sound_enabled');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('warframe_alert_volume');
      return saved !== null ? Number(saved) : 80;
    }
    return 80;
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  // Usamos um Ref para manter a instância do áudio viva
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializa o áudio apenas uma vez ao montar o componente
  useEffect(() => {
    audioRef.current = new Audio('/AlarmA.mp3');
  }, []);

  // Atualiza o volume do objeto de áudio sempre que o estado 'volume' mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100; // Converte 0-100 para 0.0-1.0
    }
    localStorage.setItem('warframe_alert_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('warframe_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reinicia o som caso ele já tenha tocado
      audioRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) {
      playNotificationSound();
    }
  };

  const enableSystemNotifications = async () => {
    setNotificationPermission(await requestNotificationPermission());
  };

  const permissionLabel = notificationPermission === 'granted'
    ? 'PERMITIDO'
    : notificationPermission === 'denied'
      ? 'BLOQUEADO'
      : notificationPermission === 'unsupported'
        ? 'INDISPONÍVEL'
        : 'PERMITIR';

  return (
    <div className="flex flex-col text-white">
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        
        {/* Notificações Sonoras */}
        <div className="bg-[#131b2e] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-200">Notificações Sonoras</div>
            <div className="text-[10px] text-gray-400">Tocar alerta quando o ciclo virar</div>
          </div>
          <button
            onClick={toggleSound}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
              soundEnabled ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {soundEnabled ? 'ATIVADO' : 'DESATIVADO'}
          </button>
        </div>

        <div className="bg-[#131b2e] p-3.5 rounded-xl border border-gray-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-gray-200">Notificações do navegador</div>
            <div className="text-[10px] text-gray-400">
              {notificationPermission === 'denied'
                ? 'Permissão bloqueada. Libere nas configurações do navegador.'
                : 'Mostrar o aviso mesmo quando estiver em outra aba.'}
            </div>
          </div>
          <button
            onClick={enableSystemNotifications}
            disabled={notificationPermission === 'granted' || notificationPermission === 'denied' || notificationPermission === 'unsupported'}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition whitespace-nowrap ${
              notificationPermission === 'granted'
                ? 'bg-green-600/20 border-green-500 text-green-300'
                : notificationPermission === 'denied'
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
            } disabled:cursor-not-allowed`}
          >
            {permissionLabel}
          </button>
        </div>

        {/* Controle de Volume */}
        <div className="bg-[#131b2e] p-3.5 rounded-xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-200">Volume do Alerta ({volume}%)</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-blue-500 bg-gray-700 rounded-lg h-1.5 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
