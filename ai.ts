import { API_BASE_URL } from "./backend";

export async function askAI(prompt: string, context = "trip-planner") {
  const response = await fetch(`${API_BASE_URL}/api/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, context }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Roamio AI request failed");
  }

  return String(data?.text || "");
}

export async function getAiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`);
    const data = await response.json();
    return {
      ok: response.ok,
      ...data,
      message: data?.message || "",
    };
  } catch (error) {
    return {
      ok: false,
      message: String(error),
    };
  }
}
