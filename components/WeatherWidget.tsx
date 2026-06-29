'use client';

interface WeatherWidgetProps {
  tempC: number;
  condition: string;
  emoji: string;
  size?: 'sm' | 'lg';
}

function contextNote(condition: string, tempC: number): string {
  const lc = condition.toLowerCase();
  if (lc.includes('snow') || lc.includes('freez') || lc.includes('blizzard')) return 'Snow day — all indoor missions ❄️';
  if (lc.includes('rain') || lc.includes('drizzle') || lc.includes('shower')) return 'Adventure from inside today 🌧️';
  if (lc.includes('overcast') || lc.includes('fog')) return 'Cozy indoor day ahead';
  if (lc.includes('cloud') && !lc.includes('mainly clear') && !lc.includes('partly')) return 'Cozy indoor day ahead';
  if ((lc.includes('sun') || lc.includes('clear') || lc.includes('mainly clear')) && tempC >= 18) return 'Perfect day to go outside! 🌿';
  if ((lc.includes('sun') || lc.includes('clear') || lc.includes('mainly clear')) && tempC < 18) return 'Sunny but cool — mix of indoor and outdoor';
  if ((lc.includes('partly') || lc.includes('mostly') || lc.includes('mainly clear')) && tempC >= 15) return 'Good mix of indoor and outdoor missions';
  return 'Missions ready for today';
}

export default function WeatherWidget({ tempC, condition, emoji, size = 'sm' }: WeatherWidgetProps) {
  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <span className="text-4xl animate-bounce" aria-hidden="true">{emoji}</span>
        <p className="font-black text-navy text-2xl leading-none">{tempC}°C</p>
        <p className="text-sm text-gray-500">{condition}</p>
        <p className="text-xs text-teal-600 font-medium mt-0.5">{contextNote(condition, tempC)}</p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
      <span aria-hidden="true">{emoji}</span>
      <span>{tempC}°C · {condition}</span>
    </span>
  );
}
