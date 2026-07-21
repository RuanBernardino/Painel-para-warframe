import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params;
  
  const targetPath = endpoint === 'fissures' ? 'fissures' : endpoint;

  try {
    const response = await fetch(`https://api.warframestat.us/pc/${targetPath === 'pc' ? '' : targetPath}`, {
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao buscar dados externos' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Falha interna no proxy' }, { status: 500 });
  }
}