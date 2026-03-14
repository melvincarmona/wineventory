import { useState, useMemo } from "react";

const priorityConfig = {
  high:   { label: "Dringend",      dot: "#fb7185", bg: "rgba(136,19,55,0.3)",  border: "#fb718540" },
  medium: { label: "Irgendwann",    dot: "#fbbf24", bg: "rgba(120,53,15,0.3)",  border: "#fbbf2440" },
  low:    { label: "Mal anschauen", dot: "#60a5fa", bg: "rgba(30,64,175,0.25)", border: "#60a5fa40" },
};

const colourConfig = {
  red:   { label: "Rot",   dot: "#9b2335" },
  white: { label: "Weiss", dot: "#f0dfa0" },
  rosé:  { label: "Rosé",  dot: "#e8a0b0" },
};

function WishCard({ wine, onTap }) {
  const pri = priorityConfig[wine.priority] || priorityConfig.medium;
  const col = colourConfig[wine.colour] || { dot: "#888" };

  return (
    <div className="card" onClick={() => onTap(wine)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "#e8d9c0", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {wine.name}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#9a7050", marginBottom: 6 }}>
            {wine.winery}{wine.year ? ` · ${wine.year}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {wine.colour && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#8a6040" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot }}></span>
                {col.label}
              </span>
            )}
            {wine.market_price && (
              <span style={{ fontSize: "0.75rem", color: "#c9a87c", background: "#2a1208", border: "1px solid #3d2010", borderRadius: 6, padding: "1px 7px" }}>
                CHF {wine.market_price}
              </span>
            )}
          </div>
          {wine.taste_notes && (
            <div style={{ fontSize: "0.8rem", color: "#6b4c2a", fontStyle: "italic", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              "{wine.taste_notes}"
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: pri.bg, color: pri.dot, border: `1px solid ${pri.border}` }}>
            {pri.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function WishDetailSheet({ wine, onClose, onEdit, onDelete, onMoveToInventory }) {
  const pri = priorityConfig[wine.priority] || priorityConfig.medium;
  const col = colourConfig[wine.colour] || { label: "—", dot: "#888" };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moving, setMoving] = useState(false);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid #1e1208", marginBottom: 16, paddingBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: "#3d2010", borderRadius: 2, margin: "0 auto 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.62rem", letterSpacing: "0.15em", color: "#6b4c2a", textTransform: "uppercase", marginBottom: 4 }}>
                Wunschliste
              </div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 600, color: "#e8d9c0", lineHeight: 1.2 }}>{wine.name}</h2>
              {wine.winery && <div style={{ fontSize: "0.9rem", color: "#9a7050", marginTop: 3 }}>{wine.winery}</div>}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b4c2a", fontSize: "1.5rem", cursor: "pointer", padding: "0 0 0 10px" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              ["Farbe", wine.colour ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: col.dot }}></span>{col.label}</span> : "—"],
              ["Jahrgang", wine.year || "—"],
              ["Traube", wine.grape || "—"],
              ["Land", wine.country || "—"],
              ["Marktpreis", wine.market_price ? `CHF ${wine.market_price}` : "—"],
              ["Region", wine.region || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ color: "#c9a87c", fontSize: "0.9rem" }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "5px 14px", borderRadius: 999, background: pri.bg, color: pri.dot, border: `1px solid ${pri.border}` }}>
              Priorität: {pri.label}
            </span>
          </div>

          {wine.taste_notes && (
            <div style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 6 }}>Warum ich diesen Wein möchte</div>
              <p style={{ margin: 0, color: "#9a7050", fontStyle: "italic", lineHeight: 1.5 }}>{wine.taste_notes}</p>
            </div>
          )}

          {wine.notes && (
            <div style={{ background: "#1a1008", border: "1px solid #2d1a08", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "#5c3a1e", textTransform: "uppercase", marginBottom: 6 }}>Notizen</div>
              <p style={{ margin: 0, color: "#9a7050", fontStyle: "italic", lineHeight: 1.5 }}>{wine.notes}</p>
            </div>
          )}

          {/* Move to inventory */}
          <button
            className="btn-wine"
            style={{ marginBottom: 10, background: "#1a3d1a", border: "1px solid #2d6b2d" }}
            disabled={moving}
            onClick={async () => { setMoving(true); await onMoveToInventory(wine); setMoving(false); onClose(); }}
          >
            {moving ? "…" : "✓ Gekauft – ins Inventar verschieben"}
          </button>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
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

function WishEditSheet({ wine, onClose, onSave }) {
  const [form, setForm] = useState({ ...wine });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(wine.id, { ...form, year: Number(form.year) || null });
    setSaving(false);
    onClose();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1e1208", marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: "#3d2010", borderRadius: 2, margin: "0 auto 16px" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "1rem", color: "#c9a87c" }}>Wunsch bearbeiten</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b4c2a", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
          </div>
        </div>
        <div style={{ padding: "0 20px", display: "grid", gap: 12 }}>
          {[["Name","name","text"],["Weingut","winery","text"],["Jahrgang","year","number"],["Land","country","text"],["Traube","grape","text"],["Marktpreis (CHF)","market_price","number"]].map(([label, key, type]) => (
            <div key={key}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>{label}</label>
              <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Farbe</label>
            <select value={form.colour || "red"} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}>
              <option value="red">Rot</option><option value="white">Weiss</option><option value="rosé">Rosé</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Priorität</label>
            <select value={form.priority || "medium"} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="high">🔴 Dringend</option>
              <option value="medium">🟠 Irgendwann</option>
              <option value="low">🔵 Mal anschauen</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Warum ich diesen Wein möchte</label>
            <textarea rows={2} value={form.taste_notes || ""} onChange={e => setForm(f => ({ ...f, taste_notes: e.target.value }))} placeholder="Geschmack, Empfehlung, Anlass…" />
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4 }}>Notizen</label>
            <textarea rows={2} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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

export default function WishlistView({ wishlist, onUpdate, onDelete, onMoveToInventory }) {
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selected, setSelected] = useState(null);
  const [editWine, setEditWine] = useState(null);

  const filtered = useMemo(() => {
    return wishlist.filter(w => {
      if (filterPriority !== "all" && w.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        return [w.name, w.winery, w.grape, w.country].some(f => (f || "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [wishlist, search, filterPriority]);

  return (
    <div>
      {/* Header info */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1208", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.4rem" }}>🛒</span>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", color: "#c9a87c" }}>Wunschliste</div>
          <div style={{ fontSize: "0.78rem", color: "#5c3a1e" }}>{wishlist.length} Weine gespeichert</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ padding: "14px 20px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#5c3a1e" }}>🔍</span>
          <input className="search-input" placeholder="Wein suchen…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ fontSize: "0.85rem", padding: "9px 12px" }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">Alle Prioritäten</option>
          <option value="high">🔴 Dringend</option>
          <option value="medium">🟠 Irgendwann</option>
          <option value="low">🔵 Mal anschauen</option>
        </select>
      </div>

      {/* List */}
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#5c3a1e", fontStyle: "italic" }}>
            {wishlist.length === 0 ? "Noch keine Weine auf der Wunschliste." : "Keine Weine gefunden."}
          </div>
        ) : (
          filtered.map(w => <WishCard key={w.id} wine={w} onTap={setSelected} />)
        )}
      </div>

      {selected && !editWine && (
        <WishDetailSheet
          wine={selected}
          onClose={() => setSelected(null)}
          onEdit={w => { setEditWine(w); setSelected(null); }}
          onDelete={async (id) => { await onDelete(id); setSelected(null); }}
          onMoveToInventory={onMoveToInventory}
        />
      )}
      {editWine && (
        <WishEditSheet
          wine={editWine}
          onClose={() => setEditWine(null)}
          onSave={async (id, data) => { await onUpdate(id, data); setEditWine(null); }}
        />
      )}
    </div>
  );
}
