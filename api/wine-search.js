const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Du bist ein Weinexperte. Suche nach Weinen passend zu: "${query}". Antworte ausschliesslich mit rohem JSON, ohne Markdown, ohne Backticks, ohne Erklärungen. Nur das JSON-Array.`
        },
        {
          role: "assistant",
          content: "["
        }
      ]
    });

    const raw = "[" + message.content[0].text;
    console.log("Raw response:", raw.substring(0, 200));

    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let results;
    try {
      results = JSON.parse(clean);
    } catch (parseError) {
      console.error("Parse error:", parseError.message);
      console.error("Raw text:", raw.substring(0, 500));
      return res.json({ results: [] });
    }

    if (!Array.isArray(results)) {
      console.error("Not an array:", typeof results);
      return res.json({ results: [] });
    }

    // Sicherstellen dass alle Felder vorhanden sind
    const sanitized = results.map(w => ({
      name:            w.name            || "",
      winery:          w.winery          || "",
      year:            w.year            || null,
      colour:          w.colour          || "red",
      country:         w.country         || "",
      region:          w.region          || "",
      grape:           w.grape           || "",
      bestBetween:     w.bestBetween     || "",
      falstaff_rating: w.falstaff_rating || null,
      price:           w.price           || "",
      description:     w.description     || "",
    }));

    console.log("Results count:", sanitized.length);
    res.json({ results: sanitized });

  } catch (error) {
    console.error("wine-search error:", error.message);
    res.status(500).json({ error: error.message, results: [] });
  }
};