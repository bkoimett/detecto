const SAMPLE = "/samples/frame2.jpg";

async function sampleImageB64(name = SAMPLE) {
  const res = await fetch(name);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function mockDetect() {
  const b64 = await sampleImageB64();
  return {
    count: 3,
    detections: [
      { x1: 120, y1: 55, x2: 210, y2: 340, confidence: 0.92 },
      { x1: 300, y1: 60, x2: 390, y2: 345, confidence: 0.88 },
      { x1: 480, y1: 58, x2: 570, y2: 343, confidence: 0.83 },
    ],
    inference_time_ms: 412.5,
    avg_confidence: 0.88,
    annotated_image_b64: b64,
  };
}

let trackCounter = 10;

export async function mockLive(zone, alertThreshold) {
  const b64 = await sampleImageB64();
  const count = 2 + Math.floor(Math.random() * 4);
  const detections = Array.from({ length: count }, (_, i) => ({
    x1: 100 + i * 110 + Math.random() * 40,
    y1: 120 + Math.random() * 80,
    x2: 200 + i * 110 + Math.random() * 40,
    y2: 420 + Math.random() * 60,
    confidence: 0.7 + Math.random() * 0.25,
    track_id: ++trackCounter,
  }));
  let zoneCount = null;
  if (zone) {
    zoneCount = detections.filter((d) => {
      const cx = (d.x1 + d.x2) / 2;
      const cy = (d.y1 + d.y2) / 2;
      return zone[0] <= cx && cx <= zone[2] && zone[1] <= cy && cy <= zone[3];
    }).length;
  }
  return {
    count,
    detections,
    inference_time_ms: 300 + Math.random() * 200,
    avg_confidence: count
      ? detections.reduce((s, d) => s + d.confidence, 0) / count
      : 0,
    annotated_image_b64: b64,
    zone_count: zoneCount,
    zone_alert: Boolean(zoneCount !== null && alertThreshold > 0 && zoneCount >= alertThreshold),
  };
}

function nowOffset(hours, minutes = 0) {
  const d = new Date();
  d.setTime(d.getTime() - hours * 3600000 - minutes * 60000);
  return d.toISOString();
}

const MOCK_HISTORY = [
  { id: 6, timestamp: nowOffset(0, 12), count: 5, avg_confidence: 0.84, inference_time_ms: 398 },
  { id: 5, timestamp: nowOffset(1, 4), count: 3, avg_confidence: 0.9, inference_time_ms: 356 },
  { id: 4, timestamp: nowOffset(2, 41), count: 12, avg_confidence: 0.87, inference_time_ms: 421 },
  { id: 3, timestamp: nowOffset(5, 9), count: 7, avg_confidence: 0.82, inference_time_ms: 404 },
  { id: 2, timestamp: nowOffset(8, 3), count: 2, avg_confidence: 0.93, inference_time_ms: 331 },
  { id: 1, timestamp: nowOffset(20, 15), count: 9, avg_confidence: 0.86, inference_time_ms: 415 },
];

export async function mockHistory(minConfidence) {
  return MOCK_HISTORY.filter((r) => r.avg_confidence >= minConfidence);
}

export async function mockStats() {
  const rows = MOCK_HISTORY;
  const totalPeople = rows.reduce((s, r) => s + r.count, 0);
  const perHour = rows.map((r) => {
    const hour = new Date(r.timestamp);
    hour.setUTCMinutes(0, 0, 0);
    return {
      hour: hour.toISOString(),
      detections: 1,
      people: r.count,
    };
  }).sort((a, b) => a.hour.localeCompare(b.hour));
  return {
    total_detections: rows.length,
    total_people: totalPeople,
    avg_confidence: rows.reduce((s, r) => s + r.avg_confidence, 0) / rows.length,
    avg_inference_time_ms: rows.reduce((s, r) => s + r.inference_time_ms, 0) / rows.length,
    detections_last_hour: 1,
    per_hour: perHour,
    busiest_hour: perHour.reduce((a, b) => (b.people > a.people ? b : a), perHour[0] || null),
  };
}