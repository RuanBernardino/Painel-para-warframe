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

  useEffect(() => {
    async function fetchCircuit() {
      try {
        const res = await fetch('https://api.warframestat.us/pc');
        const data = await res.json();
        if (data && data.duviri) {
          setCircuitData(data.duviri);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do Circuit:', err);
      }
    }
    fetchCircuit();
  }, []);

  const normalCategory = circuitData?.choices?.find((c: any) => c.category === 'normal');
  const hardCategory = circuitData?.choices?.find((c: any) => c.category === 'hard');

  const warframes = normalCategory?.choices || ['Saryn', 'Vauban', 'Nova'];
  const weapons = hardCategory?.choices || ['Lex', 'Magistar', 'Boltor', 'Bronco', 'CeramicDagger'];

  return (
    <div className="bg-[#131b2e] p-4 rounded-xl border border-gray-800 text-white flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            The Circuit (Duviri)
          </h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
            Weekly
          </span>
        </div>

        {/* Warframes */}
        <div className="mb-3">
          <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold uppercase">Warframes</span>
          <div className="flex gap-2">
            {warframes.map((wf: string, index: number) => (
              <CircuitItemCard key={index} name={wf} type="wf" />
            ))}
          </div>
        </div>

        {/* Armas do Steel Path (Exibindo compactas em linha ou rolagem horizontal se preferir) */}
        <div>
          <span className="text-[10px] text-gray-400 block mb-1.5 font-semibold uppercase">Steel Path Incarnons</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weapons.map((weapon: string, index: number) => (
              <div key={index} className="w-20 shrink-0">
                <CircuitItemCard name={weapon} type="weapon" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}