const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function askAI(prompt, context = "trip-planner") {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        context,
      }),
    });

    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { error: rawText };
      }
    }

    if (!response.ok) {
      const error = new Error(data?.error || "Backend AI request failed.");
      error.status = response.status;
      throw error;
    }

    if (!data) {
      throw new Error("AI server returned an empty response.");
    }

    return data?.text || "I could not generate a response right now.";
  } catch (error) {
    console.error("Gemini error:", error);
    const message = String(error?.message || "");

    if (error?.status === 500 && message.toLowerCase().includes("missing")) {
      return "Roamio backend is running but GEMINI_API_KEY is missing in the backend environment.";
    }

    if (error?.status === 403) {
      return "Gemini access is blocked for this key or project. Enable the Generative Language API and verify key permissions.";
    }

    if (error?.status === 429) {
      return "Gemini rate limit reached. Wait a moment and try again.";
    }

    if (message.includes("Failed to fetch")) {
      return "Roamio backend on port 5000 is not reachable. Start the main backend server and try again.";
    }

    return `Roamio AI request failed: ${message || "Unknown Gemini error."}`;
  }
}

export async function getAiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`);
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.error || "AI health check failed.");
      error.status = response.status;
      throw error;
    }
    return { ok: true, ...data };
  } catch (error) {
    return {
      ok: false,
      message: String(error?.message || "AI health check failed."),
    };
  }
}
