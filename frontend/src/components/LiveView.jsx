import { useEffect, useRef, useState } from "react";
import StatsCard from "./StatsCard.jsx";
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
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(217,119,6,0.10)";
      ctx.fill();
    });
  }, [draft, zone, result]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!streamOn ? (
          <button onClick={startCamera} className="btn btn-primary">
            Start camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="btn btn-ink">
              Stop feed
            </button>
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink-soft">
              <span className="rec-dot" />
              REC 640×480
            </span>
          </>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Alert threshold
          <input
            type="number"
            min="0"
            max="30"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Math.max(0, +e.target.value || 0))}
            className="field w-16"
          />
        </label>

        {zone && (
          <button onClick={() => setZone(null)} className="pill-signal cursor-pointer">
            Clear zone
          </button>
        )}

        {loading && <span className="font-mono text-xs text-ink-soft">detecting…</span>}
      </div>

      {cameraError && (
        <p role="alert" className="mb-4 rounded-lg border border-alert/30 bg-alert-tint px-4 py-3 text-sm text-alert">
          {cameraError}
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-alert/30 bg-alert-tint px-4 py-3 text-sm text-alert">
          {error}
        </p>
      )}

      {streamOn && (
        <div>
          <div className="monitor">
            <div className="sheet p-2">
              <div className="flex justify-center">
                <div className="relative inline-block max-w-full">
                  <video
                    ref={videoRef}
                    className="max-h-[60vh] max-w-full rounded object-contain"
                    muted
                    playsInline
                  />
                  {result && (
                    <img
                      src={annotatedImage(result)}
                      alt="live detections marked in green"
                      className="absolute inset-0 pointer-events-none"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  {!result && (
                    <span className="absolute bottom-2 left-2 rounded bg-ink/75 px-2 py-1 font-mono text-xs text-surface">
                      waiting for first frame…
                    </span>
                  )}
                  <canvas
                    ref={overlayRef}
                    width={640}
                    height={480}
                    className="absolute inset-0 h-full w-full cursor-crosshair"
                    onMouseDown={onZoneDown}
                    onMouseMove={onZoneMove}
                    onMouseUp={onZoneUp}
                    onMouseLeave={onZoneUp}
                  />
                </div>
              </div>
            </div>
          </div>

          {result && (
            <>
              <div className="sheet mt-4 grid grid-cols-3 divide-x divide-line">
                <div className="px-6 py-4">
                  <StatsCard label="People in frame" value={result.count} />
                </div>
                <div className="px-6 py-4">
                  <StatsCard
                    label="Avg confidence"
                    value={result.avg_confidence.toFixed(2)}
                  />
                </div>
                <div className="px-6 py-4">
                  <StatsCard
                    label="Inference"
                    value={`${result.inference_time_ms.toFixed(0)} ms`}
                  />
                </div>
              </div>

              {result.zone_count !== null && (
                <div className="sheet mt-3 grid grid-cols-2 divide-x divide-line">
                  <div className="px-6 py-4">
                    <StatsCard label="Inside zone" value={result.zone_count} />
                  </div>
                  <div className="px-6 py-4">
                    <StatsCard
                      label="Tracked IDs"
                      value={result.detections ? result.detections.filter((d) => d.track_id).length : 0}
                    />
                  </div>
                </div>
              )}

              {result.zone_alert && (
                <div
                  role="alert"
                  className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-signal/40 bg-signal-tint px-4 py-3"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal text-xs font-bold text-surface">
                    !
                  </span>
                  <p className="text-sm font-medium text-signal">
                    {result.zone_count} people inside the restricted zone
                  </p>
                  {alertThreshold > 0 && (
                    <span className="ml-auto font-mono text-xs text-signal/80">
                      threshold {alertThreshold}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}