import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

const occasionConfig = {
  green:  { label: "Alltag",         emoji: "🟢", bg: "bg-emerald-900/40", text: "text-emerald-300", border: "border-emerald-700/60", dot: "#34d399" },
  orange: { label: "Speziell",       emoji: "🟠", bg: "bg-amber-900/40",   text: "text-amber-300",   border: "border-amber-700/60",   dot: "#fbbf24" },
  red:    { label: "Rar / Festlich", emoji: "🔴", bg: "bg-rose-900/40",    text: "text-rose-300",    border: "border-rose-700/60",    dot: "#fb7185" },
};

const colourConfig = {
  red:   { label: "Rot",   dot: "#8b1a1a" },
  white: { label: "Weiss", dot: "#f5e6c3" },
  rosé:  { label: "Rosé",  dot: "#f4a4b5" },
};

function OccasionBadge({ occasion }) {
  const cfg = occasionConfig[occasion];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
      background: occasion === "green" ? "rgba(6,78,59,0.4)" : occasion === "orange" ? "rgba(120,53,15,0.4)" : "rgba(136,19,55,0.4)",
      color: cfg.dot, border: `1px solid ${cfg.dot}40`, whiteSpace: "nowrap"
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }}></span>
      {cfg.label}
    </span>
  );
}

function ColourDot({ colour }) {
  const cfg = colourConfig[colour] || { label: colour, dot: "#888" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, border: "1px solid rgba(255,255,255,0.2)", display: "inline-block" }}></span>
      <span style={{ color: "#c9a87c", fontSize: "0.9rem" }}>{cfg.label}</span>
    </span>
  );
}

const BLANK = { name: "", colour: "red", year: "", winery: "", country: "", region: "", grape: "", amount: 1, bestBetween: "", occasion: "green", rationale: "" };

export default function WineInventory() {
  const [wines, setWines]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filterOccasion, setFilterOccasion] = useState("all");
  const [filterColour, setFilterColour] = useState("all");
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState({ key: "name", dir: 1 });
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(BLANK);
  const [saving, setSaving]             = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Supabase: Daten laden ──────────────────────────────────────────────────
  useEffect(() => {
    fetchWines();
  }, []);

  async function fetchWines() {
    setLoading(true);
    const { data, error } = await supabase.from("wines").select("*").order("name");
    if (error) setError(error.message);
    else setWines(data || []);
    setLoading(false);
  }

  // ── Supabase: Wein hinzufügen ──────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const payload = { ...form, amount: Number(form.amount), year: Number(form.year) || null };
    delete payload.id;

    if (modal.mode === "add") {
      const { error } = await supabase.from("wines").insert([payload]);
      if (error) { alert("Fehler: " + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("wines").update(payload).eq("id", modal.wine.id);
      if (error) { alert("Fehler: " + error.message); setSaving(false); return; }
    }
    await fetchWines();
    setSaving(false);
    setModal(null);
  }

  // ── Supabase: Wein löschen ─────────────────────────────────────────────────
  async function handleDelete(id) {
    const { error } = await supabase.from("wines").delete().eq("id", id);
    if (error) { alert("Fehler: " + error.message); return; }
    await fetchWines();
    setDeleteConfirm(null);
    setModal(null);
  }

  // ── Filter & Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = wines.filter(w => {
      if (filterOccasion !== "all" && w.occasion !== filterOccasion) return false;
      if (filterColour !== "all" && w.colour !== filterColour) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![w.name, w.winery, w.grape, w.country].some(f => (f || "").toLowerCase().includes(q))) return false;
      }
      return true;
    });
    return [...arr].sort((a, b) => {
      let av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
    });
  }, [wines, filterOccasion, filterColour, search, sort]);

  const stats = useMemo(() => ({
    total:   wines.reduce((s, w) => s + Number(w.amount), 0),
    bottles: wines.length,
    green:   wines.filter(w => w.occasion === "green").length,
    orange:  wines.filter(w => w.occasion === "orange").length,
    red:     wines.filter(w => w.occasion === "red").length,
  }), [wines]);

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 });
  }

  const SortIcon = ({ k }) => (
    <span style={{ marginLeft: 4, opacity: 0.5, fontSize: "0.75rem" }}>
      {sort.key === k ? (sort.dir === 1 ? "↑" : "↓") : "⇅"}
    </span>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", background: "#1a1008", minHeight: "100vh", color: "#e8d9c0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Cinzel:wght@400;600&display=swap');
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1008; }
        ::-webkit-scrollbar-thumb { background: #5c3a1e; border-radius: 3px; }
        .wine-row:hover { background: rgba(92,58,30,0.22) !important; transition: background 0.15s; }
        .th-btn { background: none; border: none; cursor: pointer; color: #c9a87c; font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0; }
        .th-btn:hover { color: #e8d9c0; }
        input, select, textarea { background: #251508; border: 1px solid #5c3a1e; color: #e8d9c0; border-radius: 6px; padding: 8px 12px; width: 100%; font-family: 'Cormorant Garamond', serif; font-size: 1rem; outline: none; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #c9a87c; }
        select option { background: #251508; }
        .btn-primary { background: #5c3a1e; border: 1px solid #8a5c30; color: #e8d9c0; border-radius: 8px; padding: 9px 22px; cursor: pointer; font-family: 'Cinzel', serif; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; transition: background 0.15s; }
        .btn-primary:hover { background: #7a4e28; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost { background: none; border: 1px solid #3d2010; color: #8a6040; border-radius: 8px; padding: 9px 18px; cursor: pointer; font-family: 'Cinzel', serif; font-size: 0.78rem; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #3d2010", background: "linear-gradient(180deg,#2a1208 0%,#1a1008 100%)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px 20px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.25em", color: "#8a5c30", textTransform: "uppercase", marginBottom: 6 }}>Privates Weinkeller-Inventar</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 600, color: "#e8d9c0", margin: 0, letterSpacing: "0.05em" }}>Cave à Vins</h1>
          <div style={{ display: "flex", gap: 28, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Weine gesamt",   val: stats.bottles },
              { label: "Flaschen total", val: stats.total },
              { label: "🟢 Alltag",      val: stats.green,  color: "#34d399" },
              { label: "🟠 Speziell",    val: stats.orange, color: "#fbbf24" },
              { label: "🔴 Rar / Festlich", val: stats.red, color: "#fb7185" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.6rem", fontWeight: 600, color: s.color || "#c9a87c", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "0.7rem", color: "#8a6040", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}>

        {/* ── Legend ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, background: "rgba(42,18,8,0.6)", border: "1px solid #3d2010", borderRadius: 10, padding: "12px 18px", alignItems: "center" }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.12em", color: "#8a5c30", textTransform: "uppercase", marginRight: 6 }}>Anlass</span>
          {Object.entries(occasionConfig).map(([k, cfg]) => (
            <OccasionBadge key={k} occasion={k} />
          ))}
        </div>

        {/* ── Controls ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <input style={{ maxWidth: 240 }} placeholder="🔍 Name, Weingut, Traube…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ maxWidth: 160 }} value={filterOccasion} onChange={e => setFilterOccasion(e.target.value)}>
            <option value="all">Alle Anlässe</option>
            <option value="green">🟢 Alltag</option>
            <option value="orange">🟠 Speziell</option>
            <option value="red">🔴 Rar / Festlich</option>
          </select>
          <select style={{ maxWidth: 140 }} value={filterColour} onChange={e => setFilterColour(e.target.value)}>
            <option value="all">Alle Farben</option>
            <option value="red">Rot</option>
            <option value="white">Weiss</option>
            <option value="rosé">Rosé</option>
          </select>
          <div style={{ marginLeft: "auto" }}>
            <button className="btn-primary" onClick={() => { setForm({ ...BLANK }); setModal({ mode: "add" }); }}>+ Wein hinzufügen</button>
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {loading && <div style={{ textAlign: "center", padding: 60, color: "#8a5c30", fontStyle: "italic" }}>Weinkeller wird geladen…</div>}
        {error && <div style={{ textAlign: "center", padding: 40, color: "#fb7185" }}>⚠ Fehler: {error}</div>}

        {/* ── Table ── */}
        {!loading && !error && (
          <>
            <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #3d2010" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.93rem" }}>
                <thead>
                  <tr style={{ background: "#251508", borderBottom: "2px solid #5c3a1e" }}>
                    {[["name","Name"],["colour","Farbe"],["year","Jahrgang"],["winery","Weingut"],["country","Land"],["grape","Traube"],["amount","Fl."],["bestBetween","Trinkreife"],["occasion","Anlass"]].map(([k, label]) => (
                      <th key={k} style={{ padding: "12px 14px", textAlign: "left" }}>
                        <button className="th-btn" onClick={() => toggleSort(k)}>{label}<SortIcon k={k} /></button>
                      </th>
                    ))}
                    <th style={{ padding: "12px 14px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, i) => (
                    <tr key={w.id} className="wine-row" style={{ borderBottom: "1px solid #2a1208", cursor: "pointer", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "#e8d9c0" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.name}</td>
                      <td style={{ padding: "11px 14px" }} onClick={() => setModal({ mode: "view", wine: w })}><ColourDot colour={w.colour} /></td>
                      <td style={{ padding: "11px 14px", color: "#c9a87c", fontVariantNumeric: "tabular-nums" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.year}</td>
                      <td style={{ padding: "11px 14px", color: "#b89070" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.winery}</td>
                      <td style={{ padding: "11px 14px", color: "#9a7050" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.country}</td>
                      <td style={{ padding: "11px 14px", color: "#9a7050", fontSize: "0.87rem" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.grape}</td>
                      <td style={{ padding: "11px 14px", textAlign: "center", color: "#c9a87c", fontWeight: 700 }} onClick={() => setModal({ mode: "view", wine: w })}>{w.amount}</td>
                      <td style={{ padding: "11px 14px", color: "#8a7060", fontSize: "0.87rem", whiteSpace: "nowrap" }} onClick={() => setModal({ mode: "view", wine: w })}>{w.bestBetween}</td>
                      <td style={{ padding: "11px 14px" }} onClick={() => setModal({ mode: "view", wine: w })}><OccasionBadge occasion={w.occasion} /></td>
                      <td style={{ padding: "11px 10px", whiteSpace: "nowrap" }}>
                        <button onClick={e => { e.stopPropagation(); setForm({ ...w }); setModal({ mode: "edit", wine: w }); }} style={{ background: "none", border: "1px solid #5c3a1e", color: "#c9a87c", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem", marginRight: 6 }}>✏</button>
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm(w.id); }} style={{ background: "none", border: "1px solid #5c1a1a", color: "#fb7185", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#5c3a1e", fontStyle: "italic" }}>Keine Weine gefunden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, color: "#5c3a1e", fontSize: "0.8rem", fontStyle: "italic" }}>
              {filtered.length} von {wines.length} Weinen · {filtered.reduce((s, w) => s + Number(w.amount), 0)} Flaschen
            </div>
          </>
        )}
      </div>

      {/* ── Overlays ── */}
      {(modal || deleteConfirm) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setModal(null); setDeleteConfirm(null); } }}>

          {/* Delete Confirm */}
          {deleteConfirm && (
            <div style={{ background: "#1e0e04", border: "1px solid #5c1a1a", borderRadius: 14, padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: 12 }}>🗑</div>
              <p style={{ marginBottom: 24, color: "#c9a87c" }}>Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
                <button onClick={() => handleDelete(deleteConfirm)} style={{ background: "#5c1a1a", border: "1px solid #8b1a1a", color: "#ffb4b4", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "0.78rem" }}>Löschen</button>
              </div>
            </div>
          )}

          {/* View / Edit / Add */}
          {modal && !deleteConfirm && (
            <div style={{ background: "#1e0e04", border: "1px solid #5c3a1e", borderRadius: 14, padding: 32, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.15rem", color: "#c9a87c", margin: 0 }}>
                  {modal.mode === "add" ? "Neuen Wein hinzufügen" : modal.mode === "edit" ? "Wein bearbeiten" : modal.wine.name}
                </h2>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8a5c30", cursor: "pointer", fontSize: "1.6rem", lineHeight: 1, padding: 0 }}>×</button>
              </div>

              {modal.mode === "view" ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    {[["Farbe", <ColourDot colour={modal.wine.colour} />],["Jahrgang", modal.wine.year],["Weingut", modal.wine.winery],["Land", modal.wine.country],["Region", modal.wine.region],["Traube", modal.wine.grape],["Flaschen", modal.wine.amount],["Trinkreife", modal.wine.bestBetween]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", marginBottom: 3, fontFamily: "'Cinzel', serif" }}>{l}</div>
                        <div style={{ color: "#c9a87c" }}>{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", marginBottom: 6, fontFamily: "'Cinzel', serif" }}>Anlass</div>
                    <OccasionBadge occasion={modal.wine.occasion} />
                  </div>
                  {modal.wine.rationale && (
                    <div>
                      <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", marginBottom: 6, fontFamily: "'Cinzel', serif" }}>Notizen</div>
                      <p style={{ color: "#9a7050", fontStyle: "italic", margin: 0 }}>{modal.wine.rationale}</p>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    <button className="btn-primary" onClick={() => { setForm({ ...modal.wine }); setModal({ mode: "edit", wine: modal.wine }); }}>Bearbeiten</button>
                    <button onClick={() => { setModal(null); setDeleteConfirm(modal.wine.id); }} style={{ background: "none", border: "1px solid #5c1a1a", color: "#fb7185", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontFamily: "'Cinzel', serif", fontSize: "0.78rem" }}>Löschen</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {[["Name","name","text"],["Weingut","winery","text"],["Jahrgang","year","number"],["Land","country","text"],["Region","region","text"],["Traube","grape","text"],["Flaschen","amount","number"],["Trinkreife (z.B. 2025–2030)","bestBetween","text"]].map(([label, key, type]) => (
                    <div key={key}>
                      <label style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4, fontFamily: "'Cinzel', serif" }}>{label}</label>
                      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4, fontFamily: "'Cinzel', serif" }}>Farbe</label>
                    <select value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}>
                      <option value="red">Rot</option><option value="white">Weiss</option><option value="rosé">Rosé</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4, fontFamily: "'Cinzel', serif" }}>Anlass</label>
                    <select value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}>
                      <option value="green">🟢 Alltag</option><option value="orange">🟠 Speziell</option><option value="red">🔴 Rar / Festlich</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5c3a1e", display: "block", marginBottom: 4, fontFamily: "'Cinzel', serif" }}>Notizen</label>
                    <textarea rows={3} value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Speichern…" : "Speichern"}</button>
                    <button className="btn-ghost" onClick={() => setModal(null)}>Abbrechen</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
