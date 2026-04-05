import { useState } from "react";
import { askAI } from "../services/aiService";

function AIPlanner({ defaultPrompt = "", title = "AI Trip Planner" }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    if (!prompt.trim()) return;
    setLoading(true);
    const result = await askAI(
      `Create a practical itinerary for: ${prompt}. Include budget advice, transport, stay suggestions, safety notes, local food, and a 3-day structure.`
    );
    setResponse(result);
    setLoading(false);
  }

  return (
    <section className="panel ai-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Roamio AI</p>
          <h3>{title}</h3>
          <p className="panel-subcopy">
            Build calm, practical itineraries with timing, transport, food, and budget guidance.
          </p>
        </div>
        <div className="planner-chip-row">
          <span className="tag-pill">Itinerary</span>
          <span className="tag-pill">Budget</span>
          <span className="tag-pill">Local tips</span>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Example: 4-day Jaipur trip for two friends with a mid-range budget, markets, food, and one heritage hotel."
      />

      <div className="panel-actions">
        <button onClick={generatePlan}>{loading ? "Planning..." : "Generate plan"}</button>
      </div>

      {response && (
        <div className="ai-response-card">
          <pre className="ai-output">{response}</pre>
        </div>
      )}
    </section>
  );
}

export default AIPlanner;
