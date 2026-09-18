export default function StatsCard({ label, value }) {
  return (
    <div className="flex min-w-28 flex-col gap-1">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="font-mono text-2xl font-medium leading-none tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}