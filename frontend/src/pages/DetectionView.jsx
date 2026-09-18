import { useState } from "react";
import StatsCard from "../components/StatsCard.jsx";
import LiveView from "../components/LiveView.jsx";
import { annotatedImage, detectImage, useMock } from "../lib/api.js";

const tabs = [
  { id: "image", label: "🖼 Image" },
  { id: "live", label: "🎥 Live" },
];

export default function DetectionView() {
  const [tab, setTab] = useState("image");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await detectImage(file);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Detection View</h1>
        {useMock && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
            Mock data
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t font-medium cursor-pointer ${
              tab === t.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "image" && (
        <div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Detecting..." : "Detect"}
            </button>
          </div>

          {file && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: <b>{file.name}</b>
            </p>
          )}

          {error && <p className="text-red-600 mt-2">{error}</p>}

          {result && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-4 mb-3">
                <StatsCard label="People detected" value={result.count} icon="👥" />
                <StatsCard
                  label="Avg confidence"
                  value={result.avg_confidence.toFixed(2)}
                  icon="🎯"
                />
                <StatsCard
                  label="Inference time"
                  value={`${result.inference_time_ms.toFixed(0)} ms`}
                  icon="⏱"
                />
              </div>
              <img
                src={annotatedImage(result)}
                alt="detected"
                className="rounded shadow border max-w-full"
              />
            </div>
          )}
        </div>
      )}

      {tab === "live" && <LiveView />}
    </div>
  );
}