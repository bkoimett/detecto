import { useEffect, useRef, useState } from "react";
import LiveView from "../components/LiveView.jsx";
import Mark from "../components/Mark.jsx";
import StatsCard from "../components/StatsCard.jsx";
import { annotatedImage, detectImage, useMock } from "../lib/api.js";

const tabs = [
  { id: "image", label: "Photo" },
  { id: "live", label: "Live" },
];

export default function DetectionView() {
  const [tab, setTab] = useState("image");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pickFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setResult(null);
    setError("");
  };

  const resetFlow = () => {
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Detect people
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-ink-soft">
            Upload a photo or start the live camera. Every person found is
            counted and logged to history.
          </p>
        </div>
        {useMock && <span className="badge-mock">mock mode</span>}
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-ink text-surface"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-alert/30 bg-alert-tint px-4 py-3 text-sm text-alert"
        >
          {error}
        </p>
      )}

      {tab === "image" && (
        <div>
          <div className={`monitor ${loading ? "opacity-90" : ""}`}>
            <div className="sheet overflow-hidden p-2">
              {!file && (
                <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
                  <Mark className="h-12 w-12" />
                  <div>
                    <p className="font-medium text-ink">No image to scan yet</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Pick a JPEG or PNG and run detection on it.
                    </p>
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="btn btn-primary"
                  >
                    Choose a photo
                  </button>
                </div>
              )}

              {file && !result && (
                <div className="flex flex-col">
                  <img
                    src={previewUrl}
                    alt="selected preview"
                    className="max-h-[60vh] w-full object-contain"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line px-1 pt-4 pb-1">
                    <span className="truncate font-mono text-xs text-ink-soft">
                      {file.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? "Scanning…" : "Detect people"}
                      </button>
                      <button onClick={resetFlow} className="btn btn-outline">
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="flex flex-col">
                  <img
                    src={annotatedImage(result)}
                    alt="detections marked in green"
                    className="max-h-[62vh] w-full object-contain"
                  />
                  {result.count === 0 ? (
                    <p className="mt-3 border-t border-line px-1 pt-4 pb-1 text-sm text-ink-soft">
                      No people found in this photo.
                    </p>
                  ) : (
                    <p className="mt-3 border-t border-line px-1 pt-4 pb-1 text-sm text-ink-soft">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-vision" />
                      {result.count} {result.count === 1 ? "person" : "people"} detected and logged
                    </p>
                  )}
                </div>
              )}
            </div>
            {loading && <div className="scanline" />}
          </div>

          {result && (
            <>
              <div className="sheet mt-4 grid grid-cols-3 divide-x divide-line">
                <div className="px-6 py-4">
                  <StatsCard label="People found" value={result.count} />
                </div>
                <div className="px-6 py-4">
                  <StatsCard
                    label="Average confidence"
                    value={result.avg_confidence.toFixed(2)}
                  />
                </div>
                <div className="px-6 py-4">
                  <StatsCard
                    label="Inference time"
                    value={`${result.inference_time_ms.toFixed(0)} ms`}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={resetFlow} className="btn btn-outline">
                  Scan another photo
                </button>
              </div>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickFile}
          />
        </div>
      )}

      {tab === "live" && <LiveView />}
    </div>
  );
}