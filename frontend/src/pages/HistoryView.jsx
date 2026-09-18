import { useCallback, useEffect, useState } from "react";
import StatsCard from "../components/StatsCard.jsx";
import { getHistory, getStats, historyExportUrl, resetHistory, useMock } from "../lib/api.js";

export default function HistoryView() {
  const [rows, setRows] = useState([]);
  const [minConf, setMinConf] = useState(0);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    const [h, s] = await Promise.all([getHistory({ minConfidence: minConf }), getStats()]);
    setRows(h);
    setStats(s);
  }, [minConf]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, s] = await Promise.all([
          getHistory({ minConfidence: minConf }),
          getStats(),
        ]);
        if (!cancelled) {
          setRows(h);
          setStats(s);
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, [minConf]);

  const handleReset = async () => {
    await resetHistory();
    load();
    setStats(null);
  };

  const maxPeople = stats?.per_hour?.length
    ? Math.max(...stats.per_hour.map((b) => b.people), 1)
    : 1;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        {useMock && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
            Mock data
          </span>
        )}
      </div>

      {stats && (
        <section className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <StatsCard label="Total detections" value={stats.total_detections} icon="🕵️" />
            <StatsCard label="Total people" value={stats.total_people} icon="👥" />
            <StatsCard label="Avg confidence" value={stats.avg_confidence.toFixed(2)} icon="🎯" />
            <StatsCard label="Last hour" value={stats.detections_last_hour} icon="🕐" />
          </div>

          {stats.per_hour.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                People per hour (last 24h)
              </h2>
              <div className="flex items-end gap-2 h-24">
                {stats.per_hour.map((b) => (
                  <div key={b.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${Math.max((b.people / maxPeople) * 100, 2)}%` }}
                      title={`${b.people} people`}
                    />
                    <span className="text-[10px] text-gray-500">
                      {new Date(b.hour).toLocaleTimeString([], { hour: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
              {stats.busiest_hour && (
                <p className="text-xs text-gray-500 mt-2">
                  Busiest: <b>{new Date(stats.busiest_hour.hour).toLocaleString()}</b> ({stats.busiest_hour.people} people)
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <label className="text-sm text-gray-700">
          Min confidence:
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={minConf}
            onChange={(e) => setMinConf(+e.target.value)}
            className="border rounded ml-2 px-2 py-1 w-20"
          />
        </label>
        <a
          href={historyExportUrl(minConf)}
          className="px-3 py-1 bg-blue-600 text-white rounded font-medium cursor-pointer no-underline"
        >
          ⬇ Export CSV
        </a>
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <table className="w-full border bg-white rounded overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Timestamp</th>
            <th className="p-2 text-left">People</th>
            <th className="p-2 text-left">Avg Conf</th>
            <th className="p-2 text-left">Inference (ms)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t even:bg-gray-50">
              <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
              <td className="p-2">{r.count}</td>
              <td className="p-2">{r.avg_confidence.toFixed(2)}</td>
              <td className="p-2">{r.inference_time_ms.toFixed(0)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No detections recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}