import { NextResponse } from 'next/server';
import localArbitrationSchedule from '@/lib/data/arbys.json';
import arbitrationNodes from '@/lib/data/arbitrationNodes.json';

type ArbitrationNode = {
  node: string;
  type: string;
  faction: string;
  tier: string;
  bonus: string | null;
};

const nodes = arbitrationNodes as Record<string, ArbitrationNode>;

async function getScheduleText(): Promise<{ text: string; source: string }> {
  try {
    const response = await fetch('https://browse.wf/arbys.txt', {
      next: { revalidate: 3600 },
    });
    if (response.ok) return { text: await response.text(), source: 'browse-wf' };
  } catch {
    // A cópia local é usada abaixo.
  }

  const text = (localArbitrationSchedule as Array<[number, string]>)
    .map(([timestamp, node]) => `${timestamp},${node}`)
    .join('\n');
  return { text, source: 'local-copy' };
}

function titleCaseMission(value: string): string {
  const special: Record<string, string> = {
    ALCHEMY: 'Alchemy',
    DEFECTION: 'Defection',
    DEFENSE: 'Defense',
    DISRUPTION: 'Disruption',
    EXCAVATION: 'Excavation',
    INFESTED_SALVAGE: 'Infested Salvage',
    INTERCEPTION: 'Interception',
    MIRROR_DEFENSE: 'Mirror Defense',
    SURVIVAL: 'Survival',
    CONJUNCTION_SURVIVAL: 'Conjunction Survival',
    VOID_CASCADE: 'Void Cascade',
    VOID_FLOOD: 'Void Flood',
    VOID_ARMAGEDDON: 'Void Armageddon',
  };
  return special[value] ?? value.toLowerCase().replace(/(^|\s|_)\w/g, (letter) => letter.toUpperCase()).replaceAll('_', ' ');
}

export async function GET() {
  try {
    const schedule = await getScheduleText();
    const rows = schedule.text
      .split(/\r?\n/)
      .map((line) => line.trim().split(','))
      .filter((parts) => parts.length === 2 && Number.isFinite(Number(parts[0])));

    const currentHour = Math.floor(Date.now() / 3_600_000) * 3600;
    const currentIndex = rows.findIndex(([timestamp]) => Number(timestamp) >= currentHour);
    const startIndex = Math.max(0, currentIndex === -1 ? rows.length - 1 : currentIndex);

    const items = rows.slice(startIndex, startIndex + 72).flatMap(([timestamp, nodeId]) => {
      const node = nodes[nodeId];
      if (!node) return [];
      const start = Number(timestamp) * 1000;
      return [{
        id: `${timestamp}-${nodeId}`,
        start,
        node: node.node,
        type: titleCaseMission(node.type),
        faction: node.faction,
        tier: `${node.tier} tier`,
        bonus: node.bonus ?? undefined,
      }];
    });

    return NextResponse.json(items, {
      headers: {
        'X-Arbitration-Source': schedule.source,
        'X-Server-Time': Date.now().toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Calendário de Arbitragens indisponível' }, { status: 503 });
  }
}
