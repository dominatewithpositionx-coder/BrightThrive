'use client';

import type { WeatherData } from '@/lib/weather';
import type { MockWeather } from '@/lib/mock-weather';

// ─── Weather type helpers ─────────────────────────────────────────────────────

function weatherKey(condition: string): 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'night' {
  const lc = condition.toLowerCase();
  if (lc.includes('thunder') || lc.includes('storm')) return 'stormy';
  if (lc.includes('snow'))                             return 'snowy';
  if (lc.includes('rain') || lc.includes('shower') || lc.includes('drizzle')) return 'rainy';
  if (lc.includes('fog') || lc.includes('cloud'))     return 'cloudy';
  if (lc.includes('mainly clear') || lc.includes('partly')) return 'partly-cloudy';
  return 'sunny';
}

const SCENE_THEMES: Record<string, {
  gradient: string; textPrimary: string; textSecondary: string; pillBg: string;
}> = {
  'sunny':         { gradient: 'from-amber-300 via-orange-200 to-yellow-100', textPrimary: 'text-amber-900', textSecondary: 'text-amber-700', pillBg: 'bg-amber-100/80' },
  'partly-cloudy': { gradient: 'from-sky-300 via-blue-200 to-cyan-100',       textPrimary: 'text-sky-900',   textSecondary: 'text-sky-700',   pillBg: 'bg-sky-100/80' },
  'cloudy':        { gradient: 'from-slate-300 via-gray-200 to-slate-100',    textPrimary: 'text-slate-800', textSecondary: 'text-slate-600', pillBg: 'bg-slate-100/80' },
  'rainy':         { gradient: 'from-indigo-400 via-blue-300 to-slate-200',   textPrimary: 'text-indigo-900',textSecondary: 'text-indigo-700',pillBg: 'bg-indigo-100/80' },
  'snowy':         { gradient: 'from-blue-200 via-cyan-100 to-slate-100',     textPrimary: 'text-blue-900',  textSecondary: 'text-blue-700',  pillBg: 'bg-blue-100/80' },
  'stormy':        { gradient: 'from-gray-600 via-slate-400 to-gray-300',     textPrimary: 'text-white',     textSecondary: 'text-gray-200',  pillBg: 'bg-white/20' },
  'night':         { gradient: 'from-indigo-900 via-purple-900 to-slate-800', textPrimary: 'text-white',     textSecondary: 'text-indigo-200',pillBg: 'bg-white/15' },
};

// ─── Animated weather illustrations ──────────────────────────────────────────

function SunIllustration() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Rotating rays */}
      <div className="absolute inset-0 animate-sun-rays" style={{ willChange: 'transform' }}>
        {[0,45,90,135,180,225,270,315].map((deg) => (
          <div key={deg} className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="w-1 h-3 bg-amber-400/70 rounded-full" style={{ marginBottom: '52px' }} />
          </div>
        ))}
      </div>
      {/* Sun body */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 animate-sun-glow shadow-lg z-10" />
    </div>
  );
}

function CloudShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="white" opacity="0.85">
      <ellipse cx="40" cy="28" rx="30" ry="14" />
      <ellipse cx="28" cy="24" rx="18" ry="14" />
      <ellipse cx="52" cy="22" rx="20" ry="15" />
    </svg>
  );
}

function SunnyScene() {
  return (
    <div className="relative h-20 w-full overflow-hidden flex items-center justify-center">
      <div className="animate-float"><SunIllustration /></div>
    </div>
  );
}

function PartlyCloudyScene() {
  return (
    <div className="relative h-20 w-full overflow-hidden flex items-center">
      <div className="absolute right-6 top-1 animate-float"><SunIllustration /></div>
      <div className="absolute left-0 bottom-0 w-44 animate-cloud"><CloudShape className="w-44 drop-shadow-md" /></div>
    </div>
  );
}

function CloudyScene() {
  return (
    <div className="relative h-20 w-full overflow-hidden">
      <div className="absolute left-2 top-1 w-48 animate-cloud"><CloudShape className="w-48 opacity-90 drop-shadow" /></div>
      <div className="absolute right-0 top-5 w-40 animate-cloud2"><CloudShape className="w-40 opacity-75" /></div>
      <div className="absolute left-16 bottom-0 w-36 animate-cloud3"><CloudShape className="w-36 opacity-80" /></div>
    </div>
  );
}

function RainyScene() {
  const drops = [
    { left: '10%',  cls: 'animate-rain1' },
    { left: '22%',  cls: 'animate-rain2' },
    { left: '35%',  cls: 'animate-rain3' },
    { left: '50%',  cls: 'animate-rain4' },
    { left: '63%',  cls: 'animate-rain5' },
    { left: '78%',  cls: 'animate-rain1' },
    { left: '88%',  cls: 'animate-rain2' },
    { left: '44%',  cls: 'animate-rain3' },
    { left: '16%',  cls: 'animate-rain5' },
    { left: '70%',  cls: 'animate-rain4' },
  ];
  return (
    <div className="relative h-20 w-full overflow-hidden">
      <div className="absolute top-0 left-0 w-full animate-cloud"><CloudShape className="w-full opacity-80" /></div>
      {drops.map((d, i) => (
        <div key={i} className={`absolute top-6 ${d.cls}`} style={{ left: d.left }}>
          <div className="w-0.5 h-4 bg-blue-300/80 rounded-full" style={{ transform: 'rotate(15deg)' }} />
        </div>
      ))}
    </div>
  );
}

function SnowyScene() {
  const flakes = [
    { left: '8%',   cls: 'animate-snow1', size: 'text-sm' },
    { left: '22%',  cls: 'animate-snow2', size: 'text-base' },
    { left: '38%',  cls: 'animate-snow3', size: 'text-xs' },
    { left: '55%',  cls: 'animate-snow1', size: 'text-base' },
    { left: '68%',  cls: 'animate-snow4', size: 'text-sm' },
    { left: '82%',  cls: 'animate-snow5', size: 'text-xs' },
    { left: '45%',  cls: 'animate-snow2', size: 'text-sm' },
    { left: '15%',  cls: 'animate-snow4', size: 'text-xs' },
    { left: '92%',  cls: 'animate-snow3', size: 'text-base' },
  ];
  return (
    <div className="relative h-20 w-full overflow-hidden flex items-center justify-center">
      <span className="text-5xl animate-float">❄️</span>
      {flakes.map((f, i) => (
        <div key={i} className={`absolute top-0 ${f.cls} ${f.size}`} style={{ left: f.left }}>
          <span>❄</span>
        </div>
      ))}
    </div>
  );
}

function StormyScene() {
  const drops = ['10%','28%','42%','58%','72%','86%','18%','52%','66%','80%'];
  return (
    <div className="relative h-20 w-full overflow-hidden">
      <div className="absolute top-0 left-0 w-full animate-cloud"><CloudShape className="w-full opacity-60" /></div>
      {drops.map((l, i) => (
        <div key={i} className={`absolute top-5 animate-rain${(i % 5) + 1 as 1|2|3|4|5}`} style={{ left: l }}>
          <div className="w-0.5 h-5 bg-blue-200/70 rounded-full" style={{ transform: 'rotate(15deg)' }} />
        </div>
      ))}
      {/* Lightning bolt */}
      <div className="absolute inset-0 flex items-center justify-center animate-lightning">
        <span className="text-yellow-300 text-3xl drop-shadow-lg">⚡</span>
      </div>
    </div>
  );
}

const SCENES: Record<string, () => React.ReactNode> = {
  'sunny':         SunnyScene,
  'partly-cloudy': PartlyCloudyScene,
  'cloudy':        CloudyScene,
  'rainy':         RainyScene,
  'snowy':         SnowyScene,
  'stormy':        StormyScene,
  'night':         SunnyScene, // fallback
};

// ─── Clothing suggestion pills ────────────────────────────────────────────────

const CLOTHING_ICONS: Record<string, string> = {
  'Rain jacket or umbrella ☂️': '☂️',
  'Waterproof shoes 👟':        '👟',
  'Light, breathable clothes ☀️': '👕',
  'Sunscreen SPF 30+':          '🧴',
  'Hat for sun protection 🧢':  '🧢',
  'Hat, scarf & gloves 🧤':    '🧤',
  'Warm coat & snow boots ❄️':  '🧥',
  'Heavy coat & warm layers 🧥':'🧥',
  'Warm hat & gloves 🧤':      '🧤',
  'Light jacket or hoodie 🧥': '🧥',
  'Windproof jacket 💨':        '💨',
  'Comfortable casual clothes 👕': '👕',
  'Stay indoors — storm warning! ⛈️': '⛈️',
};

function getIcon(suggestion: string): string {
  for (const [k, v] of Object.entries(CLOTHING_ICONS)) {
    if (suggestion.startsWith(k.replace(/ [^\s]+$/, '').trim())) return v;
  }
  // extract trailing emoji
  const m = suggestion.match(/[\u{1F300}-\u{1FAFF}]/gu);
  return m?.[0] ?? '👗';
}

// ─── Main WeatherScene component ──────────────────────────────────────────────

type WeatherSceneProps = {
  weather: WeatherData | null;
  mock?: MockWeather | null;
  clothingSuggestions?: string[];
  locationName?: string | null;
  locationCity?: string | null;
  compact?: boolean;
};

export default function WeatherScene({
  weather,
  mock,
  clothingSuggestions,
  locationName,
  locationCity,
  compact = false,
}: WeatherSceneProps) {
  if (!weather && !mock) return null;

  // Derive display values from real weather or mock
  const condition = weather?.condition ?? mock?.label ?? 'Clear sky';
  const emoji = weather?.emoji ?? mock?.emoji ?? '☀️';
  const temp = weather ? `${weather.tempC}°C` : mock ? `${mock.tempF}°F` : '';
  const feelsLike = weather ? `Feels like ${weather.feelsLikeC}°C` : null;
  const highLow = weather ? `↑${weather.highC}° ↓${weather.lowC}°` : null;
  const wind = weather?.windSpeed ? `${weather.windSpeed} km/h` : null;
  const precip = weather?.precipProbability != null ? `${weather.precipProbability}%` : null;
  const uv = weather?.uvIndex != null ? `${weather.uvIndex}` : null;
  const isOutdoor = weather?.isOutdoorFriendly ?? mock?.outdoor ?? true;

  const key = weatherKey(condition);
  const theme = SCENE_THEMES[key] ?? SCENE_THEMES['sunny'];
  const SceneComponent = SCENES[key] ?? SunnyScene;

  if (compact) {
    // Compact version for child picker / parent card
    return (
      <div className={`rounded-2xl bg-gradient-to-br ${theme.gradient} p-4 flex items-center gap-4`}>
        <span className="text-4xl leading-none flex-shrink-0 animate-float">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base leading-tight ${theme.textPrimary}`}>{condition} · {temp}</p>
          {(locationName || locationCity) && (
            <p className={`text-xs mt-0.5 ${theme.textSecondary}`}>
              📍 {locationName}{locationCity ? `, ${locationCity}` : ''}
            </p>
          )}
          <p className={`text-sm mt-1 font-medium ${theme.textSecondary}`}>
            {isOutdoor ? '🌿 Great day to get outside!' : '🏠 Perfect day for indoor adventures!'}
          </p>
        </div>
      </div>
    );
  }

  // Full premium weather scene
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${theme.gradient} overflow-hidden shadow-lift`}>
      {/* Animated weather illustration area */}
      <div className="px-5 pt-5 pb-2">
        <SceneComponent />
      </div>

      {/* Main temperature + condition */}
      <div className="px-5 pb-4">
        <div className="flex items-end gap-3 mb-1">
          <span className={`text-6xl font-black leading-none tracking-tighter ${theme.textPrimary}`}>{temp}</span>
          <div className="pb-1">
            <p className={`text-lg font-bold leading-tight ${theme.textPrimary}`}>{condition}</p>
            {feelsLike && <p className={`text-sm ${theme.textSecondary}`}>{feelsLike}</p>}
          </div>
        </div>

        {/* Location */}
        {(locationName || locationCity) && (
          <p className={`text-sm mb-3 font-medium ${theme.textSecondary}`}>
            📍 {locationName}{locationCity ? `, ${locationCity}` : ''}
          </p>
        )}

        {/* Weather detail pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {highLow && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${theme.pillBg} ${theme.textPrimary}`}>
              🌡️ {highLow}
            </span>
          )}
          {wind && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${theme.pillBg} ${theme.textPrimary}`}>
              💨 {wind}
            </span>
          )}
          {precip && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${theme.pillBg} ${theme.textPrimary}`}>
              🌧️ {precip} rain
            </span>
          )}
          {uv && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm ${theme.pillBg} ${theme.textPrimary}`}>
              ☀️ UV {uv}
            </span>
          )}
        </div>

        {/* Outdoor recommendation */}
        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 ${isOutdoor ? 'bg-green-500/20' : 'bg-white/20'}`}>
          <span className="text-xl">{isOutdoor ? '🌿' : '🏠'}</span>
          <p className={`text-sm font-semibold ${theme.textPrimary}`}>
            {isOutdoor ? 'Great day to get outside! Outdoor missions enabled.' : 'Perfect day for indoor adventures!'}
          </p>
        </div>

        {/* Clothing suggestions */}
        {clothingSuggestions && clothingSuggestions.length > 0 && (
          <div className="mt-4">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${theme.textSecondary}`}>
              Today&apos;s Outfit
            </p>
            <div className="flex flex-wrap gap-2">
              {clothingSuggestions.map((s, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl backdrop-blur-sm ${theme.pillBg} ${theme.textPrimary}`}
                >
                  <span className="text-base leading-none">{getIcon(s)}</span>
                  <span className="text-xs">{s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
