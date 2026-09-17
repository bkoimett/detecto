import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function HistoryView() {
  const [rows, setRows] = useState([]);
  const [minConf, setMinConf] = useState(0);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/history`, {
        params: { min_confidence: minConf },
      });
      setRows(data);
    } catch {
      // ignore fetch errors
    }
  }, [minConf]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/history`, { params: { min_confidence: minConf } })
      .then(({ data }) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [minConf]);

  const reset = async () => {
    await axios.post(`${API}/reset`);
    fetchHistory();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">History</h1>

      <div className="flex gap-3 mb-4 items-center">
        <label className="text-sm text-gray-700">
          Min confidence:
          <input type="number" step="0.05" min="0" max="1"
                 value={minConf}
                 onChange={e => setMinConf(+e.target.value)}
                 className="border rounded ml-2 px-2 py-1 w-20" />
        </label>
        <button onClick={reset}
                className="px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 cursor-pointer">
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
          {rows.map(r => (
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