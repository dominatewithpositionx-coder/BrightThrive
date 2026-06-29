export type WeatherContext = {
  condition: string;
  tempC: number;
  isRainy: boolean;
  isSnowy: boolean;
  isHot: boolean;
  isCold: boolean;
  summary: string;
};

export interface WeatherData {
  location: string;
  tempC: number;
  feelsLikeC: number;
  highC: number;
  lowC: number;
  condition: string;
  emoji: string;
  isOutdoorFriendly: boolean;
  suggestion: string;
  weatherCode: number;
  windSpeed?: number;
  humidity?: number;
  precipProbability?: number;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
}

function mapWeatherCode(code: number): { condition: string; emoji: string; isOutdoorFriendly: boolean } {
  if (code === 0)               return { condition: 'Clear sky',    emoji: '☀️',  isOutdoorFriendly: true  };
  if (code >= 1  && code <= 3)  return { condition: 'Mainly clear', emoji: '🌤️', isOutdoorFriendly: true  };
  if (code >= 45 && code <= 48) return { condition: 'Foggy',        emoji: '🌫️', isOutdoorFriendly: false };
  if (code >= 51 && code <= 67) return { condition: 'Rainy',        emoji: '🌧️', isOutdoorFriendly: false };
  if (code >= 71 && code <= 77) return { condition: 'Snowy',        emoji: '❄️',  isOutdoorFriendly: false };
  if (code >= 80 && code <= 82) return { condition: 'Rain showers', emoji: '🌦️', isOutdoorFriendly: false };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', emoji: '⛈️', isOutdoorFriendly: false };
  return { condition: 'Cloudy', emoji: '☁️', isOutdoorFriendly: true };
}

async function fetchWeatherByLatLon(lat: number, lon: number, name: string): Promise<WeatherData | null> {
  try {
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m,relative_humidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,wind_speed_10m_max,sunrise,sunset` +
      `&timezone=auto&forecast_days=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!wxRes.ok) return null;
    const wx = await wxRes.json();

    const tempC      = Math.round(wx.current?.temperature_2m ?? 15);
    const feelsLikeC = Math.round(wx.current?.apparent_temperature ?? tempC);
    const highC      = Math.round(wx.daily?.temperature_2m_max?.[0] ?? tempC);
    const lowC       = Math.round(wx.daily?.temperature_2m_min?.[0] ?? tempC);
    const code       = wx.current?.weather_code ?? 0;

    const { condition, emoji, isOutdoorFriendly } = mapWeatherCode(code);
    const suggestion = isOutdoorFriendly
      ? 'Great day for outdoor missions!'
      : 'Indoor missions are the way to go today.';

    return {
      location: name, tempC, feelsLikeC, highC, lowC,
      condition, emoji, isOutdoorFriendly, suggestion, weatherCode: code,
      windSpeed:         Math.round(wx.current?.wind_speed_10m ?? 0),
      humidity:          Math.round(wx.current?.relative_humidity_2m ?? 50),
      precipProbability: Math.round(wx.daily?.precipitation_probability_max?.[0] ?? 0),
      uvIndex:           Math.round(wx.daily?.uv_index_max?.[0] ?? 0),
      sunrise:           wx.daily?.sunrise?.[0] ?? undefined,
      sunset:            wx.daily?.sunset?.[0] ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(location: string): Promise<WeatherData | null> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const place = geoData?.results?.[0];
    if (!place) return null;
    return fetchWeatherByLatLon(place.latitude, place.longitude, place.name);
  } catch {
    return null;
  }
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // Reverse-geocode to get a city name
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    const name = geoRes.ok ? ((await geoRes.json())?.results?.[0]?.name ?? 'Your location') : 'Your location';
    return fetchWeatherByLatLon(lat, lon, name);
  } catch {
    return fetchWeatherByLatLon(lat, lon, 'Your location');
  }
}

// In-memory cache: keyed by lowercase city name, expires after 30 minutes
const weatherCache = new Map<string, { data: WeatherData; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function fetchWeatherCached(location: string): Promise<WeatherData | null> {
  const key = location.toLowerCase().trim();
  const cached = weatherCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const data = await fetchWeather(location);
  if (data) {
    weatherCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return data;
}

export function getClothingSuggestions(weather: WeatherData): string[] {
  const suggestions: string[] = [];
  const { tempC, feelsLikeC, precipProbability = 0, windSpeed = 0, uvIndex = 0, condition } = weather;
  const lc = condition.toLowerCase();
  const isRainy  = lc.includes('rain') || lc.includes('shower') || precipProbability > 60;
  const isSnowy  = lc.includes('snow');
  const isStormy = lc.includes('storm') || lc.includes('thunder');
  const isWindy  = windSpeed > 25;
  const feelsHot = feelsLikeC >= 28;
  const feelsCold = feelsLikeC <= 5;
  const feelsCool = feelsLikeC > 5 && feelsLikeC < 15;

  if (isStormy)       suggestions.push('Stay indoors — storm warning! ⛈️');
  else if (isSnowy)   { suggestions.push('Warm coat & snow boots ❄️'); suggestions.push('Hat, scarf & gloves 🧤'); }
  else if (isRainy)   { suggestions.push('Rain jacket or umbrella ☂️'); suggestions.push('Waterproof shoes 👟'); }
  else if (feelsHot)  { suggestions.push('Light, breathable clothes ☀️'); if (uvIndex >= 6) suggestions.push('Sunscreen SPF 30+ 🧴'); suggestions.push('Hat for sun protection 🧢'); }
  else if (feelsCold) { suggestions.push('Heavy coat & warm layers 🧥'); suggestions.push('Warm hat & gloves 🧤'); }
  else if (feelsCool) { suggestions.push('Light jacket or hoodie 🧥'); }
  else                suggestions.push('Comfortable casual clothes 👕');

  if (isWindy && !isStormy && !isSnowy) suggestions.push('Windproof jacket 💨');
  if (uvIndex >= 8 && !feelsHot)        suggestions.push('Sunscreen SPF 30+ 🧴');

  return suggestions;
}

export async function getWeather(city: string): Promise<WeatherContext | null> {
  const data = await fetchWeather(city);
  if (!data) return null;
  const lc = data.condition.toLowerCase();
  const isRainy = lc.includes('rain') || lc.includes('shower');
  const isSnowy = lc.includes('snow');
  const isHot   = data.tempC >= 28;
  const isCold  = data.tempC <= 5;
  let summary = `Weather in ${data.location}: ${data.condition}, ${data.tempC}°C.`;
  if (isSnowy)      summary += ' It is snowing outside.';
  else if (isRainy) summary += ' It is raining outside.';
  else if (isHot)   summary += ' It is hot and sunny.';
  else if (isCold)  summary += ' It is cold outside.';
  else              summary += ' Weather is mild.';
  return { condition: data.condition, tempC: data.tempC, isRainy, isSnowy, isHot, isCold, summary };
}

export function weatherMissionHint(w: WeatherContext | null): string {
  if (!w) return '';
  if (w.isSnowy)  return 'Prioritize indoor activities and optionally include 1–2 snow-themed outdoor missions (e.g. build a snowman, shovel the driveway).';
  if (w.isRainy)  return 'Focus on indoor activities. Avoid outdoor missions.';
  if (w.isHot)    return 'Include water-based or shaded outdoor activities. Avoid strenuous outdoor activities in peak heat.';
  if (w.isCold)   return 'Prefer indoor activities. Any outdoor missions should be brief.';
  return 'Weather is nice — include a mix of indoor and outdoor activities.';
}
