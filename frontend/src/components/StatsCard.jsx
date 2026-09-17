export default function StatsCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow px-4 py-3 min-w-40">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}