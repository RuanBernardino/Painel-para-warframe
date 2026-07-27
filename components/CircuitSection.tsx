'use client';
import { useEffect, useState } from 'react';

function getGitHubAssetUrl(name: string) {
  if (!name) return '';
  const formatted = name.trim();
  return `https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/${formatted}.png`;
}

function CircuitItemCard({ name, type }: { name: string; type: 'wf' | 'weapon' }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getGitHubAssetUrl(name);

  return (
    <div className="bg-[#0e1422] border border-gray-800 p-2 rounded-lg flex flex-col items-center gap-1.5 text-center relative flex-1 min-w-[70px]">
      {type === 'wf' && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-500" title="Disponível"></span>
      )}

      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden relative ${
        type === 'wf' ? 'bg-blue-950/50 border-blue-500/20' : 'bg-gray-900 border-gray-700'
      }`}>
        {!imgError ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`text-xs font-bold ${type === 'wf' ? 'text-blue-300' : 'text-gray-400'}`}>
            {type === 'wf' ? name.charAt(0) : '⚔️'}
          </span>
        )}
      </div>

      <span className="text-[10px] font-medium text-gray-200 truncate w-full" title={name}>
        {name}
      </span>
    </div>
  );
}

export default function CircuitSection() {
  const [circuitData, setCircuitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCircuit() {
      try {
        const res = await fetch('https://api.warframestat.us/pc');
        const data = await res.json();
        // Utiliza o bloco correto duviriCycle
        if (data && data.duviriCycle) {
          setCircuitData(data.duviriCycle);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do Circuit:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCircuit();
  }, []);

  const choicesArray = Array.isArray(circuitData?.choices) ? circuitData.choices : [];
  const normalCategory = choicesArray.find((c: any) => c?.category?.toLowerCase() === 'normal');
  const hardCategory = choicesArray.find((c: any) => c?.category?.toLowerCase() === 'hard');

  const warframes = normalCategory?.choices || [];
  const weapons = hardCategory?.choices || [];

  return (
    <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 text-white flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            O Circuito
          </h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
            Semanalmente
          </span>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400 animate-pulse">
            Carregando dados da API...
          </div>
        ) : (
          <>
            {/* Warframes */}
            <div className="mb-3">
              <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold uppercase">Warframes</span>
              <div className="flex gap-2">
                {warframes.length > 0 ? (
                  warframes.map((wf: string, index: number) => (
                    <CircuitItemCard key={index} name={wf} type="wf" />
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Nenhum warframe retornado pela API.</span>
                )}
              </div>
            </div>

            {/* Armas do Steel Path */}
            <div>
              <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold uppercase">Steel Path Incarnons</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {weapons.length > 0 ? (
                  weapons.map((weapon: string, index: number) => (
                    <div key={index} className="w-20 shrink-0">
                      <CircuitItemCard name={weapon} type="weapon" />
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Nenhuma arma retornado pela API.</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}