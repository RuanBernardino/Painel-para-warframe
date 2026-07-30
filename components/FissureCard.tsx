import Timer from './Timer';

export default function FissureCard({ fissure, category }: { fissure: any, category?: string }) {
  // Proteção caso o objeto fissure venha undefined/null
  if (!fissure) {
    return null;
  }

  // Calcula se o tempo da fissura já acabou
  const isExpired = fissure.expiry ? new Date(fissure.expiry).getTime() <= Date.now() : false;

  // Função auxiliar para retornar a imagem correta com base na Era (Tier)
  const getRelicImage = (tierName: string) => {
    switch (tierName?.toLowerCase()) {
      case 'axi': return '/RelicAxi.png';
      case 'lith': return '/RelicLith.png';
      case 'meso': return '/RelicMeso.png';
      case 'neo': return '/RelicNeo.png';
      case 'requiem': return '/RelicRequiem.png';
      default: return '/Omnia.png';
    }
  };

  return (
    <div className="bg-[#0e1422] border border-gray-800/60 p-3 rounded-lg flex justify-between items-center text-xs">
      <div className="flex items-center gap-2.5">
        {/* Imagem da relíquia correspondente ao tier */}
        <img 
          src={getRelicImage(fissure.tier)} 
          alt={fissure.tier} 
          className="w-7 h-7 object-contain"
        />
        <div>
          <p className="font-bold text-gray-200">{fissure.node}</p>
          <p className="text-blue-400 font-medium">
            {fissure.missionType} <span className="text-gray-400">({fissure.tier})</span>
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{fissure.enemy}</p>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end gap-1">
        {category && (
          <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
            {category}
          </span>
        )}
        <div className="font-mono text-yellow-500 text-sm">
          {isExpired ? (
            <span className="text-yellow-500 font-semibold">Fechou</span>
          ) : (
            <Timer targetDate={fissure.expiry} />
          )}
        </div>
      </div>
    </div>
  );
}