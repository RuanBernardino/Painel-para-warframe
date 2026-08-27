"use client";

import { useCallback, useEffect, useState } from 'react';
import Timer from './Timer';
import { translateMissionName } from '@/lib/data/missionTranslations';

export default function FissureCard({
  fissure,
  category,
  clockOffsetMs = 0,
}: {
  fissure: any;
  category?: string;
  clockOffsetMs?: number;
}) {
  const [isExpired, setIsExpired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleExpire = useCallback(() => setIsExpired(true), []);

  useEffect(() => {
    setIsVisible(true);
    const expiry = Date.parse(fissure?.expiry);
    if (!Number.isFinite(expiry)) return;

    const untilExpiry = Math.max(0, expiry - (Date.now() + clockOffsetMs));
    const expireTimer = window.setTimeout(() => setIsExpired(true), untilExpiry);
    const removeTimer = window.setTimeout(() => setIsVisible(false), untilExpiry + 3000);

    return () => {
      window.clearTimeout(expireTimer);
      window.clearTimeout(removeTimer);
    };
  }, [clockOffsetMs, fissure?.id, fissure?.expiry]);

  // Proteção caso o objeto fissure venha undefined/null
  if (!fissure || !isVisible) {
    return null;
  }

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
            {translateMissionName(fissure.missionType)} <span className="text-gray-400">({fissure.tier})</span>
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
            <Timer
              targetDate={fissure.expiry}
              onExpire={handleExpire}
              clockOffsetMs={clockOffsetMs}
            />
          )}
        </div>
      </div>
    </div>
  );
}
