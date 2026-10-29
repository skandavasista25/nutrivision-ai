// Recognition is a thin, swappable boundary. Until a model is deployed behind the
// FastAPI service this reports "unavailable", so the UI never shows fabricated predictions.
export type RecognitionResult =
  | { status: "unavailable"; reason: string }
  | { status: "ok"; predictions: { label: string; confidence: number }[] };

const API = import.meta.env.VITE_RECOGNITION_API_URL as string | undefined;

export async function identifyFood(file: File): Promise<RecognitionResult> {
  if (!API) return { status: "unavailable", reason: "No recognition model is connected yet. Pick the food manually." };
  try {
    const body = new FormData(); body.append("file", file);
    const res = await fetch(`${API.replace(/\/$/, "")}/api/recognize`, { method: "POST", body });
    if (res.status === 501) return { status: "unavailable", reason: "The recognition service has no model loaded yet." };
    if (!res.ok) return { status: "unavailable", reason: "The recognition service returned an error." };
    return { status: "ok", predictions: (await res.json()).predictions ?? [] };
  } catch {
    return { status: "unavailable", reason: "Could not reach the recognition service." };
  }
}
