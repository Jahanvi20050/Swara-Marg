// ---- Groq API Configuration & LLM Helper Functions ----
const GROQ_API_KEY = ""; // Put your Groq API key here (e.g. "gsk_...")

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

async function callGroqAPI(systemPrompt, userPrompt, apiKey = GROQ_API_KEY) {
  const keyToUse = apiKey || GROQ_API_KEY;
  if (!keyToUse) {
    throw new Error("Groq API key is missing. Please set GROQ_API_KEY in groq.js.");
  }

  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + keyToUse
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 404 || errText.includes("model_not_found")) {
          lastError = new Error(`Groq model ${model} unavailable: ${errText}`);
          continue;
        }
        throw new Error("Groq API error: " + res.status + " — " + errText);
      }

      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (err) {
      if (err.message.includes("Groq API error:")) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq models failed.");
}

async function extractWithGroq(message, apiKey = GROQ_API_KEY) {
  const systemPrompt = `Extract structured info from the user's message about their work skills and location.
Return ONLY valid JSON, no other text, in this exact shape:
{"skills": ["skill1","skill2"], "district": "district name or empty string"}
Use short lowercase skill keywords (e.g. "plumbing", "welding", "electrical", "tailoring", "mechanic", "solar", "repair").`;

  const raw = await callGroqAPI(systemPrompt, message, apiKey);
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// Step-specific extraction helper
async function extractStepInfo(step, userText, lang = "en-IN") {
  if (step === 1) {
    const sysPrompt = `Extract trade/work skills from the user text into lowercase JSON array. Example: {"skills": ["plumbing", "repair"]}`;
    const raw = await callGroqAPI(sysPrompt, userText);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try { return JSON.parse(cleaned); } catch(e) { return { skills: [userText.toLowerCase()] }; }
  } else if (step === 2) {
    const sysPrompt = `Extract the district or block name from the user text into JSON. Example: {"district": "Samastipur"}`;
    const raw = await callGroqAPI(sysPrompt, userText);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try { return JSON.parse(cleaned); } catch(e) { return { district: userText }; }
  } else if (step === 4) {
    const sysPrompt = `Determine if the user is confirming Yes or No to the summary. Return ONLY JSON: {"confirmed": true} or {"confirmed": false}`;
    const raw = await callGroqAPI(sysPrompt, userText);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try { return JSON.parse(cleaned); } catch(e) {
      const isYes = /yes|yeah|sure|correct|सही|हाँ|हा|ठीक/i.test(userText);
      return { confirmed: isYes };
    }
  }
  return {};
}
