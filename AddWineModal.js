import { useState } from "react";

const BLANK_INVENTORY = {
  name: "", colour: "red", year: "", winery: "", country: "",
  region: "", grape: "", amount: 1, bestBetween: "",
  occasion: "green", rationale: "", taste_notes: "",
};

const BLANK_WISHLIST = {
  name: "", colour: "red", year: "", winery: "", country: "",
  region: "", grape: "", market_price: "", priority: "medium",
  taste_notes: "", notes: "",
};

export default function AddWineModal({ target, onSave, onClose }) {
  const isWishlist = target === "wishlist";
  const BLANK = isWishlist ? BLANK_WISHLIST : BLANK_INVENTORY;

  const [step, setStep] = useState("search"); // "search" | "form"
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  // ── KI-Weinsuche über Claude API ─────────────────────────────────────────
  async function searchWine() {
    if (!query.trim()) return;
    setSearching(true);
    setSuggestions([]);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Du bist ein Weinexperte. Der Benutzer gibt einen Weinnamen, Weingut oder eine Beschreibung ein.
Antworte NUR mit einem JSON-Array mit 1-3 passenden Weinvorschlägen.
Kein Text davor oder danach, keine Markdown-Backticks.
Format:
[
  {
    "name": "Weinname",
    "winery": "Weingut",
    "year": 2021,
    "colour": "red",
    "grape": "Rebsorte(n)",
    "country": "Land",
    "region": "Region/Appellation",
    "bestBetween": "2024–2032",
    "rationale": "Kurze Beschreibung des Weins (1-2 Sätze)",
    "market_price": "25–35"
  }
]
colour muss "red", "white" oder "rosé" sein.
Falls du den Wein nicht kennst, mache deinen besten Vorschlag basierend auf dem Namen.`,
          messages: [{ role: "user", content: query }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(c => c.type === "text")?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const results = JSON.parse(clean);
      setSuggestions(Array.isArray(results) ? results : []);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    }
    setSearching(false);
  }

  function selectSuggestion(wine) {
    const base = isWishlist
      ? { ...BLANK_WISHLIST, name: wine.name || "", winery: wine.winery || "", year: wine.year || "", colour: wine.colour || "red", grape: wine.grape || "", country: wine.country || "", region: wine.region || "", market_price: wine.market_price || "", notes: wine.rationale || "" }
      : { ...BLANK_INVENTORY, name: wine.name || "", winery: wine.winery || "", year: wine.year || "", colour: wine.colour || "red", grape: wine.grape || "", country: wine.country || "", region: wine.region || "", bestBetween: wine.bestBetween || "", rationale: wine.rationale || "" };
    setForm(base);
    setStep("form");
  }

  function skipToManual() {
    setForm({ ...BLANK, name: query });
    setStep("form");
  }

  async function handleSave() {
    if (!form.name.trim()) { alert("Bitte Weinname eingeben"); return; }
    setSaving(true);
    const payload = { ...form };
    if (!isWishlist) payload.amount = Number(payload.amount) || 1;
    if (payload.year) payload.year = Number(payload.year);
    else delete payload.year;
    await onSave(payload);
    setSaving(false);
  }

  const colourConfig = {
    red:   { label: "Rot",   dot: "#9b2335" },
    white: { label: "Weiss", dot: "#f0dfa0" },
    rosé:  { label: "Rosé",  dot: "#e8a0b0" },
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        {/* Handle + Header */}
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid #1e1208", paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: "#3d2010", borderRadius: 2, margin: "0 auto 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "1.1rem", color: "#c9a87c", letterSpacing: "0.05em" }}>
                {isWishlist ? "Zur Wunschliste" : "Zum Keller hinzufügen"}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "#6b4c2a", marginTop: 2 }}>
                {step === "search" ? "Wein suchen oder manuell eingeben" : "Details überprüfen & anpassen"}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b4c2a", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
          </div>
        </div>

        {/* Step: Search */}
        {step === "search" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 6 }}>
                🔍 Weinname, Weingut oder Beschreibung
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchWine()}
                  placeholder="z.B. Barbaresco Prunotto 2021…"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={searchWine}
                  disabled={searching || !query.trim()}
                  style={{
                    background: "#5c3a1e", border: "1px solid #8a5c30", color: "#e8d9c0",
                    borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                    fontFamily: "'Cinzel', serif", fontSize: "0.75rem", flexShrink: 0,
                    opacity: searching || !query.trim() ? 0.5 : 1,
                  }}
                >
                  {searching ? "…" : "Suchen"}
                </button>
              </div>
            </div>

            {/* AI loading */}
            {searching && (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#8a5c30", fontStyle: "italic", fontSize: "0.9rem" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 8, animation: "spin 1.5s linear infinite" }}>🍷</div>
                KI sucht Weininformationen…
                <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {/* Suggestions */}
            {!searching && suggestions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 10 }}>
                  KI-Vorschläge — tippe zum Auswählen
                </div>
                {suggestions.map((s, i) => {
                  const col = colourConfig[s.colour] || { dot: "#888" };
                  return (
                    <div
                      key={i}
                      className="card"
                      onClick={() => selectSuggestion(s)}
                      style={{ border: "1px solid #3d2010", marginBottom: 8 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: "#e8d9c0", marginBottom: 2 }}>{s.name} {s.year && <span style={{ color: "#c9a87c" }}>{s.year}</span>}</div>
                          <div style={{ fontSize: "0.85rem", color: "#9a7050", marginBottom: 4 }}>{s.winery}</div>
                          <div style={{ fontSize: "0.78rem", color: "#6b4c2a" }}>{s.country}{s.region ? ` · ${s.region}` : ""}</div>
                          {s.grape && <div style={{ fontSize: "0.75rem", color: "#5c3a1e", marginTop: 2 }}>{s.grape}</div>}
                          {s.rationale && <div style={{ fontSize: "0.8rem", color: "#7a5030", fontStyle: "italic", marginTop: 5, lineHeight: 1.4 }}>{s.rationale}</div>}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#8a6040", background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 6, padding: "3px 8px" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot }}></span>
                            {col.label}
                          </span>
                          {s.market_price && (
                            <div style={{ fontSize: "0.75rem", color: "#c9a87c", marginTop: 4 }}>CHF {s.market_price}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {!searching && suggestions.length === 0 && query && (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#6b4c2a", fontSize: "0.85rem" }}>
                Keine Vorschläge gefunden.
              </div>
            )}

            {/* Skip to manual */}
            <button className="btn-ghost" onClick={skipToManual} style={{ marginBottom: 20 }}>
              Manuell eingeben →
            </button>
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && (
          <div style={{ padding: "0 20px" }}>
            <button
              onClick={() => setStep("search")}
              style={{ background: "none", border: "none", color: "#6b4c2a", cursor: "pointer", fontSize: "0.85rem", marginBottom: 14, padding: 0, fontFamily: "'Cormorant Garamond', serif" }}
            >
              ← Zurück zur Suche
            </button>

            <div style={{ display: "grid", gap: 12 }}>
              {/* Name */}
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Weinname" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Weingut</label>
                  <input value={form.winery || ""} onChange={e => setForm(f => ({ ...f, winery: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Jahrgang</label>
                  <input type="number" value={form.year || ""} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2021" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Land</label>
                  <input value={form.country || ""} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Traube</label>
                  <input value={form.grape || ""} onChange={e => setForm(f => ({ ...f, grape: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Region</label>
                <input value={form.region || ""} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Farbe</label>
                <select value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}>
                  <option value="red">Rot</option>
                  <option value="white">Weiss</option>
                  <option value="rosé">Rosé</option>
                </select>
              </div>

              {/* Inventory-only fields */}
              {!isWishlist && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Flaschen</label>
                      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="1" />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Trinkreife</label>
                      <input value={form.bestBetween || ""} onChange={e => setForm(f => ({ ...f, bestBetween: e.target.value }))} placeholder="2025–2032" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Anlass</label>
                    <select value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}>
                      <option value="green">🟢 Alltag</option>
                      <option value="orange">🟠 Speziell</option>
                      <option value="red">🔴 Rar / Festlich</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Notizen</label>
                    <textarea rows={2} value={form.rationale || ""} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Geschmacksnotizen</label>
                    <textarea rows={2} value={form.taste_notes || ""} onChange={e => setForm(f => ({ ...f, taste_notes: e.target.value }))} placeholder="Was hat mich daran begeistert?" />
                  </div>
                </>
              )}

              {/* Wishlist-only fields */}
              {isWishlist && (
                <>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Marktpreis (CHF)</label>
                    <input type="number" value={form.market_price || ""} onChange={e => setForm(f => ({ ...f, market_price: e.target.value }))} placeholder="z.B. 35" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Priorität</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="high">🔴 Dringend kaufen</option>
                      <option value="medium">🟠 Irgendwann</option>
                      <option value="low">🔵 Mal anschauen</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Warum möchte ich diesen Wein?</label>
                    <textarea rows={2} value={form.taste_notes || ""} onChange={e => setForm(f => ({ ...f, taste_notes: e.target.value }))} placeholder="Empfohlen von, Geschmack, Anlass…" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Notizen</label>
                    <textarea rows={2} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: 10, paddingBottom: 20 }}>
                <button className="btn-wine" onClick={handleSave} disabled={saving || !form.name.trim()}>
                  {saving ? "…" : isWishlist ? "Zur Wunschliste" : "Zum Keller hinzufügen"}
                </button>
                <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
