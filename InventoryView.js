import { useState, useMemo } from "react";

const occasionConfig = {
  green:  { label: "Alltag",         dot: "#34d399", bg: "rgba(6,78,59,0.35)",   border: "#34d39940" },
  orange: { label: "Speziell",       dot: "#fbbf24", bg: "rgba(120,53,15,0.35)", border: "#fbbf2440" },
  red:    { label: "Rar / Festlich", dot: "#fb7185", bg: "rgba(136,19,55,0.35)", border: "#fb718540" },
};

const colourConfig = {
  red:   { label: "Rot",   dot: "#9b2335" },
  white: { label: "Weiss", dot: "#f0dfa0" },
  rosé:  { label: "Rosé",  dot: "#e8a0b0" },
};

function WineCard({ wine, onTap }) {
  const occ = occasionConfig[wine.occasion] || occasionConfig.green;
  const col = colourConfig[wine.colour] || { dot: "#888" };

  return (
    <div className="card" onClick={() => onTap(wine)} style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "#e8d9c0", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {wine.name}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9a7050", marginBottom: 6 }}>
            {wine.winery}{wine.year ? ` · ${wine.year}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#8a6040" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, display: "inline-block" }}></span>
              {col.label}
            </span>
            {wine.grape && <span style={{ fontSize: "0.75rem", color: "#6b4c2a" }}>· {wine.grape}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: "0.65rem",
            letterSpacing: "0.1em", color: "#c9a87c", fontWeight: 600,
            background: "#2a1208", border: "1px solid #3d2010",
            borderRadius: 8, padding: "3px 10px"
          }}>
            {wine.amount} Fl.
          </span>
          <span style={{
            fontSize: "0.72rem", fontWeight: 600,
            padding: "3px 10px", borderRadius: 999,
            background: occ.bg, color: occ.dot, border: `1px solid ${occ.border}`
          }}>
            {occ.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function WineDetailSheet({ wine, onClose, onEdit, onDelete }) {
  const occ = occasionConfig[wine.occasion] || occasionConfig.green;
  const col = colourConfig[wine.colour] || { label: wine.colour, dot: "#888" };
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div style={{ padding: "20px 20px 0", position: "sticky", top: 0, background: "#140c04", borderBottom: "1px solid #1e1208", marginBottom: 16, paddingBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: "#3d2010", borderRadius: 2, margin: "0 auto 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.62rem", letterSpacing: "0.15em", color: "#6b4c2a", textTransform: "uppercase", marginBottom: 4 }}>
                {wine.country}{wine.region ? ` · ${wine.region}` : ""}
              </div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 600, color: "#e8d9c0", lineHeight: 1.2 }}>{wine.name}</h2>
              <div style={{ fontSize: "0.9rem", color: "#9a7050", marginTop: 3 }}>{wine.winery}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b4c2a", fontSize: "1.5rem", cursor: "pointer", padding: "0 0 0 10px" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          {/* Key facts grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              ["Farbe", <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: col.dot, display: "inline-block" }}></span>{col.label}</span>],
              ["Jahrgang", wine.year || "—"],
              ["Traube", wine.grape || "—"],
              ["Flaschen", wine.amount],
              ["Trinkreife", wine.bestBetween || "—"],
              ["Land", wine.country || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ color: "#c9a87c", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Occasion */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "5px 14px", borderRadius: 999, background: occ.bg, color: occ.dot, border: `1px solid ${occ.border}` }}>
              {occ.label === "Alltag" ? "🟢" : occ.label === "Speziell" ? "🟠" : "🔴"} {occ.label}
            </span>
          </div>

          {/* Notes */}
          {wine.rationale && (
            <div style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 6 }}>Notizen</div>
              <p style={{ margin: 0, color: "#9a7050", fontStyle: "italic", lineHeight: 1.5 }}>{wine.rationale}</p>
            </div>
          )}

          {/* Taste Notes */}
          {wine.taste_notes && (
            <div style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 6 }}>Geschmacksnotizen</div>
              <p style={{ margin: 0, color: "#9a7050", fontStyle: "italic", lineHeight: 1.5 }}>{wine.taste_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn-wine" onClick={() => onEdit(wine)} style={{ flex: 1 }}>Bearbeiten</button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "none", border: "1px solid #3d1010", color: "#8b4040", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "0.75rem", flexShrink: 0 }}>Löschen</button>
            ) : (
              <button onClick={() => onDelete(wine.id)} style={{ background: "#3d1010", border: "1px solid #8b1a1a", color: "#ffb4b4", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "0.75rem", flexShrink: 0 }}>Sicher?</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditSheet({ wine, onClose, onSave }) {
  const [form, setForm] = useState({ ...wine });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(wine.id, { ...form, amount: Number(form.amount), year: Number(form.year) || null });
    setSaving(false);
    onClose();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1e1208", marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: "#3d2010", borderRadius: 2, margin: "0 auto 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "1rem", color: "#c9a87c", letterSpacing: "0.05em" }}>Wein bearbeiten</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b4c2a", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
          </div>
        </div>
        <div style={{ padding: "0 20px", display: "grid", gap: 12 }}>
          {[["Name","name","text"],["Weingut","winery","text"],["Jahrgang","year","number"],["Land","country","text"],["Region","region","text"],["Traube","grape","text"],["Flaschen","amount","number"],["Trinkreife (z.B. 2025–2030)","bestBetween","text"]].map(([label, key, type]) => (
            <div key={key}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>{label}</label>
              <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          {[["Farbe","colour",[["red","Rot"],["white","Weiss"],["rosé","Rosé"]]],["Anlass","occasion",[["green","🟢 Alltag"],["orange","🟠 Speziell"],["red","🔴 Rar / Festlich"]]]].map(([label, key, opts]) => (
            <div key={key}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>{label}</label>
              <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Notizen</label>
            <textarea rows={2} value={form.rationale || ""} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Geschmacksnotizen</label>
            <textarea rows={2} value={form.taste_notes || ""} onChange={e => setForm(f => ({ ...f, taste_notes: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 10 }}>
            <button className="btn-wine" onClick={handleSave} disabled={saving}>{saving ? "…" : "Speichern"}</button>
            <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryView({ wines, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterOccasion, setFilterOccasion] = useState("all");
  const [filterColour, setFilterColour] = useState("all");
  const [selectedWine, setSelectedWine] = useState(null);
  const [editWine, setEditWine] = useState(null);

  const filtered = useMemo(() => {
    return wines.filter(w => {
      if (filterOccasion !== "all" && w.occasion !== filterOccasion) return false;
      if (filterColour !== "all" && w.colour !== filterColour) return false;
      if (search) {
        const q = search.toLowerCase();
        return [w.name, w.winery, w.grape, w.country].some(f => (f || "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [wines, search, filterOccasion, filterColour]);

  const stats = {
    total: wines.reduce((s, w) => s + Number(w.amount || 0), 0),
    red: wines.filter(w => w.colour === "red").length,
    white: wines.filter(w => w.colour === "white").length,
    rosé: wines.filter(w => w.colour === "rosé").length,
  };

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: 0, padding: "14px 20px", borderBottom: "1px solid #1e1208", background: "#0f0a04" }}>
        {[
          ["Flaschen", stats.total, "#c9a87c"],
          ["Rot", stats.red, "#9b2335"],
          ["Weiss", stats.white, "#f0dfa0"],
          ["Rosé", stats.rosé, "#e8a0b0"],
        ].map(([l, v, color]) => (
          <div key={l} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", fontWeight: 600, color, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: "0.62rem", color: "#5c3a1e", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ padding: "14px 20px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#5c3a1e", fontSize: "1rem" }}>🔍</span>
          <input className="search-input" placeholder="Name, Weingut, Traube suchen…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ flex: 1, fontSize: "0.85rem", padding: "9px 12px" }} value={filterOccasion} onChange={e => setFilterOccasion(e.target.value)}>
            <option value="all">Alle Anlässe</option>
            <option value="green">🟢 Alltag</option>
            <option value="orange">🟠 Speziell</option>
            <option value="red">🔴 Rar/Festlich</option>
          </select>
          <select style={{ flex: 1, fontSize: "0.85rem", padding: "9px 12px" }} value={filterColour} onChange={e => setFilterColour(e.target.value)}>
            <option value="all">Alle Farben</option>
            <option value="red">Rot</option>
            <option value="white">Weiss</option>
            <option value="rosé">Rosé</option>
          </select>
        </div>
      </div>

      {/* Wine List */}
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#5c3a1e", fontStyle: "italic" }}>Keine Weine gefunden.</div>
        ) : (
          filtered.map(w => <WineCard key={w.id} wine={w} onTap={setSelectedWine} />)
        )}
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#3d2010", fontStyle: "italic", marginTop: 8, paddingBottom: 20 }}>
          {filtered.length} Weine · {filtered.reduce((s, w) => s + Number(w.amount || 0), 0)} Flaschen
        </div>
      </div>

      {selectedWine && !editWine && (
        <WineDetailSheet
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onEdit={w => { setEditWine(w); setSelectedWine(null); }}
          onDelete={async (id) => { await onDelete(id); setSelectedWine(null); }}
        />
      )}
      {editWine && (
        <EditSheet
          wine={editWine}
          onClose={() => setEditWine(null)}
          onSave={async (id, data) => { await onUpdate(id, data); setEditWine(null); }}
        />
      )}
    </div>
  );
}
