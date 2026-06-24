// Lightweight inline SVG illustrations — no external deps, no hotlinking.
// All illustrations use the BrytThrive teal/ocean palette.

type IllustrationProps = {
  className?: string;
  'aria-label'?: string;
};

// Shared drop-shadow filter definition
function Defs() {
  return (
    <defs>
      <filter id="shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F766E" floodOpacity="0.12" />
      </filter>
      <filter id="shadow-card" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.10" />
      </filter>
      <filter id="shadow-device" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

// ── FamilyHero ───────────────────────────────────────────────────────────────
export function FamilyHeroIllustration({ className = '', 'aria-label': label = 'A parent and child together' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label={label} role="img">
      <Defs />

      {/* Background */}
      <ellipse cx="180" cy="200" rx="170" ry="75" fill="#F0FDFA" />
      <ellipse cx="180" cy="240" rx="145" ry="18" fill="#CCFBF1" opacity="0.5" />

      {/* Floating dashboard card - left */}
      <rect x="18" y="60" width="108" height="72" rx="14" fill="white" filter="url(#shadow-card)" />
      <rect x="18" y="60" width="108" height="16" rx="14" fill="#0F766E" />
      <rect x="18" y="68" width="108" height="8" fill="#0F766E" />
      <text x="72" y="72" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">Today's Progress</text>
      {/* Mini bar chart */}
      {[{x:32,h:22,c:'#CCFBF1'},{x:46,h:32,c:'#5EEAD4'},{x:60,h:42,c:'#14B8A6'},{x:74,h:36,c:'#0D9488'},{x:88,h:48,c:'#0F766E'},{x:102,h:38,c:'#14B8A6'}].map(({x,h,c},i)=>(
        <rect key={i} x={x} y={96+48-h} width="10" height={h} rx="3" fill={c} />
      ))}
      <line x1="26" y1="124" x2="118" y2="124" stroke="#E2E8F0" strokeWidth="1" />
      <text x="26" y="133" fontSize="6" fill="#94A3B8">Mon</text>
      <text x="102" y="133" fontSize="6" fill="#94A3B8">Today</text>

      {/* Floating mission card - top right */}
      <rect x="238" y="30" width="110" height="52" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="248" y="45" width="42" height="6" rx="3" fill="#14B8A6" />
      <rect x="248" y="55" width="60" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="248" y="63" width="52" height="5" rx="2.5" fill="#E2E8F0" />
      <circle cx="330" cy="56" r="10" fill="#14B8A6" />
      <path d="M325 56 L329 60 L336 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="238" y="30" width="110" height="14" rx="12" fill="#F0FDFA" />
      <rect x="238" y="36" width="110" height="8" fill="#F0FDFA" />
      <text x="248" y="41" fontSize="7" fill="#0F766E" fontWeight="700">✨ Mission Complete</text>

      {/* Coin badge */}
      <circle cx="85" cy="155" r="18" fill="#F59E0B" filter="url(#shadow-sm)" />
      <circle cx="85" cy="155" r="14" fill="#FCD34D" />
      <text x="85" y="160" fontSize="13" textAnchor="middle">🪙</text>
      <text x="85" y="180" fontSize="8" textAnchor="middle" fill="#0F766E" fontWeight="700">+20 coins</text>

      {/* Parent figure */}
      <circle cx="160" cy="120" r="26" fill="#F59E0B" />
      <path d="M134 114 Q142 94 160 91 Q178 94 186 114 Q178 100 160 98 Q142 100 134 114Z" fill="#92400E" />
      <circle cx="152" cy="117" r="3" fill="#1C1917" />
      <circle cx="168" cy="117" r="3" fill="#1C1917" />
      <path d="M152 127 Q160 134 168 127" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="134" y="150" width="52" height="80" rx="26" fill="#0F766E" />
      {/* Arm */}
      <path d="M186 168 Q210 158 216 170" stroke="#0F766E" strokeWidth="14" strokeLinecap="round" fill="none" />

      {/* Child figure */}
      <circle cx="220" cy="170" r="20" fill="#FCD34D" />
      <path d="M200 164 Q207 148 220 146 Q233 148 240 164 Q233 152 220 150 Q207 152 200 164Z" fill="#B45309" />
      <circle cx="213" cy="168" r="2.5" fill="#1C1917" />
      <circle cx="227" cy="168" r="2.5" fill="#1C1917" />
      <path d="M213 177 Q220 183 227 177" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="202" y="194" width="36" height="56" rx="18" fill="#14B8A6" />

      {/* Streak badge top */}
      <rect x="236" y="108" width="62" height="28" rx="10" fill="white" filter="url(#shadow-sm)" />
      <text x="248" y="123" fontSize="14">🔥</text>
      <text x="265" y="120" fontSize="8" fill="#0F766E" fontWeight="700">5-day</text>
      <text x="265" y="130" fontSize="7" fill="#64748B">streak!</text>

      {/* Ground leaves */}
      <path d="M55 218 Q40 195 65 183 Q58 204 55 218Z" fill="#5EEAD4" opacity="0.7" />
      <path d="M50 216 Q72 198 74 183 Q58 204 50 216Z" fill="#14B8A6" opacity="0.5" />
      <path d="M305 213 Q320 190 295 180 Q300 202 305 213Z" fill="#5EEAD4" opacity="0.7" />
    </svg>
  );
}

// ── AppMockup ─────────────────────────────────────────────────────────────────
export function AppMockupIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 420" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="BrytThrive app showing today's missions" role="img">
      <Defs />

      {/* Phone shell with shadow */}
      <rect x="8" y="4" width="224" height="412" rx="34" fill="#1E293B" filter="url(#shadow-device)" />
      <rect x="12" y="8" width="216" height="404" rx="30" fill="#0F172A" />
      {/* Screen */}
      <rect x="16" y="12" width="208" height="396" rx="26" fill="white" />

      {/* Side buttons */}
      <rect x="3" y="100" width="5" height="32" rx="2.5" fill="#334155" />
      <rect x="3" y="140" width="5" height="32" rx="2.5" fill="#334155" />
      <rect x="232" y="110" width="5" height="44" rx="2.5" fill="#334155" />

      {/* Notch */}
      <rect x="88" y="12" width="64" height="22" rx="0" fill="white" />
      <rect x="88" y="12" width="64" height="22" rx="11" fill="#0F172A" />
      <circle cx="120" cy="22" r="5" fill="#1E293B" />
      <circle cx="120" cy="22" r="2.5" fill="#0F172A" />

      {/* Status bar */}
      <text x="26" y="30" fontSize="9" fill="#334155" fontWeight="600">9:41</text>
      <rect x="192" y="22" width="22" height="10" rx="3" fill="none" stroke="#334155" strokeWidth="1.5" />
      <rect x="193.5" y="23.5" width="16" height="7" rx="2" fill="#334155" />
      <rect x="214" y="25" width="3" height="6" rx="1.5" fill="#334155" />

      {/* App header */}
      <rect x="16" y="40" width="208" height="62" fill="#0F766E" />
      <text x="120" y="62" fontSize="12" textAnchor="middle" fill="white" fontWeight="700">Good morning, Mia! 👋</text>
      <text x="120" y="78" fontSize="9" textAnchor="middle" fill="#99F6E4">3 of 5 missions complete</text>
      {/* Progress bar */}
      <rect x="32" y="90" width="176" height="8" rx="4" fill="#CCFBF1" opacity="0.4" />
      <rect x="32" y="90" width="106" height="8" rx="4" fill="#5EEAD4" />
      <circle cx="138" cy="94" r="6" fill="white" stroke="#14B8A6" strokeWidth="2" />

      {/* Coins summary */}
      <rect x="16" y="102" width="208" height="32" fill="#F0FDFA" />
      <text x="32" y="122" fontSize="9" fill="#0F766E" fontWeight="600">🪙 Balance: 140 coins</text>
      <rect x="168" y="108" width="48" height="20" rx="6" fill="#14B8A6" />
      <text x="192" y="121" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">Redeem</text>

      {/* Mission cards */}
      {[
        { y: 144, done: true,  emoji: '🏃', title: 'Move your body', sub: '15 min · 20 coins', cat: '#F0FDFA', border: '#99F6E4' },
        { y: 196, done: true,  emoji: '📚', title: 'Read for 15 min', sub: '15 min · 15 coins', cat: '#F0FDFA', border: '#99F6E4' },
        { y: 248, done: true,  emoji: '💛', title: 'Say one kind thing', sub: '5 min · 10 coins', cat: '#F0FDFA', border: '#99F6E4' },
        { y: 300, done: false, emoji: '🎨', title: 'Draw something', sub: '20 min · 25 coins', cat: 'white', border: '#E2E8F0' },
        { y: 352, done: false, emoji: '👨‍👩‍👧', title: 'Help at home', sub: '10 min · 15 coins', cat: 'white', border: '#E2E8F0' },
      ].map(({ y, done, emoji, title, sub, cat, border }) => (
        <g key={y}>
          <rect x="24" y={y} width="192" height="44" rx="12" fill={cat} stroke={border} strokeWidth="1.5" filter="url(#shadow-sm)" />
          {/* Emoji icon circle */}
          <circle cx="48" cy={y + 22} r="14" fill={done ? '#CCFBF1' : '#F1F5F9'} />
          <text x="48" y={y + 27} fontSize="13" textAnchor="middle">{emoji}</text>
          {/* Text */}
          <text x="70" y={y + 18} fontSize="9" fill={done ? '#0F766E' : '#1E293B'} fontWeight="600">{title}</text>
          <text x="70" y={y + 30} fontSize="8" fill="#94A3B8">{sub}</text>
          {/* Status */}
          {done ? (
            <>
              <circle cx="200" cy={y + 22} r="10" fill="#14B8A6" />
              <path d={`M195 ${y+22} L199 ${y+26} L206 ${y+18}`} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          ) : (
            <circle cx="200" cy={y + 22} r="10" fill="white" stroke="#E2E8F0" strokeWidth="2" />
          )}
        </g>
      ))}
    </svg>
  );
}

// ── StepParent ────────────────────────────────────────────────────────────────
export function StepParentIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Parent setting goals" role="img">
      <Defs />
      {/* Main settings card */}
      <rect x="20" y="14" width="120" height="112" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header bar */}
      <rect x="20" y="14" width="120" height="32" rx="16" fill="#0F766E" />
      <rect x="20" y="30" width="120" height="16" fill="#0F766E" />
      <text x="80" y="34" fontSize="9" fill="white" textAnchor="middle" fontWeight="700">Family Goals</text>
      {/* Goal rows */}
      {[
        { y: 56, label: 'Morning routine', on: true },
        { y: 76, label: 'Screen time limit', on: true },
        { y: 96, label: 'Homework first', on: false },
        { y: 116, label: 'Kindness missions', on: true },
      ].map(({ y, label, on }) => (
        <g key={y}>
          <rect x="32" y={y - 8} width="96" height="18" rx="6" fill={on ? '#F0FDFA' : '#F8FAFC'} />
          <text x="42" y={y + 4} fontSize="8" fill={on ? '#0F766E' : '#94A3B8'} fontWeight={on ? '600' : '400'}>{label}</text>
          {/* Toggle */}
          <rect x="108" y={y - 5} width="18" height="11" rx="5.5" fill={on ? '#14B8A6' : '#E2E8F0'} />
          <circle cx={on ? 120 : 113} cy={y + 0.5} r="4.5" fill="white" />
        </g>
      ))}
      {/* Save button */}
      <rect x="40" y="126" width="80" height="0" rx="8" fill="#14B8A6" />
      {/* Floating checkmark badge */}
      <circle cx="132" cy="22" r="14" fill="#5EEAD4" filter="url(#shadow-sm)" />
      <path d="M126 22 L130 26 L138 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ── StepMissions ──────────────────────────────────────────────────────────────
export function StepMissionsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="AI generating missions" role="img">
      <Defs />
      {/* Card */}
      <rect x="16" y="18" width="128" height="108" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header */}
      <rect x="16" y="18" width="128" height="30" rx="16" fill="#F0FDFA" />
      <rect x="16" y="32" width="128" height="16" fill="#F0FDFA" />
      <circle cx="34" cy="33" r="9" fill="#14B8A6" />
      <text x="34" y="37" fontSize="10" textAnchor="middle">✨</text>
      <text x="80" y="30" fontSize="8" fill="#0F766E" fontWeight="700" textAnchor="middle">AI Mission Generator</text>
      <text x="80" y="42" fontSize="7" fill="#5EEAD4" textAnchor="middle">Personalized for Mia · Age 8</text>
      {/* Mission rows */}
      {[
        { y: 60,  emoji: '🏃', text: 'Move your body 15 min',  coins: 20, color: '#14B8A6' },
        { y: 82,  emoji: '📚', text: 'Read for 15 minutes',    coins: 15, color: '#06B6D4' },
        { y: 104, emoji: '💛', text: 'Say one kind thing',      coins: 10, color: '#5EEAD4' },
      ].map(({ y, emoji, text, coins, color }) => (
        <g key={y}>
          <rect x="26" y={y - 8} width="112" height="18" rx="8" fill="#F8FAFC" />
          <rect x="26" y={y - 8} width="4" height="18" rx="2" fill={color} />
          <text x="38" y={y + 4} fontSize="10" textAnchor="middle">{emoji}</text>
          <text x="50" y={y + 4} fontSize="7.5" fill="#1E293B" fontWeight="500">{text}</text>
          <text x="128" y={y + 4} fontSize="7" fill={color} textAnchor="middle" fontWeight="700">+{coins}</text>
        </g>
      ))}
      {/* Sparkle dots */}
      <circle cx="136" cy="52" r="4" fill="#14B8A6" opacity="0.4" />
      <circle cx="144" cy="66" r="3" fill="#06B6D4" opacity="0.3" />
      <circle cx="138" cy="78" r="2.5" fill="#5EEAD4" opacity="0.4" />
    </svg>
  );
}

// ── StepMoodCheck ─────────────────────────────────────────────────────────────
export function StepMoodCheckIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Child checking in emotionally" role="img">
      <Defs />
      {/* Card */}
      <rect x="14" y="12" width="132" height="116" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header */}
      <rect x="14" y="12" width="132" height="34" rx="16" fill="#FFF7ED" />
      <rect x="14" y="30" width="132" height="16" fill="#FFF7ED" />
      <text x="80" y="29" fontSize="9" fill="#92400E" fontWeight="700" textAnchor="middle">How are you feeling?</text>
      <text x="80" y="41" fontSize="7.5" fill="#B45309" textAnchor="middle">Tap to pick your mood today</text>
      {/* Mood buttons */}
      {[
        { x: 36,  y: 78, emoji: '😊', label: 'Happy',    selected: true,  bg: '#FEF3C7', border: '#F59E0B' },
        { x: 80,  y: 78, emoji: '😴', label: 'Tired',    selected: false, bg: '#F8FAFC', border: '#E2E8F0' },
        { x: 124, y: 78, emoji: '😤', label: 'Grumpy',   selected: false, bg: '#F8FAFC', border: '#E2E8F0' },
      ].map(({ x, y, emoji, label, selected, bg, border }) => (
        <g key={x}>
          <rect x={x - 24} y={y - 30} width="48" height="52" rx="12" fill={bg} stroke={border} strokeWidth={selected ? 2 : 1} />
          {selected && <rect x={x - 24} y={y - 30} width="48" height="52" rx="12" fill="none" stroke={border} strokeWidth="2.5" opacity="0.4" />}
          <text x={x} y={y} fontSize="22" textAnchor="middle">{emoji}</text>
          <text x={x} y={y + 14} fontSize="7" fill={selected ? '#92400E' : '#94A3B8'} textAnchor="middle" fontWeight={selected ? '700' : '400'}>{label}</text>
          {selected && <circle cx={x} cy={y - 24} r="5" fill="#F59E0B" />}
          {selected && <path d={`M${x - 3} ${y - 24} L${x} ${y - 21} L${x + 4} ${y - 27}`} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
        </g>
      ))}
      {/* Continue button */}
      <rect x="30" y="108" width="100" height="14" rx="7" fill="#F59E0B" />
      <text x="80" y="119" fontSize="8" fill="white" textAnchor="middle" fontWeight="700">Start my missions →</text>
    </svg>
  );
}

// ── StepComplete ──────────────────────────────────────────────────────────────
export function StepCompleteIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Child completing missions" role="img">
      <Defs />
      {/* Card */}
      <rect x="14" y="12" width="132" height="116" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header */}
      <rect x="14" y="12" width="132" height="28" rx="16" fill="#F0FDFA" />
      <rect x="14" y="26" width="132" height="14" fill="#F0FDFA" />
      <text x="80" y="30" fontSize="9" fill="#0F766E" fontWeight="700" textAnchor="middle">Today's Missions</text>
      {/* Progress */}
      <rect x="26" y="48" width="108" height="7" rx="3.5" fill="#E2E8F0" />
      <rect x="26" y="48" width="81" height="7" rx="3.5" fill="#14B8A6" />
      <text x="80" y="66" fontSize="7" fill="#64748B" textAnchor="middle">3 of 4 complete · 45 coins earned</text>
      {/* Mission items */}
      {[
        { y: 78,  emoji: '🏃', text: 'Move your body', done: true },
        { y: 96,  emoji: '📚', text: 'Read for 15 min', done: true },
        { y: 114, emoji: '💛', text: 'Say one kind thing', done: true },
      ].map(({ y, emoji, text, done }) => (
        <g key={y}>
          <rect x="24" y={y - 8} width="112" height="18" rx="8" fill="#F0FDFA" stroke="#CCFBF1" strokeWidth="1" />
          <text x="36" y={y + 4} fontSize="11" textAnchor="middle">{emoji}</text>
          <text x="50" y={y + 4} fontSize="8" fill="#0F766E" fontWeight="500" textDecoration={done ? 'line-through' : 'none'}>{text}</text>
          <circle cx="126" cy={y} r="8" fill="#14B8A6" />
          <path d={`M122 ${y} L125 ${y+3} L131 ${y-4}`} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
      {/* Celebration badge */}
      <rect x="88" y="70" width="52" height="22" rx="10" fill="#F59E0B" filter="url(#shadow-sm)" />
      <text x="114" y="85" fontSize="9" fill="white" textAnchor="middle" fontWeight="700">🎉 3 streak!</text>
    </svg>
  );
}

// ── StepCoins ─────────────────────────────────────────────────────────────────
export function StepCoinsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Earning BrytCoins" role="img">
      <Defs />
      {/* Card */}
      <rect x="14" y="12" width="132" height="116" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header */}
      <rect x="14" y="12" width="132" height="28" rx="16" fill="#FFFBEB" />
      <rect x="14" y="26" width="132" height="14" fill="#FFFBEB" />
      <text x="80" y="30" fontSize="9" fill="#92400E" fontWeight="700" textAnchor="middle">🪙 Mia's Wallet</text>
      {/* Big coin balance */}
      <circle cx="80" cy="76" r="32" fill="#F59E0B" filter="url(#shadow-sm)" />
      <circle cx="80" cy="76" r="26" fill="#FCD34D" />
      <circle cx="80" cy="76" r="22" fill="#FBBF24" />
      <text x="80" y="72" fontSize="9" fill="#92400E" textAnchor="middle" fontWeight="700">BRYTS</text>
      <text x="80" y="84" fontSize="16" fill="#92400E" textAnchor="middle" fontWeight="800">140</text>
      {/* Earned this week */}
      <rect x="26" y="116" width="108" height="8" rx="4" fill="#FEF3C7" />
      <text x="80" y="123" fontSize="7.5" fill="#B45309" textAnchor="middle">+45 earned today · Tap to redeem</text>
      {/* Floating coins */}
      {[{x:28,y:54,r:10,op:0.7},{x:132,y:50,r:8,op:0.6},{x:22,y:98,r:7,op:0.5},{x:138,y:95,r:9,op:0.65}].map(({x,y,r,op},i)=>(
        <g key={i} opacity={op}>
          <circle cx={x} cy={y} r={r} fill="#F59E0B" />
          <circle cx={x} cy={y} r={r * 0.75} fill="#FCD34D" />
        </g>
      ))}
    </svg>
  );
}

// ── StepReward ────────────────────────────────────────────────────────────────
export function StepRewardIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Unlocking screen time reward" role="img">
      <Defs />
      {/* Card */}
      <rect x="14" y="12" width="132" height="116" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Device frame */}
      <rect x="30" y="28" width="100" height="68" rx="10" fill="#1E293B" />
      <rect x="34" y="32" width="92" height="56" rx="7" fill="#0EA5E9" opacity="0.15" />
      <rect x="34" y="32" width="92" height="56" rx="7" fill="#0F172A" />
      {/* Screen content */}
      <rect x="38" y="36" width="84" height="48" rx="5" fill="#0F172A" />
      <text x="80" y="56" fontSize="24" textAnchor="middle">🎮</text>
      <text x="80" y="72" fontSize="8" fill="#94A3B8" textAnchor="middle">Roblox unlocked!</text>
      {/* Unlock badge */}
      <circle cx="114" cy="36" r="16" fill="#14B8A6" filter="url(#shadow-sm)" />
      <path d="M108 36 L112 40 L120 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Stand */}
      <rect x="70" y="96" width="20" height="8" rx="2" fill="#334155" />
      <rect x="60" y="102" width="40" height="4" rx="2" fill="#475569" />
      {/* Coins spent label */}
      <rect x="26" y="114" width="108" height="10" rx="5" fill="#F0FDFA" />
      <text x="80" y="122" fontSize="7.5" fill="#0F766E" textAnchor="middle" fontWeight="600">🪙 60 coins redeemed · 60 min earned</text>
    </svg>
  );
}

// ── StepProgress ──────────────────────────────────────────────────────────────
export function StepProgressIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Parent viewing progress dashboard" role="img">
      <Defs />
      {/* Card */}
      <rect x="12" y="10" width="136" height="120" rx="16" fill="white" filter="url(#shadow-card)" />
      {/* Header */}
      <rect x="12" y="10" width="136" height="30" rx="16" fill="#0F766E" />
      <rect x="12" y="26" width="136" height="14" fill="#0F766E" />
      <text x="80" y="29" fontSize="9" fill="white" fontWeight="700" textAnchor="middle">Parent Dashboard</text>
      <text x="80" y="40" fontSize="7" fill="#99F6E4" textAnchor="middle">Week of Jun 16–22</text>
      {/* Stat pills */}
      {[
        { x: 28, label: '🔥 5', sub: 'streak' },
        { x: 80, label: '🪙 340', sub: 'coins' },
        { x: 132, label: '✅ 24', sub: 'missions' },
      ].map(({ x, label, sub }) => (
        <g key={x}>
          <rect x={x - 24} y="50" width="48" height="26" rx="8" fill="#F0FDFA" stroke="#CCFBF1" strokeWidth="1" />
          <text x={x} y="62" fontSize="9" fill="#0F766E" textAnchor="middle" fontWeight="700">{label}</text>
          <text x={x} y="72" fontSize="6.5" fill="#5EEAD4" textAnchor="middle">{sub}</text>
        </g>
      ))}
      {/* Bar chart */}
      <text x="22" y="90" fontSize="6.5" fill="#94A3B8">Daily missions</text>
      {[
        { x: 24, h: 14, c: '#CCFBF1', day: 'M' },
        { x: 42, h: 20, c: '#5EEAD4', day: 'T' },
        { x: 60, h: 18, c: '#14B8A6', day: 'W' },
        { x: 78, h: 24, c: '#0D9488', day: 'T' },
        { x: 96, h: 22, c: '#0F766E', day: 'F' },
        { x: 114, h: 26, c: '#14B8A6', day: 'S' },
        { x: 132, h: 16, c: '#5EEAD4', day: 'S' },
      ].map(({ x, h, c, day }) => (
        <g key={x}>
          <rect x={x - 7} y={122 - h} width="14" height={h} rx="4" fill={c} />
          <text x={x} y="128" fontSize="6" fill="#94A3B8" textAnchor="middle">{day}</text>
        </g>
      ))}
      <line x1="16" y1="122" x2="144" y2="122" stroke="#E2E8F0" strokeWidth="1" />
    </svg>
  );
}

// ── EmptyMissions ─────────────────────────────────────────────────────────────
export function EmptyMissionsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No missions yet" role="img">
      <Defs />
      <rect x="16" y="10" width="88" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="16" y="10" width="88" height="20" rx="12" fill="#F0FDFA" />
      <rect x="16" y="22" width="88" height="8" fill="#F0FDFA" />
      <text x="60" y="24" fontSize="7.5" fill="#0F766E" textAnchor="middle" fontWeight="600">Today's Missions</text>
      {[38, 52, 66].map((y) => (
        <g key={y}>
          <rect x="26" y={y - 7} width="68" height="14" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="26" y={y - 7} width="4" height="14" rx="2" fill="#CCFBF1" />
          <rect x="36" y={y - 3} width="36" height="5" rx="2.5" fill="#E2E8F0" />
        </g>
      ))}
      {/* Sparkle badge */}
      <circle cx="92" cy="18" r="14" fill="#14B8A6" filter="url(#shadow-sm)" />
      <text x="92" y="23" fontSize="14" textAnchor="middle">🎯</text>
    </svg>
  );
}

// ── EmptyChildren ─────────────────────────────────────────────────────────────
export function EmptyChildrenIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No children added yet" role="img">
      <Defs />
      <rect x="16" y="10" width="88" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="16" y="10" width="88" height="20" rx="12" fill="#F0FDFA" />
      <rect x="16" y="22" width="88" height="8" fill="#F0FDFA" />
      <text x="60" y="24" fontSize="7.5" fill="#0F766E" textAnchor="middle" fontWeight="600">My Children</text>
      {/* Existing child avatar */}
      <circle cx="42" cy="54" r="16" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="2" />
      <circle cx="42" cy="49" r="7" fill="#0F766E" />
      <rect x="30" y="59" width="24" height="16" rx="12" fill="#14B8A6" opacity="0.7" />
      {/* Add child slot */}
      <circle cx="82" cy="54" r="16" fill="white" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="82" y1="47" x2="82" y2="61" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="75" y1="54" x2="89" y2="54" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── EmptyRewards ──────────────────────────────────────────────────────────────
export function EmptyRewardsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No rewards set up yet" role="img">
      <Defs />
      <rect x="16" y="10" width="88" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="16" y="10" width="88" height="20" rx="12" fill="#FFFBEB" />
      <rect x="16" y="22" width="88" height="8" fill="#FFFBEB" />
      <text x="60" y="24" fontSize="7.5" fill="#92400E" textAnchor="middle" fontWeight="600">Rewards</text>
      {/* Reward slot */}
      <rect x="26" y="34" width="68" height="36" rx="10" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="60" y="52" fontSize="22" textAnchor="middle">⭐</text>
      <text x="60" y="65" fontSize="7" fill="#B45309" textAnchor="middle">+ Add a reward</text>
      {/* Plus badge */}
      <circle cx="92" cy="18" r="10" fill="#F59E0B" filter="url(#shadow-sm)" />
      <line x1="92" y1="13" x2="92" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="87" y1="18" x2="97" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── EmptyHistory ──────────────────────────────────────────────────────────────
export function EmptyHistoryIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No activity yet" role="img">
      <Defs />
      <rect x="14" y="10" width="92" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="14" y="10" width="92" height="20" rx="12" fill="#F0FDFA" />
      <rect x="14" y="22" width="92" height="8" fill="#F0FDFA" />
      <text x="60" y="24" fontSize="7.5" fill="#0F766E" textAnchor="middle" fontWeight="600">📅 Activity</text>
      {/* Calendar grid */}
      <line x1="22" y1="36" x2="98" y2="36" stroke="#E2E8F0" strokeWidth="1" />
      {['M','T','W','T','F','S','S'].map((d, i) => (
        <text key={i} x={28 + i * 11} y="34" fontSize="5.5" fill="#94A3B8" textAnchor="middle">{d}</text>
      ))}
      {[0,1,2,3].map(row => (
        [0,1,2,3,4,5,6].map(col => {
          const filled = (row === 0 && col < 3) || (row === 1 && col < 5);
          return (
            <rect
              key={`${row}-${col}`}
              x={24 + col * 11}
              y={40 + row * 11}
              width="9"
              height="9"
              rx="2"
              fill={filled ? '#14B8A6' : '#F1F5F9'}
              opacity={filled ? (col < 2 ? 1 : 0.6) : 1}
            />
          );
        })
      ))}
    </svg>
  );
}

// ── EmptyWallet ───────────────────────────────────────────────────────────────
export function EmptyWalletIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No coins earned yet" role="img">
      <Defs />
      <rect x="14" y="10" width="92" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="14" y="10" width="92" height="20" rx="12" fill="#FFFBEB" />
      <rect x="14" y="22" width="92" height="8" fill="#FFFBEB" />
      <text x="60" y="24" fontSize="7.5" fill="#92400E" textAnchor="middle" fontWeight="600">🪙 Wallet</text>
      {/* Big dashed coin */}
      <circle cx="60" cy="54" r="22" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="60" cy="54" r="15" fill="#FDE68A" opacity="0.5" />
      <text x="60" y="59" fontSize="16" textAnchor="middle" opacity="0.5">🪙</text>
      <text x="60" y="74" fontSize="7" fill="#B45309" textAnchor="middle">Complete missions to earn coins</text>
    </svg>
  );
}

// ── EmptyStreaks ──────────────────────────────────────────────────────────────
export function EmptyStreaksIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Start your first streak" role="img">
      <Defs />
      <rect x="14" y="10" width="92" height="70" rx="12" fill="white" filter="url(#shadow-card)" />
      <rect x="14" y="10" width="92" height="20" rx="12" fill="#FFF7ED" />
      <rect x="14" y="22" width="92" height="8" fill="#FFF7ED" />
      <text x="60" y="24" fontSize="7.5" fill="#9A3412" textAnchor="middle" fontWeight="600">🔥 Streaks</text>
      {/* Days row */}
      {['M','T','W','T','F','S','S'].map((d, i) => (
        <g key={i}>
          <circle cx={24 + i * 12} cy="50" r="9" fill={i < 2 ? '#FB923C' : '#FED7AA'} opacity={i < 2 ? 1 : 0.4} />
          <text x={24 + i * 12} y="54" fontSize="8" textAnchor="middle">{i < 2 ? '🔥' : ''}</text>
          <text x={24 + i * 12} y="67" fontSize="5.5" fill={i < 2 ? '#9A3412' : '#94A3B8'} textAnchor="middle">{d}</text>
        </g>
      ))}
      <text x="60" y="79" fontSize="7" fill="#94A3B8" textAnchor="middle">2-day streak — keep going!</text>
    </svg>
  );
}

// ── KidWelcome ────────────────────────────────────────────────────────────────
export function KidWelcomeIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Welcome to Kid Mode" role="img">
      <Defs />

      {/* Background banner */}
      <rect x="10" y="20" width="300" height="72" rx="20" fill="#F0FDFA" filter="url(#shadow-sm)" />

      {/* Stars */}
      <text x="30" y="44" fontSize="16" opacity="0.7">⭐</text>
      <text x="278" y="42" fontSize="12" opacity="0.6">✨</text>
      <text x="20" y="76" fontSize="10" opacity="0.5">✨</text>
      <text x="290" y="74" fontSize="11" opacity="0.5">⭐</text>

      {/* Left child (teal) */}
      <circle cx="70" cy="44" r="18" fill="#FCD34D" />
      <path d="M52 38 Q58 22 70 20 Q82 22 88 38 Q82 28 70 26 Q58 28 52 38Z" fill="#B45309" />
      <circle cx="63" cy="42" r="2.5" fill="#1C1917" />
      <circle cx="77" cy="42" r="2.5" fill="#1C1917" />
      <path d="M63 51 Q70 57 77 51" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="52" y="65" width="36" height="28" rx="18" fill="#14B8A6" />

      {/* Right child (purple) */}
      <circle cx="250" cy="44" r="18" fill="#FCA5A5" />
      <path d="M232 38 Q238 22 250 20 Q262 22 268 38 Q262 28 250 26 Q238 28 232 38Z" fill="#991B1B" />
      <circle cx="243" cy="42" r="2.5" fill="#1C1917" />
      <circle cx="257" cy="42" r="2.5" fill="#1C1917" />
      <path d="M243 51 Q250 57 257 51" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="232" y="65" width="36" height="28" rx="18" fill="#A78BFA" />

      {/* Centre trophy card */}
      <rect x="118" y="24" width="84" height="64" rx="14" fill="white" filter="url(#shadow-card)" />
      <rect x="118" y="24" width="84" height="22" rx="14" fill="#0F766E" />
      <rect x="118" y="36" width="84" height="10" fill="#0F766E" />
      <text x="160" y="38" fontSize="8" fill="white" textAnchor="middle" fontWeight="700">Kid Mode</text>
      <text x="160" y="60" fontSize="28" textAnchor="middle">🏆</text>
      <text x="160" y="81" fontSize="7" fill="#0F766E" textAnchor="middle" fontWeight="600">Who's playing?</text>
    </svg>
  );
}
