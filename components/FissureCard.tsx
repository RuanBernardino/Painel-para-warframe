import Timer from './Timer';

export default function FissureCard({ fissure, category }: { fissure: any, category?: string }) {
  return (
    <div className="bg-[#0e1422] border border-gray-800/60 p-3 rounded-lg flex justify-between items-center text-xs">
      <div>
        <p className="font-bold text-gray-200">{fissure.node}</p>
        <p className="text-blue-400 font-medium">
          {fissure.missionType} <span className="text-gray-400">({fissure.tier})</span>
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{fissure.enemy}</p>
      </div>
      
      <div className="text-right flex flex-col items-end gap-1">
        {category && (
          <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
            {category}
          </span>
        )}
        <div className="font-mono text-yellow-500 text-sm">
          <Timer targetDate={fissure.expiry} />
        </div>
      </div>
    </div>
  );
}