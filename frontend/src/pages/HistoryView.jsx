import { useCallback, useEffect, useState } from "react";
import Mark from "../components/Mark.jsx";
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

  const hourLabel = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            History
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Every detection the camera has logged.
          </p>
        </div>
        {useMock && <span className="badge-mock">mock mode</span>}
      </div>

      {stats && (
        <section className="mb-6 space-y-4">
          <div className="sheet grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
            <div className="px-5 py-4">
              <StatsCard label="Total detections" value={stats.total_detections} />
            </div>
            <div className="px-5 py-4">
              <StatsCard label="Total people" value={stats.total_people} />
            </div>
            <div className="px-5 py-4">
              <StatsCard label="Avg confidence" value={stats.avg_confidence.toFixed(2)} />
            </div>
            <div className="px-5 py-4">
              <StatsCard label="Last hour" value={stats.detections_last_hour} />
            </div>
          </div>

          {stats.per_hour.length > 0 && (
            <div className="sheet px-5 py-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-sm font-medium text-ink">
                  People detected per hour
                </h2>
                {stats.busiest_hour && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-ink-soft">Busiest</span>
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {hourLabel(stats.busiest_hour.hour)} ({stats.busiest_hour.people} people)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex h-28 items-end gap-1.5 border-b border-line-strong pb-0">
                {stats.per_hour.map((b) => (
                  <div
                    key={b.hour}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div
                      className="w-full rounded-t bg-vision transition-colors group-hover:bg-vision-deep"
                      style={{ height: `${Math.max((b.people / maxPeople) * 100, 2)}%` }}
                      title={`${b.people} people`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {stats.per_hour.map((b) => (
                  <span
                    key={b.hour}
                    className="flex-1 text-center font-mono text-[10px] tabular-nums text-ink-faint"
                  >
                    {hourLabel(b.hour)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Minimum confidence
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={minConf}
            onChange={(e) => setMinConf(+e.target.value)}
            className="field w-20"
          />
        </label>
        <div className="flex gap-2">
          <a
            href={historyExportUrl(minConf)}
            className="btn btn-outline no-underline"
          >
            Download CSV
          </a>
          <button onClick={handleReset} className="btn btn-danger">
            Reset log
          </button>
        </div>
      </div>

      <div className="sheet overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-paper/70">
              <th className="px-5 py-3 text-left text-xs font-medium text-ink-soft">
                Timestamp
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-ink-soft">
                People
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-ink-soft">
                Avg confidence
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-ink-soft">
                Inference
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line transition-colors first:border-t-0 hover:bg-paper/50">
                <td className="px-5 py-3 font-mono text-sm tabular-nums text-ink">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-ink">
                  {r.count}
                </td>
                <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-ink">
                  {r.avg_confidence.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-ink-soft">
                  {r.inference_time_ms.toFixed(0)} ms
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                    <Mark className="h-10 w-10 opacity-70" />
                    <div>
                      <p className="font-medium text-ink">No detections recorded yet</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        Run a detection on the Detect page and it will show up here.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}