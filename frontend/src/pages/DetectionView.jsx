import { useState } from "react";
import axios from "axios";
import StatsCard from "../components/StatsCard.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function DetectionView() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return setError("Please select an image");
    setLoading(true); setError(""); setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const { data } = await axios.post(`${API}/detect`, form);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Detection View</h1>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={e => setFile(e.target.files[0])}
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
            <StatsCard label="Avg confidence" value={result.avg_confidence.toFixed(2)} icon="🎯" />
            <StatsCard label="Inference time" value={`${result.inference_time_ms.toFixed(0)} ms`} icon="⏱" />
          </div>
          <img
            src={`data:image/jpeg;base64,${result.annotated_image_b64}`}
            alt="detected"
            className="rounded shadow border max-w-full"
          />
        </div>
      )}
    </div>
  );
}