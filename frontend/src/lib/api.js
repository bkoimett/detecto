import axios from "axios";
import { mockDetect, mockHistory, mockLive, mockStats } from "./mock.js";

export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Set VITE_USE_MOCK=true to demo the full UI without the backend running.
export const useMock = import.meta.env.VITE_USE_MOCK === "true";

export async function detectImage(file) {
  if (useMock) return mockDetect(file);
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post(`${API}/detect`, form);
  return data;
}

export async function liveDetect(blob, { zone, alertThreshold } = {}) {
  if (useMock) return mockLive(zone, alertThreshold);
  const form = new FormData();
  form.append("file", blob, "frame.jpg");
  const params = {};
  if (zone) params.zone = zone.join(",");
  if (alertThreshold > 0) params.alert_threshold = alertThreshold;
  const { data } = await axios.post(`${API}/detect/live`, form, { params });
  return data;
}

export async function getHistory({ minConfidence = 0 } = {}) {
  if (useMock) return mockHistory(minConfidence);
  const { data } = await axios.get(`${API}/history`, {
    params: { min_confidence: minConfidence },
  });
  return data;
}

export async function resetHistory() {
  if (useMock) return;
  await axios.post(`${API}/reset`);
}

export function historyExportUrl(minConfidence = 0) {
  return `${API}/history/export?min_confidence=${minConfidence}`;
}

export async function getStats() {
  if (useMock) return mockStats();
  const { data } = await axios.get(`${API}/stats`);
  return data;
}

export function annotatedImage(data) {
  return `data:image/jpeg;base64,${data.annotated_image_b64}`;
}