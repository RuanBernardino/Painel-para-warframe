'use client';
import { useState, useEffect } from 'react';

interface ArchonHuntSectionProps {
  onArchonLoaded?: (expiryTime: string, themeColor: string) => void;
}

export default function ArchonHuntSection({ onArchonLoaded }: ArchonHuntSectionProps) {
  const [archonData, setArchonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('--');

  const endpointUrl = '/api/warframe/archonHunt';

  useEffect(() => {
    async function fetchArchon() {
      try {
        setLoading(true);
        const response = await fetch(endpointUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do endpoint de Archon.');
        }
        const data = await response.json();
        setArchonData(data);
        
        // Se houver callback para o componente pai, avisa a cor e expiração
        if (onArchonLoaded && data?.boss && data?.expiry) {
          const theme = getThemeConfig(data.boss);
          // O cálculo inicial do tempo
          const diff = new Date(data.expiry).getTime() - new Date().getTime();
          onArchonLoaded(formatTimeDiffWeekly(diff), theme.primaryColor);
        }
      } catch (err: any) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchArchon();
    const interval = setInterval(fetchArchon, 60000);
    return () => clearInterval(interval);
  }, []);

  // Efeito para rodar o temporizador segundo a segundo baseado na data final da API
  useEffect(() => {
    if (!archonData || !archonData.expiry) return;

    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(archonData.expiry).getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
      } else {
        setTimeLeft(formatTimeDiffWeekly(diff));
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [archonData]);

  function formatTimeDiffWeekly(ms: number) {
    if (ms <= 0) return 'expirado';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  const getArchonImage = (bossName: string) => {
    if (!bossName) return 'https://cdn.warframestat.us/img/archon-hunt.png';
    const name = bossName.toLowerCase();
    
    if (name.includes('boreal')) return 'https://wiki.warframe.com/images/thumb/ArchonBoreal.png/300px-ArchonBoreal.png';
    if (name.includes('amar')) return 'https://wiki.warframe.com/images/thumb/ArchonAmar.png/300px-ArchonAmar.png';
    if (name.includes('nira')) return 'https://wiki.warframe.com/images/thumb/ArchonNira.png/300px-ArchonNira.png';
    
    return 'https://cdn.warframestat.us/img/archon-hunt.png';
  };

  const getThemeConfig = (bossName: string) => {
    if (!bossName) {
      return {
        shardName: 'Archon Shard',
        shardImage: 'https://cdn.warframestat.us/img/archon-hunt.png',
        primaryColor: 'text-rose-400',
        borderColor: 'border-rose-500/30',
        badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        glowColor: 'rgba(244, 63, 94, 0.25)'
      };
    }

    const name = bossName.toLowerCase();

    if (name.includes('amar')) {
      return {
        shardName: 'Crimson Archon Shard',
        shardImage: 'https://wiki.warframe.com/images/thumb/CrimsonArchonShard.png/150px-CrimsonArchonShard.png',
        primaryColor: 'text-red-400',
        borderColor: 'border-red-500/40',
        badgeBg: 'bg-red-500/10 border-red-500/20 text-red-400',
        glowColor: 'rgba(239, 68, 68, 0.25)'
      };
    }
    if (name.includes('nira')) {
      return {
        shardName: 'Amber Archon Shard',
        shardImage: 'https://wiki.warframe.com/images/thumb/AmberArchonShard.png/150px-AmberArchonShard.png',
        primaryColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/40',
        badgeBg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.25)'
      };
    }
    if (name.includes('boreal')) {
      return {
        shardName: 'Azure Archon Shard',
        shardImage: 'https://wiki.warframe.com/images/thumb/AzureArchonShard.png/150px-AzureArchonShard.png',
        primaryColor: 'text-blue-400',
        borderColor: 'border-blue-500/40',
        badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.25)'
      };
    }

    return {
      shardName: 'Archon Shard',
      shardImage: 'https://cdn.warframestat.us/img/archon-hunt.png',
      primaryColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      glowColor: 'rgba(244, 63, 94, 0.25)'
    };
  };

  const theme = archonData ? getThemeConfig(archonData.boss) : null;

  return (
    <div className="flex flex-col gap-5 w-full">
      {loading ? (
        <div className="text-center font-mono text-xs text-gray-500 my-8">Buscando caçada ativa...</div>
      ) : error ? (
        <div className="text-center font-mono text-xs text-red-400 my-8">Não foi possível carregar as informações.</div>
      ) : archonData && theme ? (
        <div className="flex flex-col gap-5">
          
          {/* Card Principal com Borda Dinâmica baseada no Archon */}
          <div className={`bg-gradient-to-r from-gray-900 to-gray-900/60 border ${theme.borderColor} rounded-lg p-4 flex items-center gap-4 shadow-inner transition-colors duration-300`}>
            
            {/* Coluna da Esquerda: Imagens */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              <div className={`w-20 h-20 rounded-lg bg-gray-950 border ${theme.borderColor} overflow-hidden flex items-center justify-center relative shadow`}>
                <img 
                  src={getArchonImage(archonData.boss)} 
                  alt={archonData.boss || 'Archon'} 
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = 'https://cdn.warframestat.us/img/archon-hunt.png';
                  }}
                />
              </div>

              <div className="w-20 h-20 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center relative shadow p-1.5" title={`Drop Garantido: ${theme.shardName}`}>
                <img 
                  src={theme.shardImage} 
                  alt={theme.shardName} 
                  className="w-full h-full object-contain"
                  style={{ filter: `drop-shadow(0 0 6px ${theme.glowColor})` }}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = 'https://cdn.warframestat.us/img/archon-hunt.png';
                  }}
                />
              </div>
            </div>

            {/* Coluna da Direita: Textos */}
            <div className="flex-1 flex flex-col justify-between h-full min-h-[168px] py-0.5">
              <div className="flex flex-col justify-center">
                <span className={`text-[10px] font-mono ${theme.primaryColor} uppercase tracking-wider`}>Alvo da Caçada</span>
                <h2 className="text-xl font-bold text-white font-mono mt-0.5">
                  {archonData.boss || 'Caçada Archon'}
                </h2>
                <span className="text-[11px] font-mono text-gray-400 mt-1">
                  Expira em: <span className="text-gray-200">{archonData.expiry ? new Date(archonData.expiry).toLocaleString() : 'N/A'}</span>
                </span>
              </div>

              <div className="border-t border-gray-800/80 my-2"></div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Recompensa Garantida</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-sm font-bold text-white font-mono truncate">
                    {theme.shardName}
                  </h3>
                </div>
                <span className={`text-[10px] font-mono mt-1 px-2 py-0.5 rounded border inline-block w-fit ${theme.badgeBg}`}>
                  Drop: Normal / Tauforged (Chance)
                </span>
              </div>
            </div>

          </div>

          {/* Informações Extras (Facção e Nodo) */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-gray-900/50 border border-gray-800/80 p-3 rounded-lg">
              <span className="text-gray-500 block text-[10px] uppercase">Facção</span>
              <span className="text-gray-200 font-semibold">{archonData.faction || 'Narmer'}</span>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/80 p-3 rounded-lg">
              <span className="text-gray-500 block text-[10px] uppercase">Nodo Principal</span>
              <span className="text-gray-200 font-semibold truncate block">{archonData.node || 'Mars'}</span>
            </div>
          </div>

          {/* Missões da Caçada */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Missões da Caçada:</span>
            <div className="flex flex-col gap-2">
              {archonData.missions && archonData.missions.length > 0 ? (
                archonData.missions.map((m: any, index: number) => (
                  <div key={index} className="bg-gray-900/50 border border-gray-800/80 rounded px-3 py-2.5 flex justify-between items-center font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`${theme.primaryColor} font-bold`}>#{index + 1}</span>
                      <span className="text-gray-200">{m.type} <span className="text-gray-400 text-[11px]">({m.node})</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded p-3 text-xs font-mono text-gray-400 text-center">
                  Nenhuma missão detalhada encontrada no payload.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center font-mono text-xs text-gray-500 my-8">Nenhum dado encontrado.</div>
      )}
    </div>
  );
}
