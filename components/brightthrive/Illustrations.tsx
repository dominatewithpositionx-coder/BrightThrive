// Lightweight inline SVG illustrations — no external deps, no hotlinking.
// Each export is a self-contained React component.
// All illustrations use the BrytThrive teal/ocean palette.

type IllustrationProps = {
  className?: string;
  'aria-label'?: string;
};

// ── FamilyHero ───────────────────────────────────────────────────────────────
// Abstract family scene for homepage hero: parent + child, growth leaf motif.
export function FamilyHeroIllustration({ className = '', 'aria-label': label = 'A parent and child together' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 340 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={label}
      role="img"
    >
      {/* Background blob */}
      <ellipse cx="170" cy="150" rx="155" ry="100" fill="#F0FDFA" />

      {/* Ground */}
      <ellipse cx="170" cy="218" rx="130" ry="16" fill="#CCFBF1" />

      {/* Decorative leaves */}
      <path d="M52 180 Q40 155 62 145 Q55 168 52 180Z" fill="#5EEAD4" opacity="0.7" />
      <path d="M48 178 Q68 160 70 145 Q55 168 48 178Z" fill="#14B8A6" opacity="0.5" />
      <path d="M288 175 Q300 150 278 142 Q283 165 288 175Z" fill="#5EEAD4" opacity="0.7" />
      <path d="M292 173 Q272 155 270 142 Q283 165 292 173Z" fill="#14B8A6" opacity="0.5" />

      {/* Stars / sparkles */}
      <circle cx="80" cy="88" r="4" fill="#06B6D4" opacity="0.6" />
      <circle cx="260" cy="78" r="3" fill="#14B8A6" opacity="0.5" />
      <circle cx="290" cy="110" r="2.5" fill="#06B6D4" opacity="0.4" />
      <circle cx="55" cy="115" r="2" fill="#14B8A6" opacity="0.4" />

      {/* Parent figure (taller, left-centre) */}
      {/* Body */}
      <rect x="128" y="128" width="44" height="70" rx="22" fill="#0F766E" />
      {/* Head */}
      <circle cx="150" cy="110" r="22" fill="#F59E0B" />
      {/* Hair */}
      <path d="M128 105 Q135 84 150 82 Q165 84 172 105 Q165 90 150 88 Q135 90 128 105Z" fill="#92400E" />
      {/* Eyes */}
      <circle cx="143" cy="108" r="2.5" fill="#1C1917" />
      <circle cx="157" cy="108" r="2.5" fill="#1C1917" />
      {/* Smile */}
      <path d="M143 116 Q150 122 157 116" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Arm reaching toward child */}
      <path d="M172 145 Q195 140 200 148" stroke="#0F766E" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Child figure (shorter, right) */}
      {/* Body */}
      <rect x="188" y="148" width="36" height="55" rx="18" fill="#14B8A6" />
      {/* Head */}
      <circle cx="206" cy="131" r="17" fill="#FCD34D" />
      {/* Hair */}
      <path d="M189 126 Q194 112 206 110 Q218 112 223 126 Q218 116 206 114 Q194 116 189 126Z" fill="#B45309" />
      {/* Eyes */}
      <circle cx="200" cy="130" r="2" fill="#1C1917" />
      <circle cx="212" cy="130" r="2" fill="#1C1917" />
      {/* Smile */}
      <path d="M200 137 Q206 142 212 137" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Star in child's hand */}
      <text x="218" y="162" fontSize="18" textAnchor="middle">⭐</text>

      {/* Floating coins */}
      <circle cx="96" cy="142" r="12" fill="#F59E0B" opacity="0.9" />
      <text x="96" y="147" fontSize="11" textAnchor="middle" fill="white" fontWeight="bold">🪙</text>

      {/* Mission checkmark badge */}
      <rect x="240" y="128" width="52" height="30" rx="10" fill="white" opacity="0.95" />
      <text x="245" y="148" fontSize="12">✅</text>
      <text x="260" y="148" fontSize="9" fill="#0F766E" fontWeight="bold">Done!</text>
    </svg>
  );
}

// ── AppMockup ─────────────────────────────────────────────────────────────────
// CSS-drawn phone mockup showing a mission card — for homepage hero.
export function AppMockupIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BrytThrive app showing today's missions"
      role="img"
    >
      {/* Phone shell */}
      <rect x="10" y="0" width="200" height="380" rx="28" fill="#1E293B" />
      <rect x="14" y="4" width="192" height="372" rx="24" fill="white" />

      {/* Status bar */}
      <rect x="14" y="4" width="192" height="40" rx="24" fill="#F0FDFA" />
      <circle cx="110" cy="16" r="6" fill="#1E293B" />
      <text x="28" y="30" fontSize="9" fill="#0F766E" fontWeight="600">9:41</text>

      {/* Header */}
      <rect x="14" y="44" width="192" height="52" fill="#0F766E" />
      <text x="110" y="65" fontSize="11" textAnchor="middle" fill="white" fontWeight="700">Good morning, Mia! 👋</text>
      <text x="110" y="82" fontSize="9" textAnchor="middle" fill="#99F6E4">3 of 5 missions done today</text>

      {/* Progress bar */}
      <rect x="28" y="102" width="164" height="6" rx="3" fill="#E2E8F0" />
      <rect x="28" y="102" width="98" height="6" rx="3" fill="#14B8A6" />

      {/* Mission cards */}
      {[
        { y: 120, done: true,  emoji: '🏃', text: 'Move your body 15 min',  cat: 'movement' },
        { y: 168, done: true,  emoji: '📚', text: 'Read for 15 minutes',    cat: 'learning' },
        { y: 216, done: true,  emoji: '💛', text: 'Say one kind thing',      cat: 'kindness' },
        { y: 264, done: false, emoji: '🎨', text: 'Draw something creative', cat: 'creativity' },
        { y: 312, done: false, emoji: '👨‍👩‍👧', text: 'Help with a family task', cat: 'family' },
      ].map(({ y, done, emoji, text }) => (
        <g key={y}>
          <rect x="20" y={y} width="180" height="40" rx="10" fill={done ? '#F0FDFA' : 'white'} stroke={done ? '#99F6E4' : '#E2E8F0'} strokeWidth="1" />
          <text x="36" y={y + 25} fontSize="14" textAnchor="middle">{emoji}</text>
          <text x="55" y={y + 22} fontSize="8.5" fill={done ? '#0F766E' : '#334155'} fontWeight={done ? '600' : '400'}>{text}</text>
          {done && (
            <circle cx="188" cy={y + 20} r="8" fill="#14B8A6">
              <title>Completed</title>
            </circle>
          )}
          {done && <text x="188" y={y + 24} fontSize="9" textAnchor="middle" fill="white">✓</text>}
        </g>
      ))}
    </svg>
  );
}

// ── StepParent ────────────────────────────────────────────────────────────────
export function StepParentIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Parent setting goals" role="img">
      <circle cx="50" cy="50" r="48" fill="#F0FDFA" />
      <circle cx="50" cy="36" r="14" fill="#0F766E" />
      <rect x="28" y="55" width="44" height="34" rx="22" fill="#0F766E" opacity="0.85" />
      <rect x="62" y="38" width="26" height="32" rx="6" fill="white" stroke="#14B8A6" strokeWidth="1.5" />
      <line x1="66" y1="46" x2="84" y2="46" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="51" x2="80" y2="51" stroke="#CCFBF1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="56" x2="82" y2="56" stroke="#CCFBF1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="66" cy="62" r="3" fill="#14B8A6" />
      <text x="71" y="65" fontSize="7" fill="#0F766E" fontWeight="600">Set!</text>
    </svg>
  );
}

// ── StepMissions ──────────────────────────────────────────────────────────────
export function StepMissionsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="AI generating missions" role="img">
      <circle cx="50" cy="50" r="48" fill="#ECFDF5" />
      <rect x="22" y="28" width="56" height="52" rx="8" fill="white" stroke="#14B8A6" strokeWidth="1.5" />
      {[38, 50, 62].map((y, i) => (
        <g key={y}>
          <rect x="30" y={y} width="40" height="7" rx="3.5" fill={i === 0 ? '#14B8A6' : '#CCFBF1'} />
          {i === 0 && <text x="50" y={y + 5.5} fontSize="5" textAnchor="middle" fill="white" fontWeight="700">✨ AI Mission</text>}
        </g>
      ))}
      <circle cx="72" cy="30" r="12" fill="#0F766E" />
      <text x="72" y="34" fontSize="14" textAnchor="middle">✨</text>
    </svg>
  );
}

// ── StepMoodCheck ─────────────────────────────────────────────────────────────
export function StepMoodCheckIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Child checking in emotionally" role="img">
      <circle cx="50" cy="50" r="48" fill="#FFF7ED" />
      <circle cx="50" cy="34" r="16" fill="#FCD34D" />
      <circle cx="43" cy="32" r="2.5" fill="#1C1917" />
      <circle cx="57" cy="32" r="2.5" fill="#1C1917" />
      <path d="M43 40 Q50 47 57 40" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
      <text x="28" y="75" fontSize="18" textAnchor="middle">😊</text>
      <text x="50" y="75" fontSize="18" textAnchor="middle">😴</text>
      <text x="72" y="75" fontSize="18" textAnchor="middle">😤</text>
      <circle cx="28" cy="60" r="10" fill="#FDE68A" opacity="0.4" />
      <circle cx="28" cy="60" r="10" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
}

// ── StepComplete ──────────────────────────────────────────────────────────────
export function StepCompleteIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Child completing missions" role="img">
      <circle cx="50" cy="50" r="48" fill="#F0FDFA" />
      {/* Child running */}
      <circle cx="50" cy="28" r="10" fill="#FCD34D" />
      <rect x="42" y="42" width="16" height="22" rx="8" fill="#14B8A6" />
      {/* Checkmarks */}
      <circle cx="75" cy="38" r="10" fill="#0F766E" />
      <path d="M70 38 L74 42 L81 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="75" cy="62" r="10" fill="#0F766E" />
      <path d="M70 62 L74 66 L81 58" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="25" cy="50" r="10" fill="#CCFBF1" stroke="#14B8A6" strokeWidth="1.5" />
      <text x="25" y="55" fontSize="12" textAnchor="middle">🏃</text>
    </svg>
  );
}

// ── StepCoins ─────────────────────────────────────────────────────────────────
export function StepCoinsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Earning BrytCoins" role="img">
      <circle cx="50" cy="50" r="48" fill="#FFFBEB" />
      <circle cx="50" cy="50" r="28" fill="#F59E0B" />
      <circle cx="50" cy="50" r="22" fill="#FCD34D" />
      <text x="50" y="57" fontSize="22" textAnchor="middle">🪙</text>
      {[
        { cx: 18, cy: 30 }, { cx: 82, cy: 30 },
        { cx: 18, cy: 70 }, { cx: 82, cy: 70 },
        { cx: 50, cy: 15 },
      ].map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#F59E0B" opacity="0.5" />
      ))}
    </svg>
  );
}

// ── StepReward ────────────────────────────────────────────────────────────────
export function StepRewardIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Unlocking screen time reward" role="img">
      <circle cx="50" cy="50" r="48" fill="#EFF6FF" />
      <rect x="28" y="32" width="44" height="30" rx="6" fill="#1E293B" />
      <rect x="32" y="36" width="36" height="22" rx="3" fill="#06B6D4" opacity="0.8" />
      <rect x="44" y="62" width="12" height="8" rx="2" fill="#1E293B" />
      <rect x="38" y="68" width="24" height="4" rx="2" fill="#94A3B8" />
      {/* Unlock badge */}
      <circle cx="72" cy="30" r="14" fill="#14B8A6" />
      <path d="M66 30 L70 34 L78 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="38" y="52" fontSize="14" textAnchor="middle">🎮</text>
    </svg>
  );
}

// ── StepProgress ──────────────────────────────────────────────────────────────
export function StepProgressIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Parent viewing progress dashboard" role="img">
      <circle cx="50" cy="50" r="48" fill="#F0FDFA" />
      <rect x="18" y="25" width="64" height="52" rx="8" fill="white" stroke="#14B8A6" strokeWidth="1.5" />
      {/* Chart bars */}
      <rect x="26" y="62" width="8" height="10" rx="2" fill="#CCFBF1" />
      <rect x="37" y="54" width="8" height="18" rx="2" fill="#5EEAD4" />
      <rect x="48" y="46" width="8" height="26" rx="2" fill="#14B8A6" />
      <rect x="59" y="50" width="8" height="22" rx="2" fill="#0F766E" />
      <line x1="24" y1="72" x2="70" y2="72" stroke="#E2E8F0" strokeWidth="1" />
      {/* Trophy */}
      <circle cx="68" cy="32" r="10" fill="#F59E0B" />
      <text x="68" y="36" fontSize="12" textAnchor="middle">🏆</text>
    </svg>
  );
}

// ── EmptyMissions ─────────────────────────────────────────────────────────────
export function EmptyMissionsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No missions yet" role="img">
      <circle cx="60" cy="42" r="36" fill="#F0FDFA" />
      <rect x="36" y="26" width="48" height="38" rx="7" fill="white" stroke="#99F6E4" strokeWidth="1.5" />
      <line x1="44" y1="38" x2="76" y2="38" stroke="#CCFBF1" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="46" x2="70" y2="46" stroke="#CCFBF1" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="54" x2="72" y2="54" stroke="#CCFBF1" strokeWidth="2" strokeLinecap="round" />
      <circle cx="88" cy="22" r="14" fill="#14B8A6" />
      <text x="88" y="27" fontSize="16" textAnchor="middle">🎯</text>
    </svg>
  );
}

// ── EmptyChildren ─────────────────────────────────────────────────────────────
export function EmptyChildrenIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No children added yet" role="img">
      <circle cx="60" cy="42" r="36" fill="#F0FDFA" />
      {/* Parent */}
      <circle cx="46" cy="30" r="10" fill="#0F766E" />
      <rect x="34" y="45" width="24" height="22" rx="12" fill="#0F766E" opacity="0.8" />
      {/* Child placeholder with + */}
      <circle cx="74" cy="34" r="14" fill="white" stroke="#14B8A6" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="74" y1="27" x2="74" y2="41" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="67" y1="34" x2="81" y2="34" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── EmptyRewards ──────────────────────────────────────────────────────────────
export function EmptyRewardsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No rewards set up yet" role="img">
      <circle cx="60" cy="42" r="36" fill="#FFFBEB" />
      <circle cx="60" cy="42" r="22" fill="#FDE68A" opacity="0.5" />
      <text x="60" y="50" fontSize="28" textAnchor="middle">⭐</text>
      <circle cx="88" cy="22" r="10" fill="white" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="88" y1="17" x2="88" y2="27" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <line x1="83" y1="22" x2="93" y2="22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── EmptyHistory ──────────────────────────────────────────────────────────────
export function EmptyHistoryIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No activity yet" role="img">
      <circle cx="60" cy="42" r="36" fill="#F0FDFA" />
      <rect x="36" y="24" width="48" height="44" rx="7" fill="white" stroke="#99F6E4" strokeWidth="1.5" />
      {/* Calendar grid */}
      <line x1="36" y1="34" x2="84" y2="34" stroke="#CCFBF1" strokeWidth="1" />
      {[44, 52, 60].map((y) =>
        [42, 52, 62, 72].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="8" height="6" rx="1.5" fill="#F0FDFA" />
        ))
      )}
      <rect x="42" y="44" width="8" height="6" rx="1.5" fill="#14B8A6" opacity="0.6" />
      <rect x="52" y="52" width="8" height="6" rx="1.5" fill="#14B8A6" opacity="0.8" />
      <text x="42" y="33" fontSize="7" fill="#94A3B8">📅</text>
    </svg>
  );
}

// ── EmptyWallet ───────────────────────────────────────────────────────────────
export function EmptyWalletIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="No coins earned yet" role="img">
      <circle cx="60" cy="42" r="36" fill="#FFFBEB" />
      <rect x="30" y="32" width="60" height="36" rx="8" fill="white" stroke="#FDE68A" strokeWidth="1.5" />
      <circle cx="60" cy="50" r="12" fill="#FDE68A" opacity="0.5" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="60" y="55" fontSize="14" textAnchor="middle" opacity="0.4">🪙</text>
    </svg>
  );
}

// ── EmptyStreaks ──────────────────────────────────────────────────────────────
export function EmptyStreaksIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Start your first streak" role="img">
      <circle cx="60" cy="42" r="36" fill="#FFF7ED" />
      <text x="60" y="58" fontSize="40" textAnchor="middle" opacity="0.25">🔥</text>
      <circle cx="60" cy="42" r="18" fill="#FED7AA" opacity="0.4" stroke="#FB923C" strokeWidth="1.5" strokeDasharray="4 2" />
    </svg>
  );
}

// ── KidWelcome ────────────────────────────────────────────────────────────────
// Friendly greeting illustration for the Kid Mode profile picker header.
export function KidWelcomeIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 280 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Welcome to Kid Mode" role="img">
      {/* Stars */}
      <text x="20" y="40" fontSize="18" opacity="0.7">⭐</text>
      <text x="240" y="38" fontSize="14" opacity="0.6">✨</text>
      <text x="12" y="72" fontSize="10" opacity="0.5">✨</text>
      <text x="258" y="68" fontSize="12" opacity="0.5">⭐</text>

      {/* Left child figure */}
      <circle cx="72" cy="36" r="18" fill="#FCD34D" />
      <path d="M54 32 Q60 16 72 14 Q84 16 90 32 Q84 22 72 20 Q60 22 54 32Z" fill="#B45309" />
      <circle cx="65" cy="34" r="2.5" fill="#1C1917" />
      <circle cx="79" cy="34" r="2.5" fill="#1C1917" />
      <path d="M65 43 Q72 49 79 43" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="54" y="58" width="36" height="30" rx="18" fill="#14B8A6" />

      {/* Right child figure */}
      <circle cx="208" cy="36" r="18" fill="#FCA5A5" />
      <path d="M190 30 Q196 14 208 12 Q220 14 226 30" fill="#991B1B" />
      <circle cx="201" cy="34" r="2.5" fill="#1C1917" />
      <circle cx="215" cy="34" r="2.5" fill="#1C1917" />
      <path d="M201 43 Q208 49 215 43" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="190" y="58" width="36" height="30" rx="18" fill="#A78BFA" />

      {/* Centre trophy */}
      <circle cx="140" cy="42" r="28" fill="#F0FDFA" />
      <text x="140" y="54" fontSize="32" textAnchor="middle">🏆</text>
    </svg>
  );
}
