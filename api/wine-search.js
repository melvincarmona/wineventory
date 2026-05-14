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
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Du bist ein Weinexperte. Suche nach Weinen passend zu: "${query}"
        
Antworte NUR mit einem JSON-Array mit 3-5 Weinvorschlägen. Kein Text davor oder danach.
Format:
[
  {
    "name": "Weinname",
    "winery": "Weingut",
    "year": 2020,
    "colour": "red",
    "country": "Italien",
    "region": "Piemont",
    "grape": "Nebbiolo",
    "bestBetween": "2025-2035",
    "falstaff_rating": 95,
    "price": "CHF 45",
    "description": "Kurze Beschreibung des Weins auf Deutsch"
  }
]

Regeln:
- colour muss sein: red, white, rosé oder sparkling
- falstaff_rating: Falstaff Punkte (85-100) falls bekannt, sonst null
- year als Zahl, nicht als String
- Falls kein Jahrgang bekannt, null
- Gib realistische, existierende Weine zurück`
        }
      ]
    });

    const text = message.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const results = JSON.parse(clean);
    res.json({ results });

  } catch (error) {
    console.error("wine-search error:", error.message);
    res.status(500).json({ error: error.message, results: [] });
  }
};