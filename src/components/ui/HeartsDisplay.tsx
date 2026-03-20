interface Props { hearts: number; max?: number; }
export function HeartsDisplay({ hearts, max = 5 }: Props) {
  return (
    <div className="flex gap-1.5 md:gap-2">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`text-2xl md:text-3xl transition-transform duration-200 ${
            i < hearts ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.7)] scale-100' : 'opacity-40 scale-90'
          }`}
          style={i < hearts ? { animation: `pulse 2s ease-in-out ${i * 0.15}s infinite` } : undefined}
        >
          {i < hearts ? '\u2764\uFE0F' : '\uD83D\uDDA4'}
        </span>
      ))}
    </div>
  );
}
