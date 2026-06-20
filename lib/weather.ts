export type WeatherContext = {
  condition: string;   // e.g. "Sunny", "Light rain", "Blizzard"
  tempC: number;
  isRainy: boolean;
  isSnowy: boolean;
  isHot: boolean;     // >28°C
  isCold: boolean;    // <5°C
  summary: string;    // one-line for prompt injection
};

export async function getWeather(city: string): Promise<WeatherContext | null> {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();

    const current = data?.current_condition?.[0];
    if (!current) return null;

    const condition: string = current.weatherDesc?.[0]?.value ?? 'Unknown';
    const tempC = parseInt(current.temp_C ?? '15', 10);
    const lc = condition.toLowerCase();

    const isRainy = lc.includes('rain') || lc.includes('drizzle') || lc.includes('shower');
    const isSnowy = lc.includes('snow') || lc.includes('blizzard') || lc.includes('sleet') || lc.includes('ice');
    const isHot = tempC >= 28;
    const isCold = tempC <= 5;

    let summary = `Weather in ${city}: ${condition}, ${tempC}°C.`;
    if (isSnowy) summary += ' It is snowing outside.';
    else if (isRainy) summary += ' It is raining outside.';
    else if (isHot) summary += ' It is hot and sunny.';
    else if (isCold) summary += ' It is cold outside.';
    else summary += ' Weather is mild.';

    return { condition, tempC, isRainy, isSnowy, isHot, isCold, summary };
  } catch {
    return null;
  }
}

export function weatherMissionHint(w: WeatherContext | null): string {
  if (!w) return '';
  if (w.isSnowy) return 'Prioritize indoor activities and optionally include 1–2 snow-themed outdoor missions (e.g. build a snowman, shovel the driveway).';
  if (w.isRainy) return 'Focus on indoor activities. Avoid outdoor missions.';
  if (w.isHot) return 'Include water-based or shaded outdoor activities. Avoid strenuous outdoor activities in peak heat.';
  if (w.isCold) return 'Prefer indoor activities. Any outdoor missions should be brief.';
  return 'Weather is nice — include a mix of indoor and outdoor activities.';
}
