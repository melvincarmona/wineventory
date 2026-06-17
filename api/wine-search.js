const Anthropic = require("@anthropic-ai/sdk");
const { requireAuth } = require('./_auth');

const MAX_ITERATIONS = 12;

const SYSTEM_PROMPT = `You are a wine expert with access to web search. Search for real, accurate wine information including current Falstaff ratings, awards, and reviews.

Return ONLY a valid JSON array (no markdown, no backticks, no explanation) with 3-5 wine suggestions matching the query. Each object must have exactly these fields:
- name: full wine name (string)
- winery: producer/winery name (string)
- year: vintage year as number, null if NV (number|null)
- colour: one of "red", "white", "rosé", "sparkling" (string)
- country: country of origin (string)
- region: region/appellation (string)
- grape: grape variety or varieties (string)
- bestBetween: drinking window e.g. "2024–2030" (string)
- falstaff_rating: Falstaff score as number, null if not found (number|null)
- price: market price e.g. "CHF 38" or "€ 25" (string)
- description: 1–2 sentence tasting note (string)
- awards: awards, medals, and notable reviews as a single string (string)`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireAuth(req, res)) return;

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages = [
      {
        role: "user",
        content: `Search for wines matching: "${query}". Find real information including Falstaff ratings, awards, and reviews. Return a JSON array as instructed in the system prompt.`
      }
    ];

    let iterations = 0;
    let finalText = null;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn") {
        const textBlocks = response.content.filter(b => b.type === "text");
        if (textBlocks.length > 0) {
          finalText = textBlocks[textBlocks.length - 1].text;
        }
        break;
      }

      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "user", content: "Continue and provide the final JSON array." });
        continue;
      }

      // tool_use or other stop reasons — extract any text we have
      const textBlocks = response.content.filter(b => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks[textBlocks.length - 1].text;
      }
      break;
    }

    if (!finalText) {
      return res.json({ results: [] });
    }

    const clean = finalText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const arrayStart = clean.indexOf("[");
    const arrayEnd = clean.lastIndexOf("]");
    if (arrayStart === -1 || arrayEnd === -1) {
      console.error("No JSON array found in response");
      return res.json({ results: [] });
    }

    let results;
    try {
      results = JSON.parse(clean.substring(arrayStart, arrayEnd + 1));
    } catch (parseError) {
      console.error("Parse error:", parseError.message);
      return res.json({ results: [] });
    }

    if (!Array.isArray(results)) {
      return res.json({ results: [] });
    }

    const sanitized = results.map(w => ({
      name:            w.name            || "",
      winery:          w.winery          || "",
      year:            w.year            || null,
      colour:          w.colour          || "red",
      country:         w.country         || "",
      region:          w.region          || "",
      grape:           w.grape           || "",
      bestBetween:     w.bestBetween     || "",
      falstaff_rating: w.falstaff_rating ? Number(w.falstaff_rating) : null,
      price:           w.price           || "",
      description:     w.description     || "",
      awards:          w.awards          || "",
    }));

    res.json({ results: sanitized });

  } catch (error) {
    console.error("wine-search error:", error.message);
    res.status(500).json({ error: 'Internal server error', results: [] });
  }
};
