import { useEffect, useRef, useState } from "react";
import { annotatedImage, liveDetect } from "../lib/api.js";

const FRAME_MS = 1500;

export default function LiveView() {
  const videoRef = useRef(null);
  const captureRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);

  const [streamOn, setStreamOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");

  const [alertThreshold, setAlertThreshold] = useState(0);
  const [zone, setZone] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState(null);

  const zoneRef = useRef(zone);
  const thresholdRef = useRef(alertThreshold);
  useEffect(() => { zoneRef.current = zone; }, [zone]);
  useEffect(() => { thresholdRef.current = alertThreshold; }, [alertThreshold]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamOn(true);
    } catch {
      setCameraError("Could not access the webcam. Allow camera access or check permissions.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamOn(false);
  };

  useEffect(() => {
    if (!streamOn) return undefined;
    let cancelled = false;

    const tick = async () => {
      const video = videoRef.current;
      const canvas = captureRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 640, 480);

      canvas.toBlob(async (blob) => {
        if (!blob || cancelled) return;
        setLoading(true);
        try {
          const data = await liveDetect(blob, {
            zone: zoneRef.current,
            alertThreshold: thresholdRef.current,
          });
          if (!cancelled) {
            setResult(data);
            setError("");
          }
        } catch (e) {
          if (!cancelled) setError(e.response?.data?.detail || "Live detection failed");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }, "image/jpeg", 0.9);
    };

    const id = setInterval(tick, FRAME_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [streamOn]);

  useEffect(() => () => stopCamera(), []);

  const zoneFromEvent = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 640,
      y: ((e.clientY - rect.top) / rect.height) * 640,
    };
  };

  const onZoneDown = (e) => {
    setDrawing(true);
    const p = zoneFromEvent(e);
    setDraft([p.x, p.y, p.x, p.y]);
  };

  const onZoneMove = (e) => {
    if (!drawing) return;
    const p = zoneFromEvent(e);
    setDraft((d) => d && [d[0], d[1], p.x, p.y]);
  };

  const onZoneUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (draft) {
      const [x1, y1, x2, y2] = draft;
      const nx1 = Math.min(x1, x2);
      const ny1 = Math.min(y1, y2);
      const nx2 = Math.max(x1, x2);
      const ny2 = Math.max(y1, y2);
      if (nx2 - nx1 > 5 && ny2 - ny1 > 5) setZone([nx1, ny1, nx2, ny2]);
    }
    setDraft(null);
  };

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    [draft, zone].filter(Boolean).forEach((r) => {
      const [x1, y1, x2, y2] = r;
      ctx.beginPath();
      ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,158,11,0.12)";
      ctx.fill();
    });
  }, [draft, zone, result]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {!streamOn ? (
          <button
            onClick={startCamera}
            className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium cursor-pointer"
          >
            🎥 Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-4 py-1.5 bg-gray-700 text-white rounded font-medium cursor-pointer"
          >
            Stop Camera
          </button>
        )}

        <label className="text-sm text-gray-700">
          Alert threshold:
          <input
            type="number"
            min="0"
            max="30"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Math.max(0, +e.target.value || 0))}
            className="border rounded ml-2 px-2 py-1 w-16"
          />
        </label>

        {zone && (
          <button
            onClick={() => setZone(null)}
            className="text-xs px-3 py-1 border border-amber-500 text-amber-600 rounded font-medium"
          >
            Clear zone
          </button>
        )}

        {loading && <span className="text-xs text-gray-500">Detecting…</span>}
      </div>

      {cameraError && <p className="text-red-600 text-sm">{cameraError}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {streamOn && (
        <div className="space-y-3">
          <div className="relative inline-block max-w-full">
            <video
              ref={videoRef}
              className="rounded shadow border max-w-full max-h-[60vh] object-contain"
              muted playsInline
            />
            {result && (
              <img
                src={annotatedImage(result)}
                alt="live detections"
                className="absolute inset-0 pointer-events-none"
                style={{ objectFit: "contain" }}
              />
            )}
            {!result && (
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Waiting for first frame…
              </span>
            )}
            <canvas
              ref={overlayRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={onZoneDown}
              onMouseMove={onZoneMove}
              onMouseUp={onZoneUp}
              onMouseLeave={onZoneUp}
            />
          </div>

          {result && (
            <>
              <div className="flex flex-wrap gap-3">
                <LiveStat label="People" value={result.count} />
                <LiveStat label="Avg conf" value={result.avg_confidence.toFixed(2)} />
                <LiveStat label="Inference" value={`${result.inference_time_ms.toFixed(0)} ms`} />
                {result.zone_count !== null && (
                  <LiveStat label="In zone" value={result.zone_count} />
                )}
              </div>

              {result.zone_alert && (
                <p className="px-4 py-2 bg-red-600 text-white rounded font-semibold">
                  ⚠️ Zone alert — {result.zone_count} people in the restricted zone
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LiveStat({ label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow px-4 py-3 min-w-36">
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}