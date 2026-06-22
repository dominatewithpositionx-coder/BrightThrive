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

    const { latitude: lat, longitude: lon, name } = place;
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`,
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

    return { location: name, tempC, feelsLikeC, highC, lowC, condition, emoji, isOutdoorFriendly, suggestion, weatherCode: code };
  } catch {
    return null;
  }
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
