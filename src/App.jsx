import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ── Design tokens ───────────────────────────────────────────────────────────
const CLR = {
  forest:     "#1a4d28",
  forestDark: "#133a1e",
  forestMid:  "#2d6a3a",
  bg:         "#f2faef",
  cardBg:     "#ffffff",
  iconCircle: "#e0f2e4",
  border:     "#a8d0b0",
  borderLight:"#c8e8d0",
  textPrimary:"#0d2a14",
  textMuted:  "#4a8a5a",
  textFaint:  "#7aaa80",
};

// ── Occasion config ─────────────────────────────────────────────────────────
const OCCASION = {
  green:  { label: "Everyday",  dot: "#2d9e50", bg: "rgba(45,158,80,0.1)",   border: "rgba(45,158,80,0.3)"   },
  orange: { label: "Special",   dot: "#d07820", bg: "rgba(208,120,32,0.1)",  border: "rgba(208,120,32,0.3)"  },
  red:    { label: "Diamonds",  dot: "#c03030", bg: "rgba(192,48,48,0.1)",   border: "rgba(192,48,48,0.3)"   },
};

// ── Colour config ───────────────────────────────────────────────────────────
const COLOUR = {
  red:      { label: "Red",       dot: "#7c1d1d" },
  white:    { label: "White",     dot: "#d4a84b" },
  rosé:     { label: "Rosé",      dot: "#e879a0" },
  sparkling:{ label: "Sparkling", dot: "#e8c020" },
};

const BLANK_WINE = { name:"", colour:"red", year:"", winery:"", country:"", region:"", grape:"", amount:1, bestBetween:"", occasion:"green", rationale:"" };
const BLANK_WISH = { name:"", colour:"red", year:"", winery:"", country:"", region:"", grape:"", price:"", priority:"medium", tastingNotes:"", notes:"" };

// ── SVG Icons ───────────────────────────────────────────────────────────────
const IconBottle = ({ size=14, color=CLR.forest }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M4.5 1h3v2.5c0 .3.1.5.3.7L9 5.5V10a1 1 0 01-1 1H4a1 1 0 01-1-1V5.5L4.2 4.2c.2-.2.3-.4.3-.7V1z" stroke={color} strokeWidth="1.1" strokeLinejoin="round"/>
    <path d="M3 7h6" stroke={color} strokeWidth="1.1"/>
  </svg>
);
const IconSun = ({ size=14, color=CLR.forest }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke={color} strokeWidth="1.1"/>
    <path d="M6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1M2.9 2.9l.7.7M8.4 8.4l.7.7M2.9 9.1l.7-.7M8.4 3.6l.7-.7" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);
const IconStar = ({ size=14, color=CLR.forest }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 1.5l1.1 2.5 2.7.4-1.9 1.9.4 2.7L6 7.8l-2.3 1.2.4-2.7L2.2 4.4l2.7-.4z" stroke={color} strokeWidth="1.1" strokeLinejoin="round"/>
  </svg>
);
const IconDiamond = ({ size=14, color=CLR.forest }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 10.5L1.5 5.5l1.5-3h6l1.5 3z" stroke={color} strokeWidth="1.1" strokeLinejoin="round"/>
    <path d="M1.5 5.5h9M4 2.5L3 5.5l3 5M8 2.5L9 5.5 6 10.5M4 2.5l2 3 2-3" stroke={color} strokeWidth="0.9" strokeLinejoin="round"/>
  </svg>
);
const IconSearch = ({ size=12, color=CLR.forest }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <circle cx="5" cy="5" r="3" stroke={color} strokeWidth="1.2"/>
    <path d="M8 8l2 2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ── Wine Bottle Emoji Icons ─────────────────────────────────────────────────
// Renders N wine bottle emojis for amount in inventory cards
const BottleIcons = ({ amount }) => {
  const count = Number(amount) || 0;
  // Show max 8 icons to avoid overflow, then show "+N"
  const MAX_SHOW = 8;
  const shown = Math.min(count, MAX_SHOW);
  const extra = count - MAX_SHOW;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:1, alignItems:"center", justifyContent:"center", maxWidth:80 }}>
      {Array.from({ length: shown }).map((_, i) => (
        <span key={i} style={{ fontSize:"0.9rem", lineHeight:1 }}>🍷</span>
      ))}
      {extra > 0 && (
        <span style={{ fontSize:"0.6rem", color:CLR.textMuted, fontFamily:"'Manrope',sans-serif", fontWeight:600 }}>+{extra}</span>
      )}
    </div>
  );
};

// ── Tiny helpers ────────────────────────────────────────────────────────────
const Badge = ({ occasion }) => {
  const c = OCCASION[occasion]; if (!c) return null;
  const isAlltag = occasion === "green";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99, fontSize:"0.72rem", fontWeight:600, background: isAlltag ? CLR.iconCircle : c.bg, color: isAlltag ? CLR.forest : c.dot, border:`1px solid ${isAlltag ? CLR.border : c.border}` }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: isAlltag ? CLR.forest : c.dot, display:"inline-block" }}/>
      {c.label}
    </span>
  );
};

const ColourPip = ({ colour }) => {
  const c = COLOUR[colour] || { label: colour, dot:"#888" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:9, height:9, borderRadius:"50%", background:c.dot, border:"1px solid rgba(0,0,0,0.1)", display:"inline-block" }}/>
      <span style={{ color:CLR.textMuted, fontSize:"0.88rem" }}>{c.label}</span>
    </span>
  );
};

const Spinner = () => (
  <span style={{ display:"inline-block", width:16, height:16, border:`2px solid ${CLR.borderLight}`, borderTopColor:CLR.forest, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
);

// ── Clickable StatCard ──────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, valueColor, onClick, isActive }) => (
  <div
    onClick={onClick}
    style={{
      background: isActive ? CLR.forest : CLR.cardBg,
      border: isActive ? `0.5px solid ${CLR.forestDark}` : `0.5px solid ${CLR.border}`,
      borderRadius:10,
      padding:"8px 4px",
      textAlign:"center",
      flex:1,
      cursor: onClick ? "pointer" : "default",
      transition:"all 0.18s",
      transform: isActive ? "scale(1.04)" : "scale(1)",
      boxShadow: isActive ? `0 2px 10px rgba(26,77,40,0.18)` : "none",
    }}
  >
    <div style={{ width:26, height:26, borderRadius:"50%", background: isActive ? "rgba(255,255,255,0.18)" : CLR.iconCircle, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px" }}>
      {/* Re-render icon with white color when active */}
      {onClick && isActive
        ? <span style={{ filter:"brightness(10)" }}>{icon}</span>
        : icon
      }
    </div>
    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1.2rem", fontWeight:600, color: isActive ? "#fff" : (valueColor || CLR.textPrimary), lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:"0.6rem", color: isActive ? "rgba(255,255,255,0.7)" : CLR.textFaint, textTransform:"uppercase", letterSpacing:"0.05em", marginTop:3 }}>{label}</div>
  </div>
);

// ── AI Search Hook (via Vercel Serverless Function /api/wine-search) ────────
function useAISearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wine-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setResults([]);
        setError("Keine Ergebnisse gefunden.");
      }
    } catch {
      setResults([]);
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }, []);

  return { results, loading, error, search, clear: () => { setResults([]); setError(null); } };
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("inventory");
  const [wines, setWines] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [drunkLog, setDrunkLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [w, wl, dl] = await Promise.all([
      supabase.from("wines").select("*").order("name"),
      supabase.from("wishlist").select("*").order("name"),
      supabase.from("drunk_log").select("*").order("drunk_at", { ascending: false }),
    ]);
    if (w.data) setWines(w.data);
    if (wl.data) setWishlist(wl.data);
    if (dl.data) setDrunkLog(dl.data);
    setLoading(false);
  }

  async function markAsDrunk(wine, logData) {
    const entry = {
      name:         wine.name,
      colour:       wine.colour,
      year:         wine.year,
      winery:       wine.winery,
      country:      wine.country,
      region:       wine.region,
      grape:        wine.grape,
      occasion:     wine.occasion,
      drunk_at:     new Date().toISOString().slice(0,10),
      rating:       logData.rating ? Number(logData.rating) : null,
      tasting_note: logData.tasting_note || null,
    };
    await supabase.from("drunk_log").insert([entry]);
    const newAmount = Number(wine.amount) - 1;
    if (newAmount <= 0) {
      await supabase.from("wines").delete().eq("id", wine.id);
    } else {
      await supabase.from("wines").update({ amount: newAmount }).eq("id", wine.id);
    }
    await loadAll();
    setModal(null);
  }

  async function deleteDrunkEntry(id) {
    await supabase.from("drunk_log").delete().eq("id", id);
    await loadAll();
    setModal(null);
  }

  async function saveWine(form, id) {
    const p = { ...form, amount:Number(form.amount), year:Number(form.year) || null };
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
    const p = { ...form, year:Number(form.year) || null };
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
    await supabase.from("wines").insert([{ ...rest, amount:1, occasion:"green", rationale:[tastingNotes, notes].filter(Boolean).join(" · ") }]);
    await supabase.from("wishlist").delete().eq("id", id);
    await loadAll(); setModal(null);
  }

  return (
    <div style={{ fontFamily:"'Manrope',sans-serif", background:CLR.bg, minHeight:"100vh", color:CLR.textPrimary, maxWidth:480, margin:"0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { transform:translateY(100%) } to { transform:translateY(0) } }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { width:3px } ::-webkit-scrollbar-track { background:${CLR.bg} } ::-webkit-scrollbar-thumb { background:${CLR.border}; border-radius:2px }
        input, select, textarea { background:#f7fdf8 !important; border:1px solid ${CLR.border} !important; color:${CLR.textPrimary} !important; border-radius:10px; padding:11px 14px; width:100%; font-family:'Manrope',sans-serif; font-size:1.05rem; outline:none; }
        input:focus, select:focus, textarea:focus { border-color:${CLR.forest} !important; box-shadow:0 0 0 2px rgba(26,77,40,0.1) }
        select option { background:#f7fdf8 }
        .card { background:${CLR.cardBg}; border:0.5px solid ${CLR.border}; border-radius:14px; padding:14px 16px; margin-bottom:9px; cursor:pointer; animation:fadeUp 0.25s ease; transition:border-color 0.2s,transform 0.15s; }
        .card:active { transform:scale(0.985) }
        .card:hover { border-color:${CLR.forestMid} }
        .btn { border:none; border-radius:12px; padding:13px 20px; font-family:'Manrope',sans-serif; font-size:0.78rem; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; text-transform:uppercase; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        .btn-primary { background:${CLR.forest}; color:#fff; }
        .btn-primary:hover { background:${CLR.forestMid} }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed }
        .btn-secondary { background:${CLR.iconCircle}; color:${CLR.forest}; border:1px solid ${CLR.border} !important; }
        .btn-danger { background:rgba(192,48,48,0.1); color:#c03030; border:1px solid rgba(192,48,48,0.3) !important; }
        .btn-move { background:rgba(26,77,40,0.1); color:${CLR.forest}; border:1px solid ${CLR.border} !important; }
        .label { font-family:'Manrope',sans-serif; font-size:0.62rem; letter-spacing:0.12em; text-transform:uppercase; color:${CLR.textMuted}; margin-bottom:5px; display:block }
        .sheet { position:fixed; inset:0; z-index:100; display:flex; flex-direction:column; justify-content:flex-end; background:rgba(0,0,0,0.55); }
        .sheet-inner { background:${CLR.bg}; border-top-left-radius:22px; border-top-right-radius:22px; border-top:1px solid ${CLR.border}; max-height:92vh; overflow-y:auto; animation:slideIn 0.3s cubic-bezier(0.32,0.72,0,1); padding-bottom:env(safe-area-inset-bottom,24px) }
        .suggestion { padding:12px 16px; border-bottom:0.5px solid ${CLR.borderLight}; cursor:pointer; transition:background 0.15s; }
        .suggestion:last-child { border-bottom:none }
        .suggestion:hover, .suggestion:active { background:${CLR.iconCircle} }
        .filter-pill { flex:0 0 auto; padding:5px 13px; border-radius:99px; font-family:'Manrope',sans-serif; font-size:0.72rem; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
        .stat-card-clickable:active { transform:scale(0.96) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:CLR.forest, borderBottom:`1px solid ${CLR.forestDark}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ padding:"48px 20px 0" }}>
          <div style={{ fontSize:"0.58rem", letterSpacing:"0.22em", color:"rgba(255,255,255,0.48)", textTransform:"uppercase", marginBottom:3, fontFamily:"'Manrope',sans-serif" }}>
            Bottled Treasures of EB20
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <div>
              <h1 style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1.75rem", fontWeight:600, color:"#fff", margin:0, letterSpacing:"0.15em", textTransform:"uppercase", lineHeight:1 }}>
                WINEVENTORY
              </h1>
            </div>
            <button
              onClick={() => setModal({ type: tab === "inventory" ? "addWine" : tab === "wishlist" ? "addWish" : "addWine", payload:null })}
              style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.22)", color:"#fff", fontSize:"1.5rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginBottom:4 }}
            >+</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", padding:"0 4px" }}>
          {[["inventory","🍾 Cellar"],["wishlist","✨ Wishlist"],["drunk","💀 Graveyard"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:"10px 4px", background:"none", border:"none", color: tab === key ? "#fff" : "rgba(255,255,255,0.42)", fontFamily:"'Manrope',sans-serif", fontSize:"0.62rem", letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", borderBottom: tab === key ? "2px solid rgba(255,255,255,0.75)" : "2px solid transparent", transition:"all 0.2s" }}>
              {label} ({key === "inventory" ? wines.length : key === "wishlist" ? wishlist.length : drunkLog.length})
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"16px 16px 100px" }}>
        {loading
          ? <div style={{ textAlign:"center", padding:60, color:CLR.textMuted, fontStyle:"italic" }}>Loading cellar…</div>
          : tab === "inventory"
            ? <InventoryView wines={wines} onView={w => setModal({ type:"viewWine", payload:w })} />
            : tab === "wishlist"
            ? <WishlistView wishlist={wishlist} onView={w => setModal({ type:"viewWish", payload:w })} />
            : <DrunkLogView drunkLog={drunkLog} onView={e => setModal({ type:"viewDrunk", payload:e })} />
        }
      </div>

      {/* ── Modals ── */}
      {modal?.type === "addWine"   && <WineFormSheet   title="Add wine"         init={BLANK_WINE}    onSave={f => saveWine(f, null)}             onClose={() => setModal(null)} isNew />}
      {modal?.type === "editWine"  && <WineFormSheet   title="Edit wine"        init={modal.payload} onSave={f => saveWine(f, modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "addWish"   && <WishFormSheet   title="Add to wishlist"  init={BLANK_WISH}    onSave={f => saveWish(f, null)}             onClose={() => setModal(null)} isNew />}
      {modal?.type === "editWish"  && <WishFormSheet   title="Edit wish"        init={modal.payload} onSave={f => saveWish(f, modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "viewWine"  && <WineDetailSheet  wine={modal.payload} onEdit={w => setModal({ type:"editWine", payload:w })} onDelete={() => deleteWine(modal.payload.id)} onDrink={w => setModal({ type:"drinkWine", payload:w })} onClose={() => setModal(null)} />}
      {modal?.type === "viewWish"  && <WishDetailSheet  wish={modal.payload} onEdit={w => setModal({ type:"editWish", payload:w })} onDelete={() => deleteWish(modal.payload.id)} onMove={() => moveToInventory(modal.payload)} onClose={() => setModal(null)} />}
      {modal?.type === "drinkWine" && <DrinkLogSheet    wine={modal.payload} onSave={(w, d) => markAsDrunk(w, d)} onClose={() => setModal(null)} />}
      {modal?.type === "viewDrunk" && <DrunkEntrySheet  entry={modal.payload} onDelete={() => deleteDrunkEntry(modal.payload.id)} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Inventory View ──────────────────────────────────────────────────────────
function InventoryView({ wines, onView }) {
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState("all");
  const [occFilter, setOccFilter] = useState("all");

  // When a stat card is clicked, toggle the occasion filter
  function handleStatClick(occ) {
    setOccFilter(prev => prev === occ ? "all" : occ);
  }

  const filtered = useMemo(() => wines.filter(w => {
    if (colFilter !== "all" && w.colour !== colFilter) return false;
    if (occFilter !== "all" && w.occasion !== occFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [w.name, w.winery, w.grape, w.country, w.region].some(f => (f||"").toLowerCase().includes(q));
    }
    return true;
  }), [wines, search, colFilter, occFilter]);

  const total = wines.reduce((s, w) => s + Number(w.amount || 0), 0);
  const activePill   = { background:CLR.forest, color:"#fff", border:`1px solid ${CLR.forest}` };
  const inactivePill = { background:"transparent", color:CLR.textMuted, border:`1px solid ${CLR.border}` };

  return (
    <>
      {/* Stats — clickable */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <StatCard
          icon={<IconBottle size={13}/>}
          value={total}
          label="Bottles"
          // Bottles card is not a filter, just informational
        />
        <StatCard
          icon={<IconSun size={13}/>}
          value={wines.filter(w=>w.occasion==="green").length}
          label="Everyday"
          valueColor={CLR.forestMid}
          onClick={() => handleStatClick("green")}
          isActive={occFilter === "green"}
        />
        <StatCard
          icon={<IconStar size={13}/>}
          value={wines.filter(w=>w.occasion==="orange").length}
          label="Special"
          valueColor="#d07820"
          onClick={() => handleStatClick("orange")}
          isActive={occFilter === "orange"}
        />
        <StatCard
          icon={<IconDiamond size={13}/>}
          value={wines.filter(w=>w.occasion==="red").length}
          label="Diamonds"
          valueColor="#c03030"
          onClick={() => handleStatClick("red")}
          isActive={occFilter === "red"}
        />
      </div>

      {/* Active filter hint */}
      {occFilter !== "all" && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, padding:"6px 12px", background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:10, fontSize:"0.76rem", color:CLR.forest, fontFamily:"'Manrope',sans-serif" }}>
          <span>Filtered: <strong>{OCCASION[occFilter]?.label}</strong></span>
          <button onClick={() => setOccFilter("all")} style={{ background:"none", border:"none", color:CLR.textMuted, cursor:"pointer", fontSize:"1rem", padding:0, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Search */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><IconSearch size={13}/></span>
        <input placeholder="Name, winery, grape, country…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:"36px !important" }}/>
      </div>

      {/* Colour filter */}
      <div style={{ display:"flex", gap:6, marginBottom:7, overflowX:"auto", paddingBottom:2 }}>
        {[["all","All colours"],["red","Red"],["white","White"],["rosé","Rosé"],["sparkling","Sparkling"]].map(([v,l]) => (
          <button key={v} className="filter-pill" onClick={() => setColFilter(v)} style={colFilter===v ? activePill : inactivePill}>{l}</button>
        ))}
      </div>

      {/* Occasion filter pills */}
      <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:2 }}>
        {[["all","All occasions"],["green","Everyday"],["orange","Special"],["red","Diamonds"]].map(([v,l]) => (
          <button key={v} className="filter-pill" onClick={() => setOccFilter(v)} style={occFilter===v ? activePill : inactivePill}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign:"center", padding:40, color:CLR.border, fontStyle:"italic" }}>No wines found.</div>}

      {filtered.map(w => (
        <div key={w.id} className="card" onClick={() => onView(w)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"0.9rem", fontWeight:500, color:CLR.textPrimary, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{w.name}</div>
              <div style={{ fontSize:"0.85rem", color:CLR.textMuted, marginBottom:7 }}>{[w.winery, w.year, w.country].filter(Boolean).join(" · ")}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                <ColourPip colour={w.colour}/>
                <Badge occasion={w.occasion}/>
                {w.grape && <span style={{ fontSize:"0.72rem", color:CLR.textFaint, fontStyle:"italic" }}>{w.grape}</span>}
              </div>
              {w.bestBetween && <div style={{ fontSize:"0.7rem", color:CLR.textFaint, marginTop:5 }}>Drinking window: {w.bestBetween}</div>}
            </div>
            {/* ── Bottle icons instead of plain number ── */}
            <div style={{ textAlign:"center", flexShrink:0, background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:10, padding:"8px 10px", minWidth:52, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <BottleIcons amount={w.amount} />
              <div style={{ fontSize:"0.58rem", color:CLR.textMuted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{w.amount} btl.</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ textAlign:"center", fontSize:"0.75rem", color:CLR.border, fontStyle:"italic", marginTop:6 }}>
        {filtered.length} wines · {filtered.reduce((s,w)=>s+Number(w.amount||0),0)} bottles
      </div>
    </>
  );
}

// ── Wishlist View ───────────────────────────────────────────────────────────
function WishlistView({ wishlist, onView }) {
  const [search, setSearch] = useState("");
  const PRIORITY = {
    high:   { label:"Buy urgently",    color:"#c03030", dot:"#c03030" },
    medium: { label:"Medium priority", color:"#d07820", dot:"#d07820" },
    low:    { label:"Someday",         color:CLR.textMuted, dot:CLR.textMuted },
  };

  const filtered = useMemo(() => wishlist.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [w.name, w.winery, w.grape, w.country].some(f => (f||"").toLowerCase().includes(q));
  }), [wishlist, search]);

  return (
    <>
      <div style={{ position:"relative", marginBottom:14 }}>
        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><IconSearch size={13}/></span>
        <input placeholder="Search wines…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:"36px !important" }}/>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:CLR.border, fontStyle:"italic" }}>
          {wishlist.length === 0 ? "Wishlist is empty. Tap + to add a wine." : "No wines found."}
        </div>
      )}

      {filtered.map(w => {
        const pr = PRIORITY[w.priority] || PRIORITY.medium;
        return (
          <div key={w.id} className="card" onClick={() => onView(w)}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:pr.dot, flexShrink:0, display:"inline-block" }}/>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"0.9rem", fontWeight:500, color:CLR.textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{w.name || "Unbenannt"}</div>
                </div>
                <div style={{ fontSize:"0.85rem", color:CLR.textMuted, marginBottom:7 }}>{[w.winery, w.year, w.country].filter(Boolean).join(" · ")}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, alignItems:"center" }}>
                  {w.colour && <ColourPip colour={w.colour}/>}
                  {w.grape && <span style={{ fontSize:"0.72rem", color:CLR.textFaint, fontStyle:"italic" }}>{w.grape}</span>}
                  {w.price && <span style={{ fontSize:"0.8rem", color:CLR.forest, fontFamily:"'Manrope',sans-serif", fontWeight:600, background:CLR.iconCircle, padding:"1px 8px", borderRadius:6, border:`0.5px solid ${CLR.border}` }}>{w.price}</span>}
                </div>
                {w.tastingNotes && <div style={{ fontSize:"0.78rem", color:CLR.textFaint, fontStyle:"italic", marginTop:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{w.tastingNotes}"</div>}
              </div>
              <div style={{ fontSize:"0.68rem", color:pr.color, fontFamily:"'Manrope',sans-serif", whiteSpace:"nowrap", marginTop:2, flexShrink:0 }}>{pr.label}</div>
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
  const { results, loading, error, search, clear } = useAISearch();

  return (
    <div style={{ padding:"14px 20px", borderBottom:`0.5px solid ${CLR.border}`, background:CLR.iconCircle }}>
      <label className="label">AI Search — wine name or description</label>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <input placeholder="e.g. Barolo 2019, Grüner Veltliner Kamptal…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && search(query)} style={{ flex:1 }}/>
        <button className="btn btn-primary" onClick={() => search(query)} disabled={loading} style={{ padding:"11px 16px", whiteSpace:"nowrap", flexShrink:0 }}>
          {loading ? <Spinner/> : "Suchen"}
        </button>
      </div>
      {loading && <div style={{ textAlign:"center", color:CLR.textMuted, fontStyle:"italic", fontSize:"0.88rem", padding:"6px 0" }}>AI is searching for wine info…</div>}
      {error && <div style={{ textAlign:"center", color:"#c03030", fontSize:"0.82rem", padding:"4px 0 8px", fontStyle:"italic" }}>{error}</div>}
      {results.length > 0 && (
        <div style={{ border:`0.5px solid ${CLR.border}`, borderRadius:12, overflow:"hidden", marginBottom:8, background:CLR.cardBg }}>
          {results.map((r, i) => (
            <div key={i} className="suggestion" onClick={() => { onApply(r); clear(); }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"0.85rem", color:CLR.textPrimary, marginBottom:2 }}>{r.name}{r.year ? ` · ${r.year}` : ""}</div>
              <div style={{ fontSize:"0.8rem", color:CLR.textMuted, marginBottom:3 }}>{[r.winery, r.country, r.region].filter(Boolean).join(" · ")}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                {r.grape && <span style={{ fontSize:"0.72rem", color:CLR.textFaint, fontStyle:"italic" }}>{r.grape}</span>}
                {r.price && <span style={{ fontSize:"0.75rem", color:CLR.forest, fontWeight:600 }}>{r.price}</span>}
                {r.bestBetween && <span style={{ fontSize:"0.72rem", color:CLR.textFaint }}>Drinking window: {r.bestBetween}</span>}
              </div>
              {r.description && <div style={{ fontSize:"0.78rem", color:CLR.textMuted, marginTop:4, fontStyle:"italic", lineHeight:1.4 }}>{r.description}</div>}
            </div>
          ))}
        </div>
      )}
      <button onClick={onDismiss} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"0.78rem", cursor:"pointer", fontFamily:"'Manrope',sans-serif", textDecoration:"underline", padding:0 }}>
        → Enter manually without AI
      </button>
    </div>
  );
}

// ── Wine Form Sheet ─────────────────────────────────────────────────────────
function WineFormSheet({ title, init, onSave, onClose, isNew }) {
  const [form, setForm] = useState({ ...BLANK_WINE, ...init });
  const [showAI, setShowAI] = useState(!!isNew);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

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
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 20px 14px", borderBottom:`0.5px solid ${CLR.border}` }}>
          <h2 style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1rem", color:CLR.forest, margin:0, letterSpacing:"0.05em" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer", padding:"0 4px" }}>×</button>
        </div>

        {showAI
          ? <AISearchPanel onApply={applyAI} onDismiss={() => setShowAI(false)}/>
          : (
            <button onClick={() => setShowAI(true)} style={{ display:"flex", alignItems:"center", gap:8, margin:"12px 20px 0", background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, color:CLR.forest, borderRadius:10, padding:"9px 14px", cursor:"pointer", fontSize:"0.8rem", fontFamily:"'Manrope',sans-serif", width:"calc(100% - 40px)" }}>
              <span style={{ fontSize:14 }}>✦</span> Open AI wine search
            </button>
          )
        }

        <div style={{ padding:"14px 20px", display:"grid", gap:11 }}>
          {[["Name","name","text"],["Winery","winery","text"],["Vintage","year","number"],["Country","country","text"],["Region / Appellation","region","text"],["Grape(s)","grape","text"],["Bottles","amount","number"],["Drinking window (e.g. 2025–2032)","bestBetween","text"]].map(([l,k,t]) => (
            <div key={k}><label className="label">{l}</label><input type={t} value={form[k]||""} onChange={e => set(k, e.target.value)}/></div>
          ))}
          <div>
            <label className="label">Farbe</label>
            <select value={form.colour} onChange={e => set("colour", e.target.value)}>
              <option value="red">Red</option>
              <option value="white">White</option>
              <option value="rosé">Rosé</option>
              <option value="sparkling">Sparkling</option>
            </select>
          </div>
          <div>
            <label className="label">Anlass</label>
            <select value={form.occasion} onChange={e => set("occasion", e.target.value)}>
              <option value="green">Everyday – open anytime</option>
              <option value="orange">Special – for great evenings</option>
              <option value="red">Diamonds – only for grand occasions</option>
            </select>
          </div>
          <div><label className="label">Notes & description</label><textarea rows={3} value={form.rationale||""} onChange={e => set("rationale", e.target.value)} placeholder="Aromas, pairings, personal impressions…"/></div>
          <div style={{ display:"flex", gap:10, paddingBottom:4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex:1 }}>{saving ? <Spinner/> : "Save"}</button>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wine Detail Sheet ───────────────────────────────────────────────────────
function WineDetailSheet({ wine, onEdit, onDelete, onDrink, onClose }) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1.05rem", fontWeight:500, color:CLR.textPrimary, marginBottom:4, lineHeight:1.3 }}>{wine.name}</div>
            <div style={{ fontSize:"0.88rem", color:CLR.textMuted }}>{[wine.winery, wine.year].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"14px 20px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <ColourPip colour={wine.colour}/><Badge occasion={wine.occasion}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[["Country",wine.country],["Region",wine.region],["Grape",wine.grape],["Drinking window",wine.bestBetween],["Bottles",wine.amount]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} style={{ background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:9, padding:"9px 12px" }}>
                <div className="label" style={{ marginBottom:3 }}>{l}</div>
                <div style={{ color:CLR.textPrimary, fontSize:"0.92rem" }}>{v}</div>
              </div>
            ))}
          </div>
          {wine.rationale && (
            <div style={{ background:CLR.cardBg, border:`0.5px solid ${CLR.border}`, borderRadius:10, padding:"11px 14px", marginBottom:14 }}>
              <div className="label">Notes</div>
              <div style={{ color:CLR.textMuted, fontStyle:"italic", fontSize:"0.92rem", lineHeight:1.6 }}>{wine.rationale}</div>
            </div>
          )}
          <button className="btn btn-move" onClick={() => onDrink(wine)} style={{ width:"100%", marginBottom:9 }}>
            🍷 Drink this bottle
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary" onClick={() => onEdit(wine)} style={{ flex:1 }}>Edit</button>
            <button className="btn btn-danger" onClick={() => confirmDel ? onDelete() : setConfirmDel(true)} style={{ flex:1 }}>
              {confirmDel ? "Sure?" : "Delete"}
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
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

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
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 20px 14px", borderBottom:`0.5px solid ${CLR.border}` }}>
          <h2 style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1rem", color:CLR.forest, margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>

        {showAI
          ? <AISearchPanel onApply={applyAI} onDismiss={() => setShowAI(false)}/>
          : (
            <button onClick={() => setShowAI(true)} style={{ display:"flex", alignItems:"center", gap:8, margin:"12px 20px 0", background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, color:CLR.forest, borderRadius:10, padding:"9px 14px", cursor:"pointer", fontSize:"0.8rem", fontFamily:"'Manrope',sans-serif", width:"calc(100% - 40px)" }}>
              <span style={{ fontSize:14 }}>✦</span> Open AI wine search
            </button>
          )
        }

        <div style={{ padding:"14px 20px", display:"grid", gap:11 }}>
          {[["Name","name","text"],["Winery","winery","text"],["Vintage","year","number"],["Country","country","text"],["Region","region","text"],["Grape(s)","grape","text"],["Market price (e.g. CHF 38)","price","text"]].map(([l,k,t]) => (
            <div key={k}><label className="label">{l}</label><input type={t} value={form[k]||""} onChange={e => set(k, e.target.value)}/></div>
          ))}
          <div>
            <label className="label">Farbe</label>
            <select value={form.colour} onChange={e => set("colour", e.target.value)}>
              <option value="red">Red</option>
              <option value="white">White</option>
              <option value="rosé">Rosé</option>
              <option value="sparkling">Sparkling</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option value="high">Buy urgently</option>
              <option value="medium">Medium priority</option>
              <option value="low">Someday</option>
            </select>
          </div>
          <div><label className="label">Geschmacksnotizen – warum möchte ich diesen Wein?</label><textarea rows={2} placeholder="e.g. bold, tannic, dark fruit, spice…" value={form.tastingNotes||""} onChange={e => set("tastingNotes", e.target.value)}/></div>
          <div><label className="label">Notes (where to buy, occasion…)</label><textarea rows={2} value={form.notes||""} onChange={e => set("notes", e.target.value)}/></div>
          <div style={{ display:"flex", gap:10, paddingBottom:4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex:1 }}>{saving ? <Spinner/> : "Save"}</button>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
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
    high:   { label:"Buy urgently",    color:"#c03030" },
    medium: { label:"Medium priority", color:"#d07820" },
    low:    { label:"Someday",         color:CLR.textMuted },
  };
  const pr = PRIORITY[wish.priority] || PRIORITY.medium;

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1.05rem", fontWeight:500, color:CLR.textPrimary, marginBottom:4 }}>{wish.name}</div>
            <div style={{ fontSize:"0.88rem", color:CLR.textMuted }}>{[wish.winery, wish.year].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"14px 20px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
            {wish.colour && <ColourPip colour={wish.colour}/>}
            <span style={{ fontSize:"0.75rem", color:pr.color, fontFamily:"'Manrope',sans-serif" }}>● {pr.label}</span>
            {wish.price && <span style={{ fontSize:"0.9rem", color:CLR.forest, fontFamily:"'Manrope',sans-serif", fontWeight:600, background:CLR.iconCircle, padding:"2px 10px", borderRadius:7, border:`0.5px solid ${CLR.border}` }}>{wish.price}</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:12 }}>
            {[["Country",wish.country],["Region",wish.region],["Grape",wish.grape]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} style={{ background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:9, padding:"8px 12px" }}>
                <div className="label" style={{ marginBottom:3 }}>{l}</div>
                <div style={{ color:CLR.textPrimary, fontSize:"0.92rem" }}>{v}</div>
              </div>
            ))}
          </div>
          {wish.tastingNotes && (
            <div style={{ background:CLR.cardBg, border:`0.5px solid ${CLR.border}`, borderRadius:10, padding:"11px 14px", marginBottom:9 }}>
              <div className="label">Geschmack & Warum</div>
              <div style={{ color:CLR.textMuted, fontStyle:"italic", fontSize:"0.9rem", lineHeight:1.5 }}>{wish.tastingNotes}</div>
            </div>
          )}
          {wish.notes && (
            <div style={{ background:CLR.cardBg, border:`0.5px solid ${CLR.border}`, borderRadius:10, padding:"11px 14px", marginBottom:12 }}>
              <div className="label">Notes</div>
              <div style={{ color:CLR.textMuted, fontSize:"0.9rem", lineHeight:1.5 }}>{wish.notes}</div>
            </div>
          )}
          <button className="btn btn-move" onClick={onMove} style={{ width:"100%", marginBottom:9 }}>
            ✓ Purchased – move to cellar
          </button>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary" onClick={() => onEdit(wish)} style={{ flex:1 }}>Edit</button>
            <button className="btn btn-danger" onClick={() => confirmDel ? onDelete() : setConfirmDel(true)} style={{ flex:1 }}>
              {confirmDel ? "Sure?" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drunk Log View ──────────────────────────────────────────────────────────
function DrunkLogView({ drunkLog, onView }) {
  const STARS = [1,2,3,4,5];

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"0.7rem", letterSpacing:"0.1em", color:CLR.textMuted, textTransform:"uppercase" }}>Graveyard</div>
          <div style={{ fontSize:"0.85rem", color:CLR.textFaint, marginTop:2 }}>{drunkLog.length} bottles consumed</div>
        </div>
      </div>

      {drunkLog.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:CLR.border, fontStyle:"italic" }}>
          Nothing here yet. Open a bottle and tap "Drink it" to log it!
        </div>
      )}

      {drunkLog.map(e => (
        <div key={e.id} className="card" onClick={() => onView(e)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"0.9rem", fontWeight:500, color:CLR.textPrimary, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</div>
              <div style={{ fontSize:"0.82rem", color:CLR.textMuted, marginBottom:6 }}>{[e.winery, e.year, e.country].filter(Boolean).join(" · ")}</div>
              {e.rating && (
                <div style={{ display:"flex", gap:2, marginBottom:5 }}>
                  {STARS.map(s => (
                    <span key={s} style={{ fontSize:"0.75rem", color: s <= e.rating ? "#e8c020" : CLR.borderLight }}>★</span>
                  ))}
                </div>
              )}
              {e.tasting_note && (
                <div style={{ fontSize:"0.78rem", color:CLR.textFaint, fontStyle:"italic", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>"{e.tasting_note}"</div>
              )}
            </div>
            {/* ── Skull icon for graveyard entries ── */}
            <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ fontSize:"0.72rem", color:CLR.textMuted, background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:7, padding:"3px 8px", whiteSpace:"nowrap" }}>
                {new Date(e.drunk_at).toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" })}
              </div>
              <span style={{ fontSize:"1.3rem", lineHeight:1 }}>💀</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Drink Log Sheet ─────────────────────────────────────────────────────────
function DrinkLogSheet({ wine, onSave, onClose }) {
  const [form, setForm] = useState({ rating: "", tasting_note: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const STARS = [1, 2, 3, 4, 5];

  async function handleSave() {
    setSaving(true);
    await onSave(wine, form);
    setSaving(false);
  }

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"20px 20px 14px", borderBottom:`0.5px solid ${CLR.border}` }}>
          <div>
            <h2 style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1rem", color:CLR.forest, margin:"0 0 3px", letterSpacing:"0.05em" }}>Drink this bottle</h2>
            <div style={{ fontSize:"0.85rem", color:CLR.textMuted }}>{wine.name}{wine.year ? ` · ${wine.year}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ padding:"16px 20px", display:"grid", gap:14 }}>
          <div>
            <label className="label">Rating</label>
            <div style={{ display:"flex", gap:10, padding:"8px 0" }}>
              {STARS.map(s => (
                <button key={s} onClick={() => set("rating", form.rating === s ? "" : s)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:0, fontSize:"2rem", color: s <= Number(form.rating) ? "#e8c020" : CLR.borderLight, transition:"color 0.15s" }}>★</button>
              ))}
            </div>
            {form.rating && (
              <button onClick={() => set("rating", "")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.73rem", color:CLR.textFaint, fontFamily:"'Manrope',sans-serif", textDecoration:"underline", padding:0 }}>
                Clear rating
              </button>
            )}
          </div>

          <div>
            <label className="label">Degustationsnotiz</label>
            <textarea rows={4} value={form.tasting_note} onChange={e => set("tasting_note", e.target.value)}
              placeholder="Aromas, structure, finish, food pairing, personal impressions…"/>
          </div>

          <div style={{ background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:9, padding:"10px 14px", fontSize:"0.82rem", color:CLR.textMuted }}>
            {Number(wine.amount) > 1
              ? `Bottle count reduced from ${wine.amount} to ${Number(wine.amount) - 1}.`
              : "This last bottle will be removed from the cellar."
            }
          </div>

          <div style={{ display:"flex", gap:10, paddingBottom:4 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex:1 }}>
              {saving ? <Spinner/> : "Another one for the Graveyard 💀"}
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drunk Entry Detail Sheet ────────────────────────────────────────────────
function DrunkEntrySheet({ entry, onDelete, onClose }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const STARS = [1,2,3,4,5];
  const COLOUR_MAP = { red:"#7c1d1d", white:"#d4a84b", rosé:"#e879a0", sparkling:"#e8c020" };

  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <span style={{ fontSize:"1.2rem" }}>💀</span>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1.05rem", fontWeight:500, color:CLR.textPrimary, lineHeight:1.3 }}>{entry.name}</div>
            </div>
            <div style={{ fontSize:"0.85rem", color:CLR.textMuted }}>{[entry.winery, entry.year].filter(Boolean).join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:CLR.textMuted, fontSize:"1.5rem", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ padding:"14px 20px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:"0.78rem", background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:7, padding:"3px 10px", color:CLR.textMuted }}>
              {new Date(entry.drunk_at).toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" })}
            </span>
            {entry.colour && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                <span style={{ width:9, height:9, borderRadius:"50%", background:COLOUR_MAP[entry.colour] || "#888", display:"inline-block" }}/>
                <span style={{ fontSize:"0.82rem", color:CLR.textMuted }}>{entry.colour === "sparkling" ? "Sparkling" : entry.colour === "red" ? "Red" : entry.colour === "white" ? "White" : "Rosé"}</span>
              </span>
            )}
          </div>

          {entry.rating && (
            <div style={{ marginBottom:14 }}>
              <div className="label">Rating</div>
              <div style={{ display:"flex", gap:4 }}>
                {STARS.map(s => <span key={s} style={{ fontSize:"1.4rem", color: s <= entry.rating ? "#e8c020" : CLR.borderLight }}>★</span>)}
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[["Country", entry.country],["Region", entry.region],["Grape", entry.grape]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} style={{ background:CLR.iconCircle, border:`0.5px solid ${CLR.border}`, borderRadius:9, padding:"9px 12px" }}>
                <div className="label" style={{ marginBottom:3 }}>{l}</div>
                <div style={{ color:CLR.textPrimary, fontSize:"0.9rem" }}>{v}</div>
              </div>
            ))}
          </div>

          {entry.tasting_note && (
            <div style={{ background:CLR.cardBg, border:`0.5px solid ${CLR.border}`, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
              <div className="label">Degustationsnotiz</div>
              <div style={{ color:CLR.textMuted, fontStyle:"italic", fontSize:"0.92rem", lineHeight:1.6 }}>{entry.tasting_note}</div>
            </div>
          )}

          <button className="btn btn-danger" onClick={() => confirmDel ? onDelete() : setConfirmDel(true)} style={{ width:"100%" }}>
            {confirmDel ? "Sure?" : "Eintrag löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}
