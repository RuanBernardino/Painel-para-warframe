'use client';
import { useState } from 'react';

const endpoints = [
  'pc', 'alerts', 'arbitration', 'archonHunt', 'cetusCycle', 'constructionProgress', 
  'dailyDeals', 'darkSectors', 'duviriCycle', 'earthCycle', 'events', 'fissures', 
  'flashMissions', 'invasions', 'news', 'nightwave', 'outposts', 'rivens', 
  'sortie', 'steelPath', 'syndicateMissions', 'vallisCycle', 'voidTrader'
];

export default function ApiExplorer() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [formatado, setFormatado] = useState(false);

  const fetchAll = async () => {
    const newResults: Record<string, any> = {};
    await Promise.all(endpoints.map(async (path) => {
      try {
        const res = await fetch(`https://api.warframestat.us/pc/${path}`);
        newResults[path] = await res.json();
      } catch (e) {
        newResults[path] = { error: 'Falha ao buscar' };
      }
    }));
    setResults(newResults);
  };

  const formatData = (path: string, data: any) => {
    if (!formatado) return JSON.stringify(data, null, 2);
    if (data.error) return "Erro ao carregar.";

    switch(path) {
      case 'pc': return `Estado completo carregado (${Object.keys(data).length} categorias)`;
      case 'alerts': return data.map((a: any) => `${a.mission.type}: ${a.mission.reward.asString}`).join('\n');
      case 'arbitration': return `${data.node} | ${data.enemy} (${data.type})`;
      case 'archonHunt': return `${data.boss} | ${data.faction}`;
      case 'cetusCycle': return `${data.isDay ? 'DIA' : 'NOITE'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'constructionProgress': return `Fomorian: ${data.fomorianProgress}% | Razorback: ${data.razorbackProgress}%`;
      case 'dailyDeals': return data.map((d: any) => `${d.item}: ${d.discount}% off`).join('\n');
      case 'darkSectors': return `Total de Setores: ${data.length}`;
      case 'duviriCycle': return `Estado: ${data.state} | Expira: ${new Date(data.expiry).toLocaleTimeString()}`;
      case 'earthCycle': return `${data.isDay ? 'DIA' : 'NOITE'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'events': return data.map((e: any) => e.description).join('\n');
      case 'fissures': return `Total de Fissuras Ativas: ${data.length}`;
      case 'flashMissions': return data.length > 0 ? "Existem missões flash ativas" : "Nenhuma";
      case 'invasions': return `Total de Invasões: ${data.length}`;
      case 'news': return data.map((n: any) => n.message).slice(0, 3).join('\n---\n');
      case 'nightwave': return `Ativo: ${data.active ? 'SIM' : 'NÃO'}`;
      case 'outposts': return data.mission ? `Local: ${data.mission.node}` : "Nenhum posto ativo";
      case 'rivens': return `Total de dados Riven: ${data.length}`;
      case 'sortie': return `${data.boss} | Facção: ${data.faction}`;
      case 'steelPath': return `Incursão: ${data.currentReward ? 'Ativa' : 'Não'}`;
      case 'syndicateMissions': return `Total de Sindicatos: ${data.length}`;
      case 'vallisCycle': return `${data.isWarm ? 'QUENTE' : 'FRIO'} (Expira: ${new Date(data.expiry).toLocaleTimeString()})`;
      case 'voidTrader': return `${data.character} em ${data.location} | Ativo: ${data.active ? 'SIM' : 'NÃO'}`;
      default: return JSON.stringify(data).slice(0, 100) + "...";
    }
  };

  return (
    <div className="p-6 bg-gray-950 text-white min-h-screen">
      <div className="flex gap-4 mb-6 sticky top-0 bg-gray-950 p-4 z-10 border-b border-gray-800">
        <button onClick={fetchAll} className="bg-blue-600 px-4 py-2 rounded text-sm font-bold uppercase">Carregar Tudo</button>
        <button onClick={() => setFormatado(!formatado)} className="bg-green-600 px-4 py-2 rounded text-sm font-bold uppercase">
          {formatado ? 'Modo Bruto' : 'Modo Formatado'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {endpoints.map((path) => (
          <div key={path} className="bg-gray-900 p-4 rounded border border-gray-700 shadow-lg">
            <h2 className="text-blue-400 font-bold mb-2 uppercase text-xs truncate">{path}</h2>
            <pre className="text-[10px] whitespace-pre-wrap max-h-60 overflow-y-auto bg-black p-2 rounded border border-gray-800 text-gray-300">
              {results[path] ? formatData(path, results[path]) : 'Pressione "Carregar Tudo"'}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}