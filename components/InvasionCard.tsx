export default function InvasionCard({ invasion }: { invasion: any }) {
  return (
    <div className="bg-[#1c1c1c] border-b border-[#333] p-2 text-xs">
      <div className="flex justify-between mb-1">
        <span className="font-bold text-gray-200">{invasion.node}</span>
        <span className="text-blue-400">{invasion.completion.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-gray-400">
        <span>{invasion.attackerReward?.items?.[0] || 'N/A'}</span>
        <span>vs</span>
        <span>{invasion.defenderReward?.items?.[0] || 'N/A'}</span>
      </div>
    </div>
  );
}