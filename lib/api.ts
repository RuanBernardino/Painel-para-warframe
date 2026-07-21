const BASE_URL = 'https://api.warframestat.us/pc';

export async function getInvasions() {
  const res = await fetch(`${BASE_URL}/invasions`, { next: { revalidate: 60 } });
  return res.json();
}
// Adicione esta função ao seu arquivo lib/api.ts
export async function getFissures() {
  const res = await fetch(`${BASE_URL}/fissures`, { next: { revalidate: 60 } });
  return res.json();
}