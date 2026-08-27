import { NextResponse } from 'next/server';

type MongoDate = { $date: { $numberLong: string } };

type OracleMission = {
  _id: { $oid: string };
  Activation: MongoDate;
  Expiry: MongoDate;
  Node: string;
  MissionType?: string;
  Modifier?: string;
  ActiveMissionTier?: string;
  Hard?: boolean;
};

type OracleLiteSortie = {
  _id?: { $oid: string };
  Activation: MongoDate;
  Expiry: MongoDate;
  Boss?: string;
  Missions?: Array<{ missionType?: string; node?: string }>;
};

type OracleVoidTrader = {
  _id?: { $oid: string };
  Activation: MongoDate;
  Expiry: MongoDate;
  Node?: string;
};

const TIER_BY_MODIFIER: Record<string, { tier: string; tierNum: number }> = {
  VoidT1: { tier: 'Lith', tierNum: 1 },
  VoidT2: { tier: 'Meso', tierNum: 2 },
  VoidT3: { tier: 'Neo', tierNum: 3 },
  VoidT4: { tier: 'Axi', tierNum: 4 },
  VoidT5: { tier: 'Requiem', tierNum: 5 },
  VoidT6: { tier: 'Omnia', tierNum: 6 },
};

const CYCLE_ENDPOINTS = new Set(['earthCycle', 'cetusCycle', 'vallisCycle', 'cambionCycle']);

const ARCHON_BOSSES: Record<string, string> = {
  SORTIE_BOSS_AMAR: 'Archon Amar',
  SORTIE_BOSS_BOREAL: 'Archon Boreal',
  SORTIE_BOSS_NIRA: 'Archon Nira',
};

const MISSION_TYPES: Record<string, string> = {
  MT_ASSASSINATION: 'Assassinato',
  MT_CAPTURE: 'Captura',
  MT_DEFENSE: 'Defesa',
  MT_EXTERMINATION: 'Extermínio',
  MT_INTEL: 'Espionagem',
  MT_MOBILE_DEFENSE: 'Defesa Móvel',
  MT_RESCUE: 'Resgate',
  MT_SABOTAGE: 'Sabotagem',
  MT_SURVIVAL: 'Sobrevivência',
  MT_TERRITORY: 'Interceptação',
};

const RELAY_LOCATIONS: Record<string, string> = {
  MercuryHUB: 'Larunda Relay (Mercury)',
  EarthHUB: 'Strata Relay (Earth)',
  SaturnHUB: 'Kronia Relay (Saturn)',
  PlutoHUB: 'Orcus Relay (Pluto)',
};

type CycleData = {
  expiry?: string;
  isDay?: boolean;
  isWarm?: boolean;
  state?: string;
  [key: string]: unknown;
};

function mongoTime(value: MongoDate): number {
  return Number(value.$date.$numberLong);
}

function firstEntry<T>(value: T | T[] | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function localizationTail(value?: string): string {
  if (!value) return '';
  return value.split('/').pop()?.replace(/^RelayStation/, '') ?? value;
}

async function getOracleWorldState() {
  const response = await fetch('https://oracle.browse.wf/worldState.min.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('World state alternativo indisponível');
  return response.json();
}

async function getOracleVoidTrader() {
  const worldState = await getOracleWorldState() as { VoidTraders?: OracleVoidTrader | OracleVoidTrader[] };
  const trader = firstEntry(worldState.VoidTraders);
  if (!trader) throw new Error('Dados do Baro indisponíveis');

  return {
    id: trader._id?.$oid ?? `baro-${mongoTime(trader.Activation)}`,
    activation: new Date(mongoTime(trader.Activation)).toISOString(),
    expiry: new Date(mongoTime(trader.Expiry)).toISOString(),
    character: "Baro Ki'Teer",
    location: RELAY_LOCATIONS[trader.Node ?? ''] ?? trader.Node ?? 'Relay desconhecido',
  };
}

async function getOracleArchonHunt() {
  const [worldState, regionsResponse] = await Promise.all([
    getOracleWorldState() as Promise<{ LiteSorties?: OracleLiteSortie | OracleLiteSortie[] }>,
    fetch('https://browse.wf/warframe-public-export-plus/ExportRegions.json', { cache: 'no-store' }),
  ]);
  if (!regionsResponse.ok) throw new Error('Regiões do mapa indisponíveis');

  const hunt = firstEntry(worldState.LiteSorties);
  if (!hunt) throw new Error('Caçada ao Arconte indisponível');

  const regions = await regionsResponse.json() as Record<string, { name?: string; systemName?: string }>;
  const missions = (hunt.Missions ?? []).map(mission => {
    const region = regions[mission.node ?? ''];
    const nodeName = localizationTail(region?.name) || mission.node || 'Nodo desconhecido';
    const systemName = localizationTail(region?.systemName);
    return {
      type: MISSION_TYPES[mission.missionType ?? ''] ?? mission.missionType ?? 'Missão',
      node: systemName ? `${nodeName} (${systemName})` : nodeName,
    };
  });

  return {
    id: hunt._id?.$oid ?? `archon-${mongoTime(hunt.Activation)}`,
    activation: new Date(mongoTime(hunt.Activation)).toISOString(),
    expiry: new Date(mongoTime(hunt.Expiry)).toISOString(),
    boss: ARCHON_BOSSES[hunt.Boss ?? ''] ?? (localizationTail(hunt.Boss) || 'Caçada Archon'),
    faction: 'Narmer',
    node: missions.at(-1)?.node ?? missions[0]?.node ?? 'Sistema de Origem',
    missions,
  };
}

function hasActiveFissures(data: unknown): data is Array<{ expiry: string }> {
  return Array.isArray(data) && data.some((item) => {
    const expiry = Date.parse(item?.expiry);
    return Number.isFinite(expiry) && expiry > Date.now();
  });
}

function isCurrentCycle(data: unknown): data is CycleData {
  if (!data || typeof data !== 'object') return false;
  const expiry = Date.parse((data as CycleData).expiry ?? '');
  return Number.isFinite(expiry) && expiry > Date.now();
}

function getCalculatedCycle(endpoint: string): CycleData | null {
  const now = Date.now();

  if (endpoint === 'earthCycle') {
    const cycleSeconds = Math.floor(now / 1000) % 28800;
    const isDay = cycleSeconds < 14400;
    const secondsLeft = 14400 - (cycleSeconds % 14400);
    return {
      id: `earthCycle${Math.ceil((now + secondsLeft * 1000) / 60000) * 60000}`,
      expiry: new Date(now + secondsLeft * 1000).toISOString(),
      isDay,
      state: isDay ? 'day' : 'night',
    };
  }

  if (endpoint === 'vallisCycle') {
    const epoch = Date.parse('2026-02-04T19:46:48Z');
    const loopTime = 1_600_000;
    const warmTime = 400_000;
    const elapsed = ((now - epoch) % loopTime + loopTime) % loopTime;
    const isWarm = elapsed < warmTime;
    const timeLeft = isWarm ? warmTime - elapsed : loopTime - elapsed;
    return {
      id: `vallisCycle${now - elapsed}`,
      expiry: new Date(now + timeLeft).toISOString(),
      isWarm,
      state: isWarm ? 'warm' : 'cold',
    };
  }

  return null;
}

async function getOracleLandscapeCycle(endpoint: string): Promise<CycleData | null> {
  if (endpoint !== 'cetusCycle' && endpoint !== 'cambionCycle') return null;

  const response = await fetch('https://oracle.browse.wf/bounty-cycle', { cache: 'no-store' });
  if (!response.ok) throw new Error('Ciclo de recompensas alternativo indisponível');

  const data = await response.json() as { expiry?: number };
  if (!Number.isFinite(data.expiry)) throw new Error('Ciclo alternativo inválido');

  const now = Date.now();
  const bountyExpiry = Number(data.expiry);
  const nightStarts = bountyExpiry - 3_000_000;
  const isDay = now < nightStarts;
  const expiry = isDay ? nightStarts : bountyExpiry;

  if (expiry <= now) throw new Error('Ciclo alternativo desatualizado');

  if (endpoint === 'cetusCycle') {
    return {
      id: `cetusCycle${expiry}`,
      expiry: new Date(expiry).toISOString(),
      isDay,
      state: isDay ? 'day' : 'night',
    };
  }

  return {
    id: `cambionCycle${expiry}`,
    expiry: new Date(expiry).toISOString(),
    state: isDay ? 'fass' : 'vome',
  };
}

function advanceStaleCycle(endpoint: string, input: CycleData): CycleData | null {
  let expiry = Date.parse(input.expiry ?? '');
  if (!Number.isFinite(expiry)) return null;

  const result = { ...input };
  let guard = 0;
  while (expiry <= Date.now() && guard < 10000) {
    guard += 1;
    if (endpoint === 'earthCycle') {
      result.isDay = !result.isDay;
      result.state = result.isDay ? 'day' : 'night';
      expiry += 14_400_000;
    } else if (endpoint === 'cetusCycle') {
      result.isDay = !result.isDay;
      result.state = result.isDay ? 'day' : 'night';
      expiry += result.isDay ? 6_000_000 : 3_000_000;
    } else if (endpoint === 'cambionCycle') {
      result.state = result.state?.toLowerCase() === 'fass' ? 'vome' : 'fass';
      expiry += result.state === 'fass' ? 6_000_000 : 3_000_000;
    } else if (endpoint === 'vallisCycle') {
      result.isWarm = !result.isWarm;
      result.state = result.isWarm ? 'warm' : 'cold';
      expiry += result.isWarm ? 400_000 : 1_200_000;
    }
  }

  result.expiry = new Date(expiry).toISOString();
  return expiry > Date.now() ? result : null;
}

async function getFallbackCycle(endpoint: string, staleData?: CycleData): Promise<CycleData | null> {
  const calculated = getCalculatedCycle(endpoint);
  if (calculated) return calculated;

  try {
    const oracleCycle = await getOracleLandscapeCycle(endpoint);
    if (oracleCycle) return oracleCycle;
  } catch {
    // A projeção do último ciclo conhecido ainda permite manter o relógio funcionando.
  }

  return staleData ? advanceStaleCycle(endpoint, staleData) : null;
}

async function getOracleFissures() {
  const [worldStateResponse, regionsResponse, dictionaryResponse] = await Promise.all([
    fetch('https://oracle.browse.wf/worldState.min.json', { cache: 'no-store' }),
    fetch('https://browse.wf/warframe-public-export-plus/ExportRegions.json', {
      cache: 'no-store',
    }),
    fetch('https://browse.wf/warframe-public-export-plus/dict.en.json', {
      cache: 'no-store',
    }),
  ]);

  if (!worldStateResponse.ok || !regionsResponse.ok || !dictionaryResponse.ok) {
    throw new Error('Fonte alternativa indisponível');
  }

  const [worldState, regions, dictionary] = await Promise.all([
    worldStateResponse.json(),
    regionsResponse.json(),
    dictionaryResponse.json(),
  ]) as [
    { ActiveMissions?: OracleMission[]; VoidStorms?: OracleMission[] },
    Record<string, { name?: string; systemName?: string; missionName?: string; faction?: string }>,
    Record<string, string>
  ];

  const now = Date.now();
  const activeMissions = worldState.ActiveMissions ?? [];
  const voidStorms = worldState.VoidStorms ?? [];

  return [...activeMissions, ...voidStorms]
    .filter((mission) => mongoTime(mission.Activation) <= now && mongoTime(mission.Expiry) > now)
    .map((mission) => {
      const region = regions[mission.Node] ?? {};
      const modifier = mission.Modifier ?? mission.ActiveMissionTier ?? '';
      const tier = TIER_BY_MODIFIER[modifier] ?? { tier: 'Omnia', tierNum: 6 };
      const nodeName = dictionary[region.name ?? ''] ?? mission.Node;
      const systemName = dictionary[region.systemName ?? ''] ?? '';
      const missionType = dictionary[region.missionName ?? ''] ?? mission.MissionType ?? 'Unknown';
      const factionNames: Record<string, string> = {
        FC_GRINEER: 'Grineer',
        FC_CORPUS: 'Corpus',
        FC_INFESTATION: 'Infested',
        FC_OROKIN: 'Orokin',
        FC_SENTIENT: 'Sentient',
        FC_MITW: 'The Murmur',
      };

      return {
        id: mission._id.$oid,
        activation: new Date(mongoTime(mission.Activation)).toISOString(),
        expiry: new Date(mongoTime(mission.Expiry)).toISOString(),
        node: systemName ? `${nodeName} (${systemName})` : nodeName,
        missionType,
        missionTypeKey: mission.MissionType ?? missionType,
        enemy: factionNames[region.faction ?? ''] ?? 'Unknown',
        enemyKey: region.faction ?? 'Unknown',
        nodeKey: mission.Node,
        ...tier,
        isStorm: Boolean(mission.ActiveMissionTier),
        isHard: Boolean(mission.Hard),
      };
    });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params;

  if (endpoint === 'voidTrader' || endpoint === 'archonHunt') {
    try {
      const data = endpoint === 'voidTrader'
        ? await getOracleVoidTrader()
        : await getOracleArchonHunt();
      return NextResponse.json(data, {
        headers: {
          'X-Warframe-Source': 'browse-wf',
          'X-Server-Time': Date.now().toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: 'Dados temporariamente indisponíveis' }, { status: 503 });
    }
  }
  
  const targetPath = endpoint === 'fissures' ? 'fissures' : endpoint;

  try {
    const response = await fetch(`https://api.warframestat.us/pc/${targetPath === 'pc' ? '' : targetPath}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();

      if (endpoint !== 'fissures' || hasActiveFissures(data)) {
        if (!CYCLE_ENDPOINTS.has(endpoint) || isCurrentCycle(data)) {
          return NextResponse.json(data, {
            headers: {
              'X-Warframe-Source': 'warframestat',
              'X-Server-Time': Date.now().toString(),
            },
          });
        }

        const repairedCycle = await getFallbackCycle(endpoint, data);
        if (repairedCycle) return NextResponse.json(repairedCycle, {
          headers: {
            'X-Warframe-Source': 'calculated-fallback',
            'X-Server-Time': Date.now().toString(),
          },
        });
      }
    }

    if (endpoint === 'fissures') {
      const fallbackData = await getOracleFissures();
      return NextResponse.json(fallbackData, {
        headers: {
          'X-Warframe-Source': 'browse-wf',
          'X-Server-Time': Date.now().toString(),
        },
      });
    }

    if (CYCLE_ENDPOINTS.has(endpoint)) {
      const fallbackCycle = await getFallbackCycle(endpoint);
      if (fallbackCycle) return NextResponse.json(fallbackCycle, {
        headers: {
          'X-Warframe-Source': 'calculated-fallback',
          'X-Server-Time': Date.now().toString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar dados externos' },
      { status: response.status || 502 }
    );
  } catch (error) {
    if (endpoint === 'fissures') {
      try {
        const fallbackData = await getOracleFissures();
        return NextResponse.json(fallbackData, {
          headers: {
            'X-Warframe-Source': 'browse-wf',
            'X-Server-Time': Date.now().toString(),
          },
        });
      } catch {
        // As duas fontes falharam; responde abaixo com indisponibilidade temporária.
      }
    }

    if (CYCLE_ENDPOINTS.has(endpoint)) {
      const fallbackCycle = await getFallbackCycle(endpoint);
      if (fallbackCycle) return NextResponse.json(fallbackCycle, {
        headers: {
          'X-Warframe-Source': 'calculated-fallback',
          'X-Server-Time': Date.now().toString(),
        },
      });
    }

    return NextResponse.json({ error: 'Fontes de dados temporariamente indisponíveis' }, { status: 503 });
  }
}
