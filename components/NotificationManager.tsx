'use client';
import { useState, useEffect } from 'react';

interface ToastItem {
  id: string;
  type: 'fissure' | 'cycle' | 'test' | 'general';
  title: string;
  message: string;
  time: string;
}

// Função global helper para disparar de qualquer lugar do app facilmente
export function triggerGlobalNotification(type: 'fissure' | 'cycle' | 'test' | 'general', title: string, message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('warframe-notify', { 
      detail: { type, title, message } 
    }));
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported' as const;
  return Notification.requestPermission();
}

export default function NotificationManager() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNotify = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, title, message } = customEvent.detail;

      // Tocar som centralizado
      const soundEnabled = localStorage.getItem('warframe_sound_enabled') === 'true';
      const savedVolume = Number(localStorage.getItem('warframe_alert_volume') ?? '80');

      if (soundEnabled) {
        try {
          const audio = new Audio('/AlarmA.mp3');
          audio.volume = Math.min(1, Math.max(0, Number.isFinite(savedVolume) ? savedVolume / 100 : 0.8));
          audio.play().catch(err => console.log('Audio bloqueado pelo navegador:', err));
        } catch (err) {
          console.log('Erro ao carregar som:', err);
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            tag: `warframe-${type}-${title}-${message}`,
          });
        } catch (err) {
          console.log('Erro ao exibir notificacao do sistema:', err);
        }
      }

      const newToast: ToastItem = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        message,
        time: new Date().toLocaleTimeString()
      };

      setToasts(prev => {
        const updated = [newToast, ...prev];
        // Salva no localStorage para a página de histórico
        try {
          localStorage.setItem('warframe_notification_history', JSON.stringify(updated.map(t => ({
            id: t.id,
            message: `[${t.title}] ${t.message}`,
            time: t.time
          }))));
        } catch (err) {
          console.error('Erro ao salvar histórico:', err);
        }
        return updated;
      });

      // Remove automaticamente após 12 segundos (ou você pode fechar no 'X')
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 12000);
    };

    window.addEventListener('warframe-notify', handleNotify as EventListener);
    return () => {
      window.removeEventListener('warframe-notify', handleNotify as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-orange-500';
        let badgeBg = 'bg-orange-500/20 text-orange-400';
        let icon = '🔔';

        if (toast.type === 'fissure') {
          borderColor = 'border-green-500';
          badgeBg = 'bg-green-500/20 text-green-400';
          icon = '🟢';
        } else if (toast.type === 'cycle') {
          borderColor = 'border-purple-500';
          badgeBg = 'bg-purple-500/20 text-purple-400';
          icon = '🌍';
        }

        return (
          <div 
            key={toast.id} 
            className={`pointer-events-auto bg-[#131b2e] border-2 ${borderColor} text-white px-4 py-3.5 rounded-xl shadow-2xl flex items-start justify-between gap-3 animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{icon}</span>
              <div className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${badgeBg}`}>
                    {toast.title}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{toast.time}</span>
                </div>
                <p className="text-gray-200 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-gray-400 hover:text-white text-xs font-bold p-1 transition"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
