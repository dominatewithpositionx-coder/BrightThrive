export type MockWeather = {
  condition: string;
  emoji: string;
  label: string;
  tempF: number;
  outdoor: boolean;
  gradient: string;
};

const CONDITIONS: MockWeather[] = [
  { condition: 'sunny',         emoji: '☀️',  label: 'Sunny & bright',     tempF: 74, outdoor: true,  gradient: 'from-amber-100 to-orange-50' },
  { condition: 'partly-cloudy', emoji: '⛅',  label: 'Partly cloudy',      tempF: 68, outdoor: true,  gradient: 'from-sky-100 to-blue-50' },
  { condition: 'cloudy',        emoji: '☁️',  label: 'Overcast & cool',    tempF: 60, outdoor: true,  gradient: 'from-slate-100 to-gray-100' },
  { condition: 'windy',         emoji: '💨',  label: 'Breezy & fresh',     tempF: 58, outdoor: true,  gradient: 'from-teal-50 to-cyan-100' },
  { condition: 'rainy',         emoji: '🌧️', label: 'Cosy rainy day',     tempF: 54, outdoor: false, gradient: 'from-indigo-100 to-blue-100' },
  { condition: 'snowy',         emoji: '❄️',  label: 'Magical snowy day',  tempF: 30, outdoor: false, gradient: 'from-blue-100 to-cyan-100' },
  { condition: 'stormy',        emoji: '⛈️', label: 'Storm rolling in',   tempF: 50, outdoor: false, gradient: 'from-gray-200 to-slate-200' },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function getMockWeather(): MockWeather {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return CONDITIONS[Math.floor(seededRandom(seed) * CONDITIONS.length)];
}
