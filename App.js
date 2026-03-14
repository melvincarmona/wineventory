import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ── Constants ───────────────────────────────────────────────────────────────
const OCCASION = {
  green:  { label: "Alltag",       dot: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)"  },
  orange: { label: "Speziell",     dot: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
  red:    { label: "Rar/Festlich", dot: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};
const COLOUR = {
  red:   { label: "Rot",   dot: "#7c1d1d" },
  white: { label: "Weiss", dot: "#d4a84b" },
  rosé:  { label: "Rosé",  dot: "#e879a0" },
};
const BLANK_WINE = { name:"", colour:"red", year:"", winery:"", country:"", region:"", grape:"", amount:1, bestBetween:"", occasion:"green", rationale:"" };
const BLANK_WISH = { name:"", colour:"red", year:"", winery:"", country:"", region:"", grape:"", price:"", priority:"medium", tastingNotes:"", notes:"" };

// ── Tiny helpers ────────────────────────────────────────────────────────────
const Badge = ({ occasion }) => {
  const c = OCCASION[occasion]; if (!c) return null;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99, fontSize:"0.72rem", fontWeight:600, background:c.bg, color:c.dot, border:`1px solid ${c.border}` }}><span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block" }}/>{c.label}</span>;
};
const ColourPip = ({ colour }) => {
  const c = COLOUR[colour] || { label: colour, dot:"#888" };
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><span style={{ width:9, height:9, borderRadius:"50%", background:c.dot, border:"1px solid rgba(255,255,255,0.25)" }}/><span style={{ color:"#c4a882", fontSize:"0.88rem" }}>{c.label}</span></span>;
};
const Spinner = () => <span style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(196,168,130,0.3)", borderTopColor:"#c4a882", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>;

// ── AI Search Hook ──────────────────────────────────────────────────────────
// NOTE: web_search tool is not available from the browser — uses Claude's
// built-in wine knowledge instead, which is extensive and accurate.
function useAISearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Du bist ein Weinexperte mit umfangreichem Wissen über Weine weltweit.
Gib EXAKT 3 passende Weinvorschläge als JSON-Array zurück.
Antworte NUR mit einem JSON-Array, KEIN Text davor oder danach, KEINE Markdown-Backticks.
Format: [{"name":"Vollständiger Weinname","winery":"Weingut","year":2021,"colour":"red","country":"Italien","region":"Barolo DOCG","grape":"Nebbiolo","bestBetween":"2025–2035","price":"ca. CHF 45","description":"Kurze Beschreibung in einem Satz"}]
Regeln: colour ist NUR "red", "white" oder "rosé". year ist eine Zahl. price in CHF wenn möglich.`,
          messages: [{ role: "user", content: `Suche nach Wein: "${q}"` }]
        })
      });
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const s = clean.indexOf("["), e = clean.lastIndexOf("]");
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(clean.slice(s, e + 1));
        setResults(Array.isArray(parsed) ? parsed : []);
      } else { setResults([]); }
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  return { results, loading, search, clear: () => setResults([]) };
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("inventory");
  const [wines, setWines] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [w, wl] = await Promise.all([
      supabase.from("wines").select("*").order("name"),
      supabase.from("wishlist").select("*").order("name"),
    ]);
    if (w.data) setWines(w.data);
    if (wl.data) setWishlist(wl.data);
    setLoading(false);
  }

  async function saveWine(form, id) {
    const p = { ...form, amount: Number(form.amount), year: Number(form.year) || null };
    delete p.id;
    if (id) await supabase.from("wines").update(p).eq("id", id);
    else await supabase.from("wines").insert([p]);
    await loadAll(); setModal(null);
  }

  async function deleteWine(id) {
    await supabase.from("wines").delete().eq("id", id);
    await loadAll(); setModal(null);
  }

  async function saveWish(form, id) {
    const p = { ...form, year: Number(form.year) || null };
    delete p.id;
    if (id) await supabase.from("wishlist").update(p).eq("id", id);
    else await supabase.from("wishlist").insert([p]);
    await loadAll(); setModal(null);
  }

  async function deleteWish(id) {
    await supabase.from("wishlist").delete().eq("id", id);
    await loadAll(); setModal(null);
  }

  async function moveToInventory(wish) {
    const { id, price, priority, tastingNotes, notes, ...rest } = wish;
    await supabase.from("wines").insert([{ ...rest, amount: 1, occasion: "green", rationale: [tastingNotes, notes].filter(Boolean).join(" · ") }]);
    await supabase.from("wishlist").delete().eq("id", id);
    await loadAll(); setModal(null);
  }

  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#120a04", minHeight: "100vh", color: "#e8d5b7", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { transform:translateY(100%) } to { transform:translateY(0) } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#120a04 } ::-webkit-scrollbar-thumb { background:#4a2810; border-radius:2px }
        input, select, textarea { background:#1e0f04 !important; border:1px solid #4a2810 !important; color:#e8d5b7 !important; border-radius:10px; padding:11px 14px; width:100%; font-family:'Cormorant Garamond',serif; font-size:1.05rem; outline:none; }
        input:focus, select:focus, textarea:focus { border-color:#c4a882 !important; box-shadow:0 0 0 2px rgba(196,168,130,0.1) }
        select option { background:#1e0f04 }
        .card { background:linear-gradient(135deg,#1e0f04 0%,#180c04 100%); border:1px solid #3a2010; border-radius:16px; padding:16px; margin-bottom:10px; cursor:pointer; animation:fadeUp 0.3s ease; transition:border-color 0.2s,transform 0.15s; }
        .card:active { transform:scale(0.985) }
        .card:hover { border-color:#6a3820 }
        .btn { border:none; border-radius:12px; padding:13px 20px; font-family:'Cinzel',serif; font-size:0.78rem; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; text-transform:uppercase; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        .btn-primary { background:linear-gradient(135deg,#7a3a10,#5a2a08); color:#f5e6d0; }
        .btn-primary:hover { background:linear-gradient(135deg,#8a4a20,#6a3a18) }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed }
        .btn-secondary { background:rgba(74,40,16,0.4); color:#c4a882; border:1px solid #4a2810 !important; }
        .btn-danger { background:rgba(120,20,20,0.4); color:#f87171; border:1px solid rgba(120,20,20,0.6) !important; }
        .btn-green { background:rgba(20,80,40,0.5); color:#4ade80; border:1px solid rgba(74,222,128,0.3) !important; }
        .label { font-family:'Cinzel',serif; font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase; color:#6a4a28; margin-bottom:5px; display:block }
        .sheet { position:fixed; inset:0; z-index:100; display:flex; flex-direction:column; justify-content:flex-end; background:rgba(0,0,0,0.72); }
        .sheet-inner { background:#160a02; border-top-left-radius:24px; border-top-right-radius:24px; border-top:1px solid #4a2810; max-height:92vh; overflow-y:auto; animation:slideIn 0.3s cubic-bezier(0.32,0.72,0,1); padding-bottom:env(safe-area-inset-bottom,24px) }
        .suggestion { padding:12px 16px; border-bottom:1px solid #2a1508; cursor:pointer; transition:background 0.15s; }
        .suggestion:last-child { border-bottom:none }
        .suggestion:hover, .suggestion:active { background:rgba(74,40,16,0.4) }
        .tab-bar { display:flex; background:#160a02; border-bottom:1px solid #2a1508; }
        .tab { flex:1; padding:14px 8px; background:none; border:none; color:#6a4020; font-family:'Cinzel',serif; font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; border-bottom:2px solid transparent; }
        .tab.active { color:#c4a882; border-bottom-color:#c4a882 }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "52px 20px 0", background: "linear-gradient(180deg,#1e0f04 0%,#120a04 100%)", borderBottom: "1px solid #2a1508", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.62rem", letterSpacing: "0.3em", color: "#6a4020", textTransform: "uppercase", marginBottom: 3 }}>Privates Inventar</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: "1.9rem", fontWeight: 600, color: "#e8d5b7", margin: "0 0 14px", letterSpacing: "0.05em" }}>Cave à Vins</h1>
        <div className="tab-bar" style={{ margin: "0 -20px" }}>
          <button className={`tab${tab === "inventory" ? " active" : ""}`} onClick={() => setTab("inventory")}>🍾 Keller ({wines.length})</button>
          <button className={`tab${tab === "wishlist" ? " active" : ""}`} onClick={() => setTab("wishlist")}>✨ Wunschliste ({wishlist.length})</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "16px 16px 100px" }}>
        {loading
          ? <div style={{ textAlign: "center", padding: 60, color: "#6a4020", fontStyle: "italic" }}>Keller wird geladen…</div>
          : tab === "inventory"
            ? <InventoryView wines={wines} onView={w => setModal({ type: "viewWine", payload: w })} />
            : <WishlistView wishlist={wishlist} onView={w => setModal({ type: "viewWish", payload: w })} />
        }
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setModal({ type: tab === "inventory" ? "addWine" : "addWish", payload: null })}
        style={{ position: "fixed", bottom: 32, right: 20, width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#8a3a10,#5a2008)", border: "1px solid rgba(196,168,130,0.2)", color: "#f5e6d0", fontSize: "1.7rem", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.6)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
      >+</button>

      {/* ── Modals ── */}
      {modal?.type === "addWine"  && <WineFormSheet  title="Wein hinzufügen"   init={BLANK_WINE}        onSave={f => saveWine(f, null)}             onClose={() => setModal(null)} isNew />}
      {modal?.type === "editWine" && <WineFormSheet  title="Wein bearbeiten"   init={modal.payload}     onSave={f => saveWine(f, modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "addWish"  && <WishFormSheet  title="Wunsch hinzufügen" init={BLANK_WISH}        onSave={f => saveWish(f, null)}             onClose={() => setModal(null)} isNew />}
      {modal?.type === "editWish" && <WishFormSheet  title="Wunsch bearbeiten" init={modal.payload}     onSave={f => saveWish(f, modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "viewWine" && <WineDetailSheet wine={modal.payload} onEdit={w => setModal({ type: "editWine", payload: w })} onDelete={() => deleteWine(modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "viewWish" && <WishDetailSheet wish={modal.payload} onEdit={w => setModal({ type: "editWish", payload: w })} onDelete={() => deleteWish(modal.payload.id)} onMove={() => moveToInventory(modal.payload)} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Inventory View ──────────────────────────────────────────────────────────
function InventoryView({ wines, onView }) {
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState("all");
  const [occFilter, setOccFilter] = useState("all");

  const filtered = useMemo(() => wines.filter(w => {
    if (colFilter !== "all" && w.colour !== colFilter) return false;
    if (occFilter !== "all" && w.occasion !== occFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [w.name, w.winery, w.grape, w.country, w.region].some(f => (f || "").toLowerCase().includes(q));
    }
    return true;
  }), [wines, search, colFilter, occFilter]);

  const total = wines.reduce((s, w) => s + Number(w.amount || 0), 0);

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {[
          ["Flaschen", total, "#c4a882"],
          ...Object.entries(OCCASION).map(([k, v]) => [v.label, wines.filter(w => w.occasion === k).length, v.dot])
        ].map(([l, v, c]) => (
          <div key={l} style={{ flex: "0 0 auto", background: "rgba(30,15,4,0.8)", border: "1px solid #2a1508", borderRadius: 12, padding: "8px 14px", textAlign: "center", minWidth: 72 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "1.35rem", fontWeight: 600, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: "0.6rem", color: "#6a4020", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      <input placeholder="🔍 Name, Weingut, Traube…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

      {/* Colour filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
        {[["all", "Alle Farben"], ["red", "🔴 Rot"], ["white", "⚪ Weiss"], ["rosé", "🩷 Rosé"]].map(([v, l]) => (
          <button key={v} onClick={() => setColFilter(v)} style={{ flex: "0 0 auto", padding: "5px 12px", borderRadius: 99, border: `1px solid ${colFilter === v ? "#c4a882" : "#3a2010"}`, background: colFilter === v ? "rgba(196,168,130,0.15)" : "transparent", color: colFilter === v ? "#c4a882" : "#6a4020", fontSize: "0.75rem", fontFamily: "'Cinzel',serif", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>

      {/* Occasion filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {[["all", "Alle Anlässe"], ...Object.entries(OCCASION).map(([k, v]) => [k, v.label])].map(([v, l]) => (
          <button key={v} onClick={() => setOccFilter(v)} style={{ flex: "0 0 auto", padding: "5px 12px", borderRadius: 99, border: `1px solid ${occFilter === v ? "#c4a882" : "#3a2010"}`, background: occFilter === v ? "rgba(196,168,130,0.15)" : "transparent", color: occFilter === v ? "#c4a882" : "#6a4020", fontSize: "0.75rem", fontFamily: "'Cinzel',serif", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#4a2810", fontStyle: "italic" }}>Keine Weine gefunden.</div>}
      {filtered.map(w => (
        <div key={w.id} className="card" onClick={() => onView(w)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.92rem", fontWeight: 500, color: "#e8d5b7", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
              <div style={{ fontSize: "0.85rem", color: "#9a7050", marginBottom: 7 }}>{[w.winery, w.year, w.country].filter(Boolean).join(" · ")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                <ColourPip colour={w.colour} />
                <Badge occasion={w.occasion} />
                {w.grape && <span style={{ fontSize: "0.73rem", color: "#6a4828", fontStyle: "italic" }}>{w.grape}</span>}
              </div>
              {w.bestBetween && <div style={{ fontSize: "0.72rem", color: "#5a3818", marginTop: 5 }}>Trinkreife: {w.bestBetween}</div>}
            </div>
            <div style={{ textAlign: "center", flexShrink: 0, background: "rgba(18,10,4,0.5)", borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "1.7rem", fontWeight: 600, color: "#c4a882", lineHeight: 1 }}>{w.amount}</div>
              <div style={{ fontSize: "0.58rem", color: "#5a3818", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>Fl.</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Wishlist View ───────────────────────────────────────────────────────────
function WishlistView({ wishlist, onView }) {
  const [search, setSearch] = useState("");
  const PRIORITY = {
    high:   { label: "Dringend",    color: "#f87171", dot: "#f87171" },
    medium: { label: "Mittlere Prio", color: "#fb923c", dot: "#fb923c" },
    low:    { label: "Irgendwann",  color: "#6a4828", dot: "#6a4828" },
  };

  const filtered = useMemo(() => wishlist.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [w.name, w.winery, w.grape, w.country].some(f => (f || "").toLowerCase().includes(q));
  }), [wishlist, search]);

  return (
    <>
      <input placeholder="🔍 Suche…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#4a2810", fontStyle: "italic" }}>Wunschliste ist leer.<br /><span style={{ fontSize: "0.85rem" }}>Tippe + um einen Wein hinzuzufügen.</span></div>}
      {filtered.map(w => {
        const pr = PRIORITY[w.priority] || PRIORITY.medium;
        return (
          <div key={w.id} className="card" onClick={() => onView(w)}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.dot, flexShrink: 0, display: "inline-block" }} />
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.92rem", fontWeight: 500, color: "#e8d5b7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name || "Unbenannt"}</div>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9a7050", marginBottom: 7 }}>{[w.winery, w.year, w.country].filter(Boolean).join(" · ")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {w.colour && <ColourPip colour={w.colour} />}
                  {w.grape && <span style={{ fontSize: "0.73rem", color: "#6a4828", fontStyle: "italic" }}>{w.grape}</span>}
                  {w.price && <span style={{ fontSize: "0.8rem", color: "#4ade80", fontFamily: "'Cinzel',serif", fontWeight: 600 }}>{w.price}</span>}
                </div>
                {w.tastingNotes && <div style={{ fontSize: "0.78rem", color: "#8a6040", fontStyle: "italic", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{w.tastingNotes}"</div>}
              </div>
              <div style={{ fontSize: "0.68rem", color: pr.color, fontFamily: "'Cinzel',serif", whiteSpace: "nowrap", marginTop: 2 }}>{pr.label}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── AI Search Panel ─────────────────────────────────────────────────────────
function AISearchPanel({ onApply, onDismiss }) {
  const [query, setQuery] = useState("");
  const { results, loading, search, clear } = useAISearch();

  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a1508", background: "rgba(18,10,4,0.5)" }}>
      <label className="label">🤖 KI-Suche – Weinname oder Beschreibung</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          placeholder="z.B. Barolo 2019, Grüner Veltliner Kamptal…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(query)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={() => search(query)} disabled={loading} style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
          {loading ? <Spinner /> : "Suchen"}
        </button>
      </div>
      {loading && <div style={{ textAlign: "center", color: "#6a4020", fontStyle: "italic", fontSize: "0.88rem", padding: "8px 0" }}>KI sucht Weininfos…</div>}
      {results.length > 0 && (
        <div style={{ border: "1px solid #3a2010", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
          {results.map((r, i) => (
            <div key={i} className="suggestion" onClick={() => { onApply(r); clear(); }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.88rem", color: "#e8d5b7", marginBottom: 2 }}>
                {r.name}{r.year ? ` · ${r.year}` : ""}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#8a6040", marginBottom: 4 }}>{[r.winery, r.country, r.region].filter(Boolean).join(" · ")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {r.grape && <span style={{ fontSize: "0.72rem", color: "#6a4828", fontStyle: "italic" }}>{r.grape}</span>}
                {r.price && <span style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 600 }}>{r.price}</span>}
                {r.bestBetween && <span style={{ fontSize: "0.72rem", color: "#5a3818" }}>Trinkreife: {r.bestBetween}</span>}
              </div>
              {r.description && <div style={{ fontSize: "0.78rem", color: "#7a5838", marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>{r.description}</div>}
            </div>
          ))}
        </div>
      )}
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#5a3818", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'Cinzel',serif", textDecoration: "underline", padding: 0 }}>
        → Ohne KI manuell eingeben
      </button>
    </div>
  );
}

// ── Wine Form Sheet ─────────────────────────────────────────────────────────
function WineFormSheet({ title, init, onSave, onClose, isNew }) {
  const [form, setForm] = useState({ ...BLANK_WINE, ...init });
  const [showAI, setShowAI] = useState(!!isNew);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function applyAI(r) {
    setForm(f => ({
      ...f,
      name:        r.name        || f.name,
      winery:      r.winery      || f.winery,
      year:        r.year        || f.year,
      colour:      r.colour      || f.colour,
      country:     r.country     || f.country,
      region:      r.region      || f.region,
      grape:       r.grape       || f.grape,
      bestBetween: r.bestBetween || f.bestBetween,
      rationale:   r.description || f.rationale,
    }));
    setShowAI(false);
  }

  async function handleSave() { setSaving(true); await onSave(form); setSaving(false); }

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px" }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: "1.05rem", color: "#c4a882", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a4020", fontSize: "1.5rem", cursor: "pointer", padding: "0 4px" }}>×</button>
        </div>

        {showAI
          ? <AISearchPanel onApply={applyAI} onDismiss={() => setShowAI(false)} />
          : (
            <button onClick={() => setShowAI(true)} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 20px 4px", background: "rgba(74,40,16,0.25)", border: "1px solid #3a2010", color: "#8a6040", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Cinzel',serif", width: "calc(100% - 40px)" }}>
              🤖 <span>KI-Weinsuche öffnen</span>
            </button>
          )
        }

        <div style={{ padding: "12px 20px", display: "grid", gap: 11 }}>
          {[["Name", "name", "text"], ["Weingut", "winery", "text"], ["Jahrgang", "year", "number"], ["Land", "country", "text"], ["Region / Appellation", "region", "text"], ["Traube(n)", "grape", "text"], ["Anzahl Flaschen", "amount", "number"], ["Trinkreife (z.B. 2025–2032)", "bestBetween", "text"]].map(([l, k, t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type={t} value={form[k] || ""} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="label">Farbe</label>
            <select value={form.colour} onChange={e => set("colour", e.target.value)}>
              <option value="red">Rot</option><option value="white">Weiss</option><option value="rosé">Rosé</option>
            </select>
          </div>
          <div>
            <label className="label">Anlass</label>
            <select value={form.occasion} onChange={e => set("occasion", e.target.value)}>
              <option value="green">🟢 Alltag – jederzeit öffnen</option>
              <option value="orange">🟠 Speziell – besondere Anlässe</option>
              <option value="red">🔴 Rar / Festlich – nur für grosse Momente</option>
            </select>
          </div>
          <div>
            <label className="label">Notizen & Beschreibung</label>
            <textarea rows={3} value={form.rationale || ""} onChange={e => set("rationale", e.target.value)} placeholder="Aromen, Pairings, persönliche Eindrücke…" />
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? <Spinner /> : "Speichern"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wine Detail Sheet ───────────────────────────────────────────────────────
function WineDetailSheet({ wine, onEdit, onDelete, onClose }) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "1.1rem", fontWeight: 500, color: "#e8d5b7", marginBottom: 4, lineHeight: 1.3 }}>{wine.name}</div>
            <div style={{ fontSize: "0.88rem", color: "#8a6040" }}>{[wine.winery, wine.year].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a4020", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <ColourPip colour={wine.colour} /><Badge occasion={wine.occasion} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[["Land", wine.country], ["Region", wine.region], ["Traube", wine.grape], ["Trinkreife", wine.bestBetween], ["Flaschen", wine.amount]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l}>
                <div className="label">{l}</div>
                <div style={{ color: "#c4a882", fontSize: "0.95rem" }}>{v}</div>
              </div>
            ))}
          </div>
          {wine.rationale && (
            <div style={{ background: "rgba(30,15,4,0.7)", border: "1px solid #2a1508", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <div className="label">Notizen</div>
              <div style={{ color: "#9a7050", fontStyle: "italic", fontSize: "0.95rem", lineHeight: 1.6 }}>{wine.rationale}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onEdit(wine)} style={{ flex: 1 }}>Bearbeiten</button>
            <button className="btn btn-danger" onClick={() => confirmDel ? onDelete() : setConfirmDel(true)} style={{ flex: 1 }}>
              {confirmDel ? "Sicher löschen?" : "Löschen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wish Form Sheet ─────────────────────────────────────────────────────────
function WishFormSheet({ title, init, onSave, onClose, isNew }) {
  const [form, setForm] = useState({ ...BLANK_WISH, ...init });
  const [showAI, setShowAI] = useState(!!isNew);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function applyAI(r) {
    setForm(f => ({
      ...f,
      name:    r.name    || f.name,
      winery:  r.winery  || f.winery,
      year:    r.year    || f.year,
      colour:  r.colour  || f.colour,
      country: r.country || f.country,
      region:  r.region  || f.region,
      grape:   r.grape   || f.grape,
      price:   r.price   || f.price,
      notes:   r.description || f.notes,
    }));
    setShowAI(false);
  }

  async function handleSave() { setSaving(true); await onSave(form); setSaving(false); }

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px" }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: "1.05rem", color: "#c4a882", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a4020", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
        </div>

        {showAI
          ? <AISearchPanel onApply={applyAI} onDismiss={() => setShowAI(false)} />
          : (
            <button onClick={() => setShowAI(true)} style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 20px 4px", background: "rgba(74,40,16,0.25)", border: "1px solid #3a2010", color: "#8a6040", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Cinzel',serif", width: "calc(100% - 40px)" }}>
              🤖 <span>KI-Weinsuche öffnen</span>
            </button>
          )
        }

        <div style={{ padding: "12px 20px", display: "grid", gap: 11 }}>
          {[["Name", "name", "text"], ["Weingut", "winery", "text"], ["Jahrgang", "year", "number"], ["Land", "country", "text"], ["Region", "region", "text"], ["Traube(n)", "grape", "text"], ["Marktpreis (z.B. ca. CHF 38)", "price", "text"]].map(([l, k, t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type={t} value={form[k] || ""} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="label">Farbe</label>
            <select value={form.colour} onChange={e => set("colour", e.target.value)}>
              <option value="red">Rot</option><option value="white">Weiss</option><option value="rosé">Rosé</option>
            </select>
          </div>
          <div>
            <label className="label">Priorität</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option value="high">🔴 Dringend kaufen</option>
              <option value="medium">🟠 Mittlere Priorität</option>
              <option value="low">⚪ Irgendwann</option>
            </select>
          </div>
          <div>
            <label className="label">Geschmacksnotizen – warum möchte ich diesen Wein?</label>
            <textarea rows={2} placeholder="z.B. kräftig, tanninreich, nach dunklen Früchten, würzig…" value={form.tastingNotes || ""} onChange={e => set("tastingNotes", e.target.value)} />
          </div>
          <div>
            <label className="label">Notizen (wo kaufen, für welchen Anlass…)</label>
            <textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? <Spinner /> : "Speichern"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wish Detail Sheet ───────────────────────────────────────────────────────
function WishDetailSheet({ wish, onEdit, onDelete, onMove, onClose }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const PRIORITY = {
    high:   { label: "Dringend kaufen",   color: "#f87171" },
    medium: { label: "Mittlere Priorität", color: "#fb923c" },
    low:    { label: "Irgendwann",         color: "#6a4828" },
  };
  const pr = PRIORITY[wish.priority] || PRIORITY.medium;

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "1.1rem", fontWeight: 500, color: "#e8d5b7", marginBottom: 4, lineHeight: 1.3 }}>{wish.name}</div>
            <div style={{ fontSize: "0.88rem", color: "#8a6040" }}>{[wish.winery, wish.year].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a4020", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {wish.colour && <ColourPip colour={wish.colour} />}
            <span style={{ fontSize: "0.75rem", color: pr.color, fontFamily: "'Cinzel',serif" }}>● {pr.label}</span>
            {wish.price && <span style={{ fontSize: "0.92rem", color: "#4ade80", fontFamily: "'Cinzel',serif", fontWeight: 600 }}>{wish.price}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["Land", wish.country], ["Region", wish.region], ["Traube", wish.grape]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l}><div className="label">{l}</div><div style={{ color: "#c4a882", fontSize: "0.95rem" }}>{v}</div></div>
            ))}
          </div>
          {wish.tastingNotes && (
            <div style={{ background: "rgba(30,15,4,0.7)", border: "1px solid #2a1508", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
              <div className="label">Geschmack & Warum</div>
              <div style={{ color: "#9a7050", fontStyle: "italic", fontSize: "0.93rem", lineHeight: 1.5 }}>{wish.tastingNotes}</div>
            </div>
          )}
          {wish.notes && (
            <div style={{ background: "rgba(30,15,4,0.7)", border: "1px solid #2a1508", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
              <div className="label">Notizen</div>
              <div style={{ color: "#9a7050", fontSize: "0.9rem", lineHeight: 1.5 }}>{wish.notes}</div>
            </div>
          )}
          <button className="btn btn-green" onClick={onMove} style={{ width: "100%", marginBottom: 10, fontSize: "0.8rem" }}>
            ✓ Gekauft – in Keller verschieben
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onEdit(wish)} style={{ flex: 1 }}>Bearbeiten</button>
            <button className="btn btn-danger" onClick={() => confirmDel ? onDelete() : setConfirmDel(true)} style={{ flex: 1 }}>
              {confirmDel ? "Sicher?" : "Löschen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
