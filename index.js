import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import twilio from "twilio";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const primaryModel = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";
const fallbackModels = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"];

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;
const twilioCallFrom = process.env.TWILIO_CALL_FROM_NUMBER || twilioFrom;
const twilioClient = twilioSid && twilioToken ? twilio(twilioSid, twilioToken) : null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function safeJsonError(res, status, payload) {
  if (!res.headersSent) {
    return res.status(status).json(payload);
  }
  return undefined;
}

function getModelCandidates() {
  return [...new Set([primaryModel, ...fallbackModels])];
}

function buildBody(prompt, context) {
  return {
    systemInstruction: {
      parts: [
        {
          text:
            context === "chat"
              ? "You are Roamio AI, a practical travel companion. Give concise travel advice, safety notes, transport tips, and budget-aware suggestions."
              : "You are Roamio AI, a smart trip planner. Build structured travel plans with budget, logistics, safety, food, timing, and local experiences.",
        },
      ],
    },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: context === "chat" ? 0.7 : 0.85,
      topP: 0.9,
      maxOutputTokens: context === "chat" ? 700 : 1200,
    },
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseGeminiResponse(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || "I could not generate a response right now."
  );
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    port,
    hasGeminiKey: Boolean(geminiKey),
    model: primaryModel,
  });
});

app.post("/api/ai", async (req, res) => {
  for (const model of getModelCandidates()) {
    try {
      const { prompt, context = "trip-planner" } = req.body || {};

      if (!prompt || !String(prompt).trim()) {
        return safeJsonError(res, 400, { error: "Prompt is required." });
      }

      if (!geminiKey) {
        return safeJsonError(res, 500, {
          error: "Gemini API key is missing on the backend. Set GEMINI_API_KEY in .env.",
        });
      }

      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(String(prompt).trim(), context)),
        }
      );

      if (!response.ok) {
        const rawErrorText = await response.text();
        let errorPayload = null;
        try {
          errorPayload = rawErrorText ? JSON.parse(rawErrorText) : null;
        } catch {
          errorPayload = { error: { message: rawErrorText || "Gemini request failed." } };
        }

        const error = new Error(errorPayload?.error?.message || "Gemini request failed.");
        error.status = response.status;
        error.model = model;
        throw error;
      }

      const rawSuccessText = await response.text();
      if (!rawSuccessText) {
        const error = new Error("Gemini returned an empty response body.");
        error.status = 502;
        error.model = model;
        throw error;
      }

      let data = null;
      try {
        data = JSON.parse(rawSuccessText);
      } catch {
        const error = new Error(`Gemini returned invalid JSON: ${rawSuccessText.slice(0, 160)}`);
        error.status = 502;
        error.model = model;
        throw error;
      }

      return res.json({
        text: parseGeminiResponse(data),
        model,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return safeJsonError(res, 504, {
          error: "Gemini request timed out. Check your internet connection, API key access, or firewall settings.",
          model,
        });
      }

      const shouldRetry =
        error?.status === 404 ||
        error?.status === 429 ||
        String(error?.message || "").toLowerCase().includes("not found");

      if (!shouldRetry) {
        return safeJsonError(res, error?.status || 500, {
          error: String(error?.message || "Unknown Gemini error."),
          model: error?.model || primaryModel,
        });
      }
    }
  }

  return safeJsonError(res, 500, {
    error: "Gemini request failed after trying fallback models.",
    model: primaryModel,
  });
});

app.post("/api/sos", async (req, res) => {
  const { contacts = [], message = "", call = true } = req.body || {};

  if (!twilioClient || !twilioFrom) {
    return safeJsonError(res, 500, {
      error: "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
    });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return safeJsonError(res, 400, { error: "At least one contact is required." });
  }

  const smsPromises = contacts.map((contact) =>
    twilioClient.messages.create({
      to: contact.phone,
      from: twilioFrom,
      body: message || "Emergency alert from Roamio user.",
    })
  );

  let callPromises = [];
  if (call && twilioCallFrom) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      "This is an emergency alert from Roamio. The user may be in danger. Please check the SMS message for the live location."
    );
    callPromises = contacts.map((contact) =>
      twilioClient.calls.create({
        to: contact.phone,
        from: twilioCallFrom,
        twiml: twiml.toString(),
      })
    );
  }

  try {
    const smsResults = await Promise.allSettled(smsPromises);
    const callResults = await Promise.allSettled(callPromises);
    return res.json({
      ok: true,
      smsSent: smsResults.filter((result) => result.status === "fulfilled").length,
      callsPlaced: callResults.filter((result) => result.status === "fulfilled").length,
    });
  } catch (error) {
    return safeJsonError(res, 500, {
      error: String(error?.message || "SOS request failed."),
    });
  }
});

app.use((error, _req, res, _next) => {
  void _next;
  console.error("Roamio AI server error:", error);
  return safeJsonError(res, error?.status || 500, {
    error: String(error?.message || "Internal server error."),
  });
});

app.listen(port, () => {
  console.log(`Roamio backend listening on http://localhost:${port}`);
});
