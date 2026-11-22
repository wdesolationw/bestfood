const IMGS = DATA.imgs, R = DATA.recipes, LANGS = DATA.langs, ORDER = DATA.order, FOOD = DATA.food, SUBS = DATA.subs;
const CLASSIC = DATA.classic, ALLERG = DATA.allerg, SHOPCAT = DATA.shopcat, VEGL = DATA.veglevel, PRESETS = DATA.presets, CUIS = DATA.cuisines, COACH = DATA.coach;
const RATIO = {}; DATA.ratio.forEach(([a, b, r]) => RATIO[a + ">" + b] = r);
const $ = s => document.querySelector(s);
const store = {get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }};
const load = (k, d) => { try { const v = JSON.parse(store.get(k)); return v == null ? d : v; } catch (e) { return d; } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

/* ---------- language ---------- */
let lang = (() => {
  const s = store.get("brfy-lang"); if (s && LANGS[s]) return s;
  const nav = (navigator.languages || [navigator.language || "en"]).map(x => String(x).slice(0, 2).toLowerCase());
  for (const n of nav) { if (LANGS[n]) return n; if (n === "be" && LANGS.ru) return "ru"; }
  return LANGS.en ? "en" : ORDER[0];
})();
const L = () => LANGS[lang];
const t = () => L().ui;
const fname = k => L().food[k] || LANGS.en.food[k] || k;
const NUMC = () => ["en", "ka"].includes(lang) ? "." : ",";
const fnum = v => { const s = Math.abs(v - Math.round(v)) < .05 ? String(Math.round(v)) : v.toFixed(1); return s.replace(".", NUMC()); };
function RX(r) {
  const x = L().rec[r.id] || LANGS.en.rec[r.id];
  const ing = x[2] || r.items.map(([i, k, g]) => itemLine(k, g));
  return {title: x[0], serv: x[1] || `${r.n} ${t().portions}`, ing, steps: x[3], storage: x[4], note: x[5]};
}
function itemLine(k, g) { const T = t(); let s = `${fname(k)}`; if (FOOD[k] && (FOOD[k][0] > 0 || g > 0) && !["spices", "khmeli"].includes(k)) s += `: ${fnum(rg(g))} ${T.grams}`; if (k === "egg" && g > 0) s += ` (${fnum(Math.max(1, Math.round(g / 55)))} ${T.pcs})`; return s; }
const catName = i => L().cats[i][0], catShort = i => L().cats[i][1], catSub = i => L().cats[i][2];
/* ---------- theme ---------- */
const PAL = {mint: ["#1D5A4B", "#5FC4A6"], ocean: ["#1F5FA8", "#6AA8F0"], berry: ["#A3245A", "#F07AAE"], sunset: ["#B4471A", "#FF9A5C"], lavender: ["#5B3FB0", "#A994F5"], graphite: ["#2E3338", "#D5DBE0"]};
let look = Object.assign({mode: "auto", pal: "mint", custom: ""}, load("brfy-look", {}));
const hex2rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = a => "#" + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
function rgb2hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100]; }
function hsl(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]); }
const lum = hx => { const c = hex2rgb(hx).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const mix = (a, b, p) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v * p + y[i] * (1 - p))); };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function isDark() {
  if (look.mode !== "auto") return look.mode === "dark";
  const a = document.documentElement.getAttribute("data-theme");
  if (a === "dark") return true; if (a === "light") return false;
  return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
}
function applyLook() {
  const dark = isDark();
  let acc = look.custom || PAL[look.pal][dark ? 1 : 0];
  let [h, s, l] = rgb2hsl(hex2rgb(acc));
  if (look.custom) {
    if (dark) { while (cr(acc, "#15201C") < 5 && l < 92) { l += 3; acc = hsl(h, s, l); } }
    else { while (cr(acc, "#FFFFFF") < 4.5 && l > 12) { l -= 3; acc = hsl(h, s, l); } }
  }
  const k = look.pal === "graphite" && !look.custom ? .25 : 1;
  const T = dark
    ? {bg: hsl(h, 25 * k, 7), surface: hsl(h, 20 * k, 11), ink: hsl(h, 18 * k, 92), muted: hsl(h, 12 * k, 63), line: hsl(h, 15 * k, 21), hot: "#FF8A66", hotSoft: "#3A2119"}
    : {bg: hsl(h, 28 * k, 96), surface: "#FFFFFF", ink: hsl(h, 30 * k, 11), muted: hsl(h, 14 * k, 38), line: hsl(h, 18 * k, 85), hot: "#D9482B", hotSoft: "#FBE7E1"};
  const st = document.documentElement.style;
  st.setProperty("--bg", T.bg); st.setProperty("--surface", T.surface); st.setProperty("--ink", T.ink); st.setProperty("--muted", T.muted);
  st.setProperty("--line", T.line); st.setProperty("--hot", T.hot); st.setProperty("--hot-soft", T.hotSoft);
  st.setProperty("--accent", acc); st.setProperty("--accent-ink", cr("#FFFFFF", acc) >= 4.5 ? "#FFFFFF" : hsl(h, 30, 8));
  st.setProperty("--soft", mix(acc, T.surface, dark ? .18 : .12)); st.colorScheme = dark ? "dark" : "light";
}
function saveLook() { store.set("brfy-look", JSON.stringify(look)); applyLook(); }
applyLook();
if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme: dark)"); (mq.addEventListener ? mq.addEventListener("change", applyLook) : mq.addListener(applyLook)); }
new MutationObserver(applyLook).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});



/* ---------- nutrition ---------- */
const mac = (key, g) => { const f = FOOD[key] || [0, 0, 0, 0]; return f.map(v => v * g / 100); };
const add4 = (a, b, m = 1) => a.map((v, i) => v + (b[i] || 0) * m);
const ratio = (a, b) => RATIO[a + ">" + b] || 1;
const rg = g => g >= 20 ? Math.round(g / 5) * 5 : g >= 3 ? Math.round(g) : Math.round(g * 10) / 10;
const r0 = v => Math.round(v);
const fmtM = m => `${r0(m[0])} ${t().kcal} · ${t().p} ${r0(m[1])} · ${t().fL} ${r0(m[2])} · ${t().cL} ${r0(m[3])}`;

/* ---------- state ---------- */
const state = {fopen: false, cat: -1, quick: false, cuis: null, veg: "any", base: null, kcal: "any", prot: "any", sort: "def", q: "", fav: false, protOn: {}, mode: {}, serv: {},
  date: null, delArm: false, planDay: (new Date().getDay() + 6) % 7, presetArm: null, showAll: false};
let favs = new Set(load("brfy-fav", [])), done = {};
const saveFav = () => store.set("brfy-fav", JSON.stringify([...favs]));
let swaps = load("brfy-swaps", {});
const saveSwaps = () => store.set("brfy-swaps", JSON.stringify(swaps));
let diary = load("brfy-day", {}), goal = Object.assign({k: "", p: "", f: "", c: ""}, load("brfy-goal", {})), dishes = load("brfy-dishes", []);
let prof = Object.assign({sex: "f", age: "", h: "", w: "", act: "1.375", aim: "lose", groups: [], excl: [], defMode: "fit"}, load("brfy-prof", {}));
let plan = load("brfy-plan", null) || {d: [0, 1, 2, 3, 4, 5, 6].map(() => ({b: [], l: [], d: [], s: []}))};
let shop = Object.assign({items: {}, done: {}, notes: []}, load("brfy-shop", {}));
let weights = load("brfy-weight", {}), water = load("brfy-water", {});
const saveDiary = () => store.set("brfy-day", JSON.stringify(diary));
const saveDishes = () => store.set("brfy-dishes", JSON.stringify(dishes));
const saveProf = () => store.set("brfy-prof", JSON.stringify(prof));
const savePlan = () => store.set("brfy-plan", JSON.stringify(plan));
const saveShop = () => store.set("brfy-shop", JSON.stringify(shop));
const saveW = () => { store.set("brfy-weight", JSON.stringify(weights)); store.set("brfy-water", JSON.stringify(water)); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayIso = () => iso(new Date());
state.date = todayIso();
let draft = null;

/* ---------- not-eat list ---------- */
function bannedSet() { const s = new Set(prof.excl); prof.groups.forEach(g => (ALLERG[g] || []).forEach(k => s.add(k))); return s; }
let BANNED = bannedSet();
const banned = k => BANNED.has(k);

/* ---------- recipe versions, swaps, scaling ---------- */
const modeOf = r => state.mode[r.id] || prof.defMode || "fit";
const servOf = r => state.serv[r.id] || r.n;
function bestAlt(r, key, g, avoid) {
  const alts = (SUBS[key] || []).filter(k => !avoid.has(k));
  let best = null, bs = 1e9;
  for (const k of alts) { const d = add4(mac(k, g * ratio(key, k)), mac(key, g), -1); const s = Math.abs(d[1]) * 4 + Math.abs(d[0]) / 8; if (s < bs) { bs = s; best = k; } }
  return best;
}
function effItems(r, mode) {
  mode = mode || modeOf(r); const sw = swaps[r.id] || {};
  return r.items.map(([idx, key0, g0]) => {
    let key = key0, g = g0, why = null;
    if (mode === "classic" && CLASSIC[key0]) { const [k2, m] = CLASSIC[key0]; if (k2 !== key0 || m !== 1) { key = k2; g = g0 * m; why = "classic"; } }
    if (sw[idx]) { key = sw[idx]; g = g0 * ratio(key0, key); why = "swap"; }
    if (banned(key) && g > 0) { const a = bestAlt(r, key0, g0, BANNED); if (a) { key = a; g = g0 * ratio(key0, a); why = "allerg"; } else why = "warn"; }
    return {idx, key0, g0, key, g, why};
  });
}
function recipeMacros(r, mode) {
  mode = mode || modeOf(r);
  const b = r.var ? (mode === "fit" && state.protOn[r.id] ? r.var.on : r.var.off) : r.base;
  let m = [b.k || 0, b.p || 0, b.f || 0, b.c || 0];
  effItems(r, mode).forEach(e => { if (e.key !== e.key0 || e.g !== e.g0) m = add4(m, add4(mac(e.key, e.g), mac(e.key0, e.g0), -1).map(v => v / r.n)); });
  return m.map(v => Math.max(0, v));
}
const hasSwaps = r => Object.keys(swaps[r.id] || {}).length > 0;
const warnOf = r => effItems(r).filter(e => e.why === "warn").map(e => e.key);
const autoOf = r => effItems(r).some(e => e.why === "allerg");
const FR = {"½": ".5", "¼": ".25", "¾": ".75", "⅓": ".33", "⅔": ".67"};
function scaleText(s, k) {
  if (Math.abs(k - 1) < 1e-6) return s;
  return s.replace(/\s*\([^)]*\)/g, "").replace(/(\d*)([½¼¾⅓⅔])/g, (m, a, f) => (a ? +a : 0) + +FR[f] + "")
    .replace(/(\d+(?:[.,]\d+)?)(?!\s*[%°×x])(?![\d])/g, (m, n) => fnum(rg(parseFloat(n.replace(",", ".")) * k)));
}

/* ---------- search & filters ---------- */
const BASES = ["chicken", "beef", "turkey", "fish", "eggs", "veg"];
const CATORDER = [0, 1, 7, 4, 8, 2, 3, 9, 5, 10, 11, 6];
const CYR = ["ru", "uk", "kk"];
function stem(w) { if (CYR.includes(lang)) return w.length > 6 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w; return w.length > 4 ? w.slice(0, -1) : w; }
const norm = s => String(s).toLowerCase().replace(/ё/g, "е").replace(/<[^>]+>/g, " ").normalize("NFD").replace(/[̀-ͯ]/g, "");
function hay(r) {
  r._h = r._h || {};
  if (!r._h[lang]) { const x = RX(r); r._h[lang] = norm([x.title, x.ing.join(" "), r.filters.map(f => L().bases[f]).join(" "), catName(r.cat), r.cuis.map(c => L().ui.cu[c]).join(" "), lang === "ru" ? r.tags : ""].join(" ")); }
  return r._h[lang];
}
function matchQ(r, q) { const ws = norm(q).split(/[\s,]+/).filter(w => w.length > 1 && !L().stop.includes(w)); return ws.every(w => hay(r).includes(stem(w))); }
const fitsMe = r => !warnOf(r).length;
function filtered(noBan) {
  let A = R.filter(r => (state.cat < 0 || r.cat === state.cat) && (!state.quick || r.time <= 25) && (!state.cuis || r.cuis.includes(state.cuis)) &&
    (!state.fav || favs.has(r.id)) && (!state.base || r.filters.includes(state.base)) && (state.veg === "any" || r.veg >= (state.veg === "vegan" ? 2 : 1)) &&
    (state.kcal === "any" || (state.kcal === "300" ? r.base.k <= 300 : state.kcal === "500" ? r.base.k > 300 && r.base.k <= 500 : r.base.k > 500)) &&
    (state.prot === "any" || (r.base.p || 0) >= +state.prot) && (!state.q || matchQ(r, state.q)));
  if (!noBan && BANNED.size && !state.showAll) A = A.filter(fitsMe);
  if (state.sort === "p") A.sort((a, b) => (b.base.p || 0) - (a.base.p || 0));
  if (state.sort === "k") A.sort((a, b) => a.base.k - b.base.k);
  if (state.sort === "t") A.sort((a, b) => a.time - b.time);
  return A;
}
const inCat = i => R.filter(r => r.cat === i).length;
function findFood(q) {
  q = norm(q.trim()); if (!q) return [];
  const keys = Object.keys(FOOD);
  const hit = keys.filter(k => norm(fname(k)).includes(q) || norm(LANGS.en.food[k]).includes(q));
  hit.sort((a, b) => norm(fname(a)).indexOf(q) - norm(fname(b)).indexOf(q));
  return hit.slice(0, 8);
}
let toastT = null;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2200); }
const recImg = r => r.kind && r.kind.startsWith("svg:") ? dishSVG(r.items.map(([i, k, g]) => ({key: k, g})), r.kind.slice(4), "r" + r.id) : `<img src="${IMGS[r.kind]}" alt="" loading="lazy">`;
const timeLbl = r => r.time >= 600 ? "" : `<span class="pill o">${r.time} ${esc(t().min)}</span>`;
const vegLbl = r => r.veg === 2 ? `<span class="pill vg">${esc(t().vegan)}</span>` : r.veg === 1 ? `<span class="pill vg">${esc(t().vegetarian)}</span>` : "";

/* ---------- chrome & list ---------- */
function chrome(route) {
  const T = t();
  document.documentElement.lang = lang;
  $("#q").placeholder = T.ph; $("#q").setAttribute("aria-label", T.ph);
  $("#qx").setAttribute("aria-label", T.clear); $("#tabs").setAttribute("aria-label", T.cats); $("#foot").textContent = T.foot;
  $("#langCode").textContent = lang.toUpperCase(); $("#langBtn").setAttribute("aria-label", T.langT); $("#lookBtn").setAttribute("aria-label", T.look);
  const names = {r: T.navR, day: T.navDay, plan: T.navPlan, mine: T.navMine, me: T.navMe};
  document.querySelectorAll("[data-nav]").forEach(a => { a.textContent = names[a.dataset.nav]; if (a.dataset.nav === route) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
}
function renderTabs() {
  const T = t(), allOn = state.cat < 0 && !state.fav && !state.quick;
  const tab = (attr, on, label, n) => `<button class="tab" ${attr} aria-pressed="${on}">${esc(label)}${n != null ? `<small>${n}</small>` : ""}</button>`;
  $("#tabs").innerHTML = tab('data-c="-1"', allOn, T.all, R.length) + tab('data-quick="1"', state.quick, T.quickT, R.filter(r => r.time <= 25).length) +
    CATORDER.map(i => tab(`data-c="${i}"`, state.cat === i && !state.fav && !state.quick, catShort(i), inCat(i))).join("") +
    `<a class="tab" href="#prep">${esc(T.prepT)}</a>` + tab('data-fav="1"', state.fav, T.fav, favs.size) + `<a class="tab" href="#zameny" id="subsLink">${esc(T.sub)}</a>`;
}
function renderList() {
  const T = t(), A = filtered(), hidden = BANNED.size && !state.showAll ? filtered(true).length - A.length : 0;
  let h = "";
  h += `<div class="quick" role="group" aria-label="${esc(T.cuisT)}"><span class="qlbl">${esc(T.cuisT)}:</span>` + [null, ...CUIS].map(c => `<button class="chip" data-cu="${c || ""}" aria-pressed="${state.cuis === c}">${esc(c ? T.cu[c] : T.allCu)}</button>`).join("") + `</div>`;
  const nf = (state.base ? 1 : 0) + (state.kcal !== "any" ? 1 : 0) + (state.prot !== "any" ? 1 : 0) + (state.sort !== "def" ? 1 : 0) + (state.veg !== "any" ? 1 : 0);
  if (!state.q) h += `<div class="quick" role="group" aria-label="${esc(T.quickl)}">` + L().quick.map(w => `<button class="chip" data-w="${esc(w)}" aria-pressed="false">${esc(w)}</button>`).join("") + `</div>`;
  h += `<details class="fl" id="fl"${state.fopen ? " open" : ""}><summary>${esc(T.fl)} ${nf ? `<b>${nf}</b>` : ""}</summary>
    <div class="filters">
    <label>${esc(T.fk)}<select id="fk"><option value="any">${esc(T.any)}</option><option value="300">${esc(T.k300)}</option><option value="500">${esc(T.k500)}</option><option value="600">${esc(T.k600)}</option></select></label>
    <label>${esc(T.fp)}<select id="fp"><option value="any">${esc(T.anyp)}</option><option value="20">${esc(T.p20)}</option><option value="30">${esc(T.p30)}</option><option value="40">${esc(T.p40)}</option></select></label>
    <label>${esc(T.fs)}<select id="fs"><option value="def">${esc(T.s0)}</option><option value="p">${esc(T.sp)}</option><option value="k">${esc(T.sk)}</option><option value="t">${esc(T.st0)}</option></select></label>
    <label>${esc(T.vegF)}<select id="fv"><option value="any">${esc(T.any)}</option><option value="veg">${esc(T.vegetarian)}</option><option value="vegan">${esc(T.vegan)}</option></select></label></div>
    <div class="chips" role="group" aria-label="${esc(T.base)}">` + BASES.map(b => `<button class="chip" data-b="${b}" aria-pressed="${state.base === b}">${esc(L().bases[b])}</button>`).join("") + `</div></details>`;
  h += (state.cat >= 0 && !state.fav && !state.quick) ? `<p class="sub">${esc(catSub(state.cat))}</p>` : `<p class="sub">${esc(T.found)}${A.length}</p>`;
  if (hidden) h += `<p class="hint">${esc(T.hiddenN.replace("{n}", hidden))} <button class="linkbtn" id="showAll" style="padding:0">${esc(T.showAll)}</button></p>`;
  if (!A.length) h += `<div class="empty"><b>${esc(T.none)}</b>${esc(T.none2)}<br><br><button class="btn" id="reset">${esc(T.reset)}</button></div>`;
  else h += `<div class="list">` + A.map(r => {
    const x = RX(r), m = recipeMacros(r), w = warnOf(r);
    const vn = r.var ? `<span class="pill o">${esc(T.plus)}</span>` : "", sw = hasSwaps(r) || autoOf(r) ? `<span class="pill o">⇄</span>` : "", wn = w.length ? `<span class="pill p">⚠</span>` : "";
    return `<div class="card" role="link" tabindex="0" data-id="${r.id}">
      <div class="dimg">${recImg(r)}</div>
      <div><p class="t">${esc(x.title)}</p><div class="c">${esc(catName(r.cat))} · ${esc(x.serv)}</div>
      <div class="meta"><span class="pill">${r0(m[0])} ${esc(T.kcal)}</span><span class="pill p">${esc(T.p)} ${r.base.p == null ? "?" : r0(m[1])}</span>${timeLbl(r)}${vegLbl(r)}${vn}${sw}${wn}</div></div>
      <button class="fav" data-f="${r.id}" aria-pressed="${favs.has(r.id)}" aria-label="${esc(T.favaria)}">${favs.has(r.id) ? "★" : "☆"}</button></div>`;
  }).join("") + `</div>`;
  $("#app").innerHTML = h;
  $("#fl").addEventListener("toggle", e => { state.fopen = e.target.open; });
  $("#fk").value = state.kcal; $("#fp").value = state.prot; $("#fs").value = state.sort; $("#fv").value = state.veg;
}

/* ---------- recipe ---------- */
function macroBlock(r) {
  const T = t(), mode = modeOf(r), m = recipeMacros(r), raw = r.var ? (mode === "fit" && state.protOn[r.id] ? r.var.on : r.var.off) : r.base, k = servOf(r);
  const cells = [m[0], raw.p == null ? null : m[1], raw.f == null ? null : m[2], raw.c == null ? null : m[3]];
  const src = mode === "classic" ? T.calc : T[r.src];
  return `<div class="macros">${cells.map((c, i) => `<div class="${i === 1 ? "p" : ""}"><b>${c == null ? "–" : r0(c)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>
  <p class="macnote">${esc(T.perOne)} · ${esc(T.whole)} (${k}): ${r0(m[0] * k)} ${esc(T.kcal)}. ${esc(src)}</p>`;
}
function renderRecipe(id) {
  const r = R.find(x => x.id === id); if (!r) return renderList();
  const T = t(), x = RX(r), mode = modeOf(r), k = servOf(r) / r.n, eff = effItems(r), byIdx = {};
  eff.forEach(e => byIdx[e.idx] = e);
  done[id] = done[id] || new Set();
  let h = `<button class="back" id="back">${esc(T.back)}</button>
  <div class="hero"><div class="dimg big">${recImg(r)}</div><div><h2>${esc(x.title)}</h2><div class="c">${esc(catName(r.cat))}${r.time < 600 ? " · " + r.time + " " + esc(T.min) : ""}</div>
  <div class="meta" style="margin-top:6px">${vegLbl(r)}${r.cuis.map(c => `<span class="pill o">${esc(T.cu[c])}</span>`).join("")}</div>
  <div class="actions"><button class="btn" data-f="${r.id}" aria-pressed="${favs.has(r.id)}">${esc(favs.has(r.id) ? T.favOn : T.favAdd)}</button></div></div></div>`;
  h += `<div class="seg" role="group" aria-label="${esc(T.ver)}"><button data-md="fit" aria-pressed="${mode === "fit"}">${esc(T.modeFit)}</button><button data-md="classic" aria-pressed="${mode === "classic"}">${esc(T.modeClassic)}</button></div>`;
  if (r.var && mode === "fit") h += ` <div class="seg" role="group" aria-label="${esc(T.ver)}"><button data-pv="0" aria-pressed="${!state.protOn[r.id]}">${esc(T.noP)}</button><button data-pv="1" aria-pressed="${!!state.protOn[r.id]}">${esc(T.withP)}</button></div>`;
  h += `<p class="hint" style="margin-top:8px">${esc(mode === "fit" ? T.modeFitD : T.modeClassicD)}</p>`;
  h += `<div id="mac">${macroBlock(r)}</div>`;
  h += `<div class="servrow"><span>${esc(T.servings)}</span><div class="qty"><button data-sv="-1" aria-label="−">−</button><input id="svn" type="number" inputmode="numeric" min="1" value="${servOf(r)}" aria-label="${esc(T.servings)}"><button data-sv="1" aria-label="+">+</button></div></div>`;
  h += `<div class="row2"><button class="btn main" id="toDay">${esc(T.addDay)}</button><button class="btn" id="toPlan">${esc(T.addPlan)}</button><button class="btn" id="toShop">${esc(T.addShop)}</button>${r.items.length ? `<button class="btn" id="myVer">${esc(T.myVersion)}</button>` : ""}</div>`;
  if (r.video) h += `<div class="box video"><a class="btn main" href="${esc(r.video)}" target="_blank" rel="noopener">${esc(T.vid)}</a></div>`;
  h += `<h3>${esc(T.ingh)}</h3>`;
  if (r.items.length) h += `<p class="hint">${esc(T.swapHint)}</p>`;
  if (Math.abs(k - 1) > 1e-6 && !r.gen) h += `<p class="hint">${esc(T.scaleNote)}</p>`;
  h += `<ul class="ing">` + x.ing.map((s, i) => {
    const note = /^<b>/.test(s), e = byIdx[i];
    const btn = e && (SUBS[e.key0] || []).length ? `<button class="sw" data-swap="${i}" aria-label="${esc(T.swapT)}">⇄</button>` : "";
    if (e && (e.key !== e.key0 || e.g !== e.g0) && e.why !== "warn") {
      const tag = {classic: T.modeClassic, swap: T.swapped, allerg: T.notEatT}[e.why];
      const newTxt = e.g > 0 ? `<b>${esc(fname(e.key))}</b>: ${fnum(rg(e.g * k))} ${esc(T.grams)}` : `<b>—</b>`;
      return `<li class="swp" data-i="${i}"><span><s>${r.gen ? esc(itemLine(e.key0, e.g0 * k)) : scaleText(s, k)}</s><br>→ ${newTxt} <small class="tg">${esc(tag)}</small></span>${btn}</li>`;
    }
    const txt = r.gen && e ? esc(itemLine(e.key0, e.g0 * k)) : scaleText(s, k);
    const warn = e && e.why === "warn" ? ` <small class="tg w">⚠ ${esc(T.notEatT)}</small>` : "";
    return `<li class="${note ? "note" : done[id].has(i) ? "done" : ""}" data-i="${i}"><span>${txt}${warn}</span>${btn}</li>`;
  }).join("") + `</ul>`;
  if (hasSwaps(r)) h += `<button class="linkbtn" id="swReset">${esc(T.resetSwaps)}</button>`;
  h += `<h3>${esc(T.steph)}</h3><ol class="steps">` + x.steps.map(s => `<li><span>${esc(s)}</span></li>`).join("") + `</ol>`;
  if (x.storage) h += `<div class="box"><b>${esc(T.stor)}</b> ${esc(x.storage)}</div>`;
  if (x.note) h += `<div class="box">${esc(x.note)}</div>`;
  h += coachMini();
  $("#app").innerHTML = h;
}
function renderSubs() {
  const T = t();
  $("#app").innerHTML = `<button class="back" id="back">${esc(T.back)}</button><h2 style="font-family:var(--font-display);font-size:20px;margin:0 0 6px">${esc(T.st)}</h2>
  <p class="sub" style="margin-top:0">${esc(T.st2)}</p>
  <div class="search" style="margin-bottom:12px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="sq" type="search" placeholder="${esc(T.find)}" aria-label="${esc(T.find)}"></div>
  <div class="tablewrap"><table><thead><tr><th>${esc(T.th[0])}</th><th>${esc(T.th[1])}</th></tr></thead><tbody id="sb"></tbody></table></div>`;
  fillSubs("");
}
function fillSubs(q) {
  q = norm(q);
  const rows = L().subs.filter(r => !q || norm(r[0] + " " + r[1]).includes(q));
  $("#sb").innerHTML = rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("") || `<tr><td colspan="2">${esc(t().nf)}</td></tr>`;
}

/* ---------- diary ---------- */
function entryMacros(e) {
  if (e.t === "p") return e.key ? mac(e.key, e.g) : (e.c || [0, 0, 0, 0]).map(v => v * e.g / 100);
  return e.per.map(v => v * e.n);
}
function entryName(e) {
  const T = t();
  if (e.t === "r") { const r = R.find(x => x.id === e.id); return (r ? RX(r).title : e.name) + (e.sw ? " · ⇄ " + T.swapped : "") + (e.mode === "classic" ? " · " + T.modeClassic : ""); }
  if (e.t === "d") { const d = dishes.find(x => x.id === e.id); return d ? d.name : e.name; }
  if (e.t === "x") return e.name;
  return e.key ? fname(e.key) : e.name;
}
function addToDay(e, date) { const d = date || state.date; (diary[d] = diary[d] || []).push(e); saveDiary(); toast(t().added); }
function shiftDate(n) { const [y, m, d] = state.date.split("-").map(Number); state.date = iso(new Date(y, m - 1, d + n)); }
function dateLabel() {
  if (state.date === todayIso()) return t().today;
  const [y, m, d] = state.date.split("-").map(Number);
  try { return new Intl.DateTimeFormat(lang, {weekday: "short", day: "numeric", month: "long"}).format(new Date(y, m - 1, d)); } catch (e) { return state.date; }
}
const lastWeight = () => { const ks = Object.keys(weights).sort(); return ks.length ? weights[ks[ks.length - 1]] : (+prof.w || 0); };
const waterGoal = () => { const w = lastWeight(); return w ? Math.round(w * 30 / 250) * 250 : 2000; };
function goalBars(tot, compact) {
  const T = t(), bars = [];
  if (+goal.k > 0) bars.push([T.goalK, tot[0], +goal.k, T.kcal]);
  if (+goal.p > 0) bars.push([T.goalP, tot[1], +goal.p, T.grams]);
  if (!bars.length) return "";
  return `<div class="goal">` + bars.map(([n, v, g, u]) => {
    const over = v > g, pct = Math.min(100, v / g * 100);
    return `<div class="goalrow"><div><span>${esc(n)}: ${r0(v)} / ${r0(g)}</span><span class="${over ? "up" : ""}">${esc(over ? T.over : T.left)} ${r0(Math.abs(g - v))} ${esc(u)}</span></div><div class="bar${over ? " over" : ""}"><i style="width:${pct}%"></i></div></div>`;
  }).join("") + `</div>`;
}
function renderDay() {
  const T = t(), list = diary[state.date] || [];
  let tot = [0, 0, 0, 0]; list.forEach(e => tot = add4(tot, entryMacros(e)));
  let h = `<div class="daynav"><button class="iconbtn" id="dPrev" aria-label="←">‹</button><b>${esc(dateLabel())}</b><button class="iconbtn" id="dNext" aria-label="→">›</button></div>`;
  h += `<p class="lbl" style="margin-top:4px">${esc(T.total)}</p><div class="macros">${tot.map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${r0(v)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>`;
  h += goalBars(tot);
  if (!(+goal.k > 0)) h += `<p class="hint" style="margin-top:10px">${esc(T.noGoal)} <a href="#me">${esc(T.calcLink)}</a></p>`;
  const wv = water[state.date] || 0, wg = waterGoal();
  h += `<div class="water"><div><b>${esc(T.waterT)}</b><span class="subtle">${fnum(wv / 1000)} / ${fnum(wg / 1000)} ${esc(T.liters)}</span></div><div class="bar"><i style="width:${Math.min(100, wv / wg * 100)}%;background:#3E8ED0"></i></div>
    <div class="qty"><button data-wt="-250" aria-label="−">−</button><span class="subtle">250 ${esc(T.ml)}</span><button data-wt="250" aria-label="+">+</button></div></div>`;
  h += `<div class="row2"><button class="btn main" id="addProd">${esc(T.addProd)}</button><a class="btn" href="#">${esc(T.navR)}</a><a class="btn" href="#plan">${esc(T.navPlan)}</a><a class="btn" href="#mine">${esc(T.navMine)}</a></div>`;
  if (!list.length) h += `<div class="empty">${esc(T.emptyDay)}</div>`;
  else h += `<div class="entries">` + list.map((e, i) => {
    const m = entryMacros(e);
    const qty = e.t === "p"
      ? `<div class="qty"><input type="number" inputmode="decimal" min="0" data-eg="${i}" value="${r0(e.g)}" aria-label="${esc(T.grams)}"><span class="x">${esc(T.grams)}</span><button data-erm="${i}" aria-label="${esc(T.remove)}">✕</button></div>`
      : `<div class="qty"><button data-en="${i}" data-d="-0.5" aria-label="−">−</button><span style="min-width:34px;text-align:center;font-weight:800">${fnum(e.n)}</span><button data-en="${i}" data-d="0.5" aria-label="+">+</button><button data-erm="${i}" aria-label="${esc(T.remove)}">✕</button></div>`;
    return `<div class="entry"><div><div class="nm">${esc(entryName(e))}</div><div class="sub2">${e.t === "p" ? "" : fnum(e.n) + " " + esc(T.portions) + " · "}${esc(fmtM(m))}</div></div>${qty}</div>`;
  }).join("") + `</div>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
}

/* ---------- week plan ---------- */
const SLOTS = ["b", "l", "d", "s"];
const wdName = i => { if (t().wd) return t().wd[i]; try { return new Intl.DateTimeFormat(lang, {weekday: "short"}).format(new Date(2024, 0, 1 + i)); } catch (e) { return String(i + 1); } };
function planEntryMac(e) {
  if (e.t === "r") { const r = R.find(x => x.id === e.id); return r ? recipeMacros(r, e.mode).map(v => v * e.n) : [0, 0, 0, 0]; }
  const d = dishes.find(x => x.id === e.id); return d ? dishTotal(d).map(v => v / (d.serv || 1) * e.n) : [0, 0, 0, 0];
}
const planName = e => e.t === "r" ? ((R.find(x => x.id === e.id) && RX(R.find(x => x.id === e.id)).title) || "?") + (e.mode === "classic" ? " · " + t().modeClassic : "") : ((dishes.find(x => x.id === e.id) || {}).name || "?");
const planEmpty = () => plan.d.every(d => SLOTS.every(sl => !d[sl].length));
function dayTotal(i) { let s = [0, 0, 0, 0]; SLOTS.forEach(sl => plan.d[i][sl].forEach(e => s = add4(s, planEntryMac(e)))); return s; }
function renderPlan(showPresets) {
  showPresets = showPresets || planEmpty();
  const T = t(), di = state.planDay, day = plan.d[di];
  let h = `<div class="seg2"><a href="#plan" aria-current="page">${esc(T.planT)}</a><a href="#shop">${esc(T.shopT)}</a></div>`;
  h += `<div class="wdays">` + [0, 1, 2, 3, 4, 5, 6].map(i => { const k = r0(dayTotal(i)[0]); return `<button data-pd="${i}" aria-pressed="${i === di}"><b>${esc(wdName(i))}</b><small>${k || "–"}</small></button>`; }).join("") + `</div>`;
  const tot = dayTotal(di);
  h += `<div class="macros">${tot.map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${r0(v)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>` + goalBars(tot);
  h += SLOTS.map(sl => `<div class="slot"><div class="slh"><b>${esc(T.slot[sl])}</b><button class="btn" data-padd="${sl}">+ ${esc(T.addBtn)}</button></div>` +
    (day[sl].length ? day[sl].map((e, j) => { const m = planEntryMac(e);
      return `<div class="entry"><div><div class="nm"><a href="${e.t === "r" ? "#recipe-" + e.id : "#dish-" + e.id}">${esc(planName(e))}</a></div><div class="sub2">${fnum(e.n)} ${esc(T.portions)} · ${esc(fmtM(m))}</div></div>
        <div class="qty"><button data-pn="${sl}:${j}" data-d="-0.5" aria-label="−">−</button><span style="min-width:30px;text-align:center;font-weight:800">${fnum(e.n)}</span><button data-pn="${sl}:${j}" data-d="0.5" aria-label="+">+</button><button data-prm="${sl}:${j}" aria-label="${esc(T.remove)}">✕</button></div></div>`; }).join("")
      : `<p class="subtle" style="margin:4px 0 0">—</p>`) + `</div>`).join("");
  h += `<div class="row2"><button class="btn main" id="planShop">${esc(T.planToShop)}</button><button class="btn" id="planToDay">${esc(T.planToDay)}</button><button class="btn danger" id="planClear">${esc(state.presetArm === "clear" ? T.sureAgain : T.planClear)}</button></div>`;
  h += `<details class="box2" id="presets"${showPresets ? " open" : ""}><summary>${esc(T.prepT)}</summary><p class="hint" style="margin-top:8px">${esc(T.prepD)}</p>` +
    PRESETS.map((p, i) => `<div class="preset"><div><b>${esc(p.name[lang] || p.name.en)}</b><p class="subtle" style="margin:2px 0 0">${esc(p.desc[lang] || p.desc.en)}</p></div><button class="btn" data-pre="${i}">${esc(state.presetArm === i ? T.sureAgain : T.load)}</button></div>`).join("") + `</details>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
}
function addRecipeToPlan(r, day, slot) { plan.d[day][slot].push({t: "r", id: r.id, n: 1, mode: modeOf(r)}); savePlan(); toast(t().addedPlan); }

/* ---------- shopping list ---------- */
function addItemsToShop(list) { list.forEach(([k, g]) => { if (!k || !(g > 0) || ["spices", "water", "broth", "khmeli"].includes(k)) return; shop.items[k] = (shop.items[k] || 0) + g; }); saveShop(); }
function recipeShopItems(r, servings, mode) { const k = servings / r.n; return effItems(r, mode).map(e => [e.key, e.g * k]); }
function shopFromPlan() {
  shop.items = {}; shop.notes = [];
  plan.d.forEach(day => SLOTS.forEach(sl => day[sl].forEach(e => {
    if (e.t === "r") { const r = R.find(x => x.id === e.id); if (!r) return; addItemsToShop(recipeShopItems(r, e.n, e.mode)); if (!r.full && !r.gen && !shop.notes.includes(r.id)) shop.notes.push(r.id); }
    else { const d = dishes.find(x => x.id === e.id); if (d) addItemsToShop(d.items.filter(i => i.key).map(i => [i.key, i.g * e.n / (d.serv || 1)])); }
  })));
  saveShop();
}
const SHOPORDER = ["meat", "dairy", "veg", "fruit", "grain", "other"];
const gfmt = g => g >= 1000 ? fnum(Math.round(g / 100) / 10) + " " + t().kg : fnum(rg(g)) + " " + t().grams;
function shopText() { const T = t(); return SHOPORDER.map(c => { const ks = Object.keys(shop.items).filter(k => SHOPCAT[k] === c); return ks.length ? `${T.shopCat[c]}:\n` + ks.map(k => `- ${fname(k)}: ${gfmt(shop.items[k])}`).join("\n") : ""; }).filter(Boolean).join("\n\n"); }
function renderShop() {
  const T = t(), ks = Object.keys(shop.items);
  let h = `<div class="seg2"><a href="#plan">${esc(T.planT)}</a><a href="#shop" aria-current="page">${esc(T.shopT)}</a></div>`;
  h += `<div class="row2"><button class="btn main" id="shopAdd">${esc(T.addProd)}</button><button class="btn" id="shopCopy">${esc(T.copy)}</button><button class="btn" id="shopDone">${esc(T.clearDone)}</button><button class="btn danger" id="shopClear">${esc(state.presetArm === "shop" ? T.sureAgain : T.clearAll)}</button></div>`;
  if (!ks.length) h += `<div class="empty">${esc(T.shopEmpty)}</div>`;
  else h += SHOPORDER.map(c => { const kk = ks.filter(k => SHOPCAT[k] === c).sort((a, b) => fname(a).localeCompare(fname(b))); if (!kk.length) return "";
    return `<p class="lbl">${esc(T.shopCat[c])}</p><ul class="shop">` + kk.map(k => `<li class="${shop.done[k] ? "done" : ""}" data-sk="${k}"><span>${esc(fname(k))}</span><b>${gfmt(shop.items[k])}</b><button data-srm="${k}" aria-label="${esc(T.remove)}">✕</button></li>`).join("") + `</ul>`; }).join("");
  if (shop.notes.length) h += `<p class="hint">${esc(T.shopNote)} ${shop.notes.map(id => esc(RX(R.find(x => x.id === id)).title)).join(", ")}</p>`;
  h += `<textarea id="shopTxt" class="vh" readonly aria-hidden="true" tabindex="-1"></textarea>`;
  $("#app").innerHTML = h;
}

/* ---------- me: norm, weight, not-eat, coach ---------- */
function calcNorm() {
  const a = +prof.age, h = +prof.h, w = +prof.w; if (!(a > 0 && h > 0 && w > 0)) return null;
  const bmr = 10 * w + 6.25 * h - 5 * a + (prof.sex === "m" ? 5 : -161), tdee = bmr * +prof.act;
  let k = tdee * (prof.aim === "lose" ? .85 : prof.aim === "gain" ? 1.1 : 1), floor = false;
  const minK = prof.sex === "m" ? 1500 : 1200; if (k < Math.max(minK, bmr)) { k = Math.max(minK, bmr); floor = true; }
  const p = w * (prof.aim === "maintain" ? 1.6 : 1.8), f = w * .9, c = Math.max(0, (k - p * 4 - f * 9) / 4);
  return {k: Math.round(k / 10) * 10, p: r0(p), f: r0(f), c: r0(c), floor, tdee: r0(tdee)};
}
function weightChart() {
  const ks = Object.keys(weights).sort().slice(-30); if (ks.length < 2) return "";
  const vs = ks.map(k => weights[k]), mn = Math.min(...vs) - .5, mx = Math.max(...vs) + .5, W = 320, H = 120;
  const pts = vs.map((v, i) => [10 + i * (W - 20) / (vs.length - 1), H - 14 - (v - mn) / (mx - mn) * (H - 28)]);
  return `<svg viewBox="0 0 ${W} ${H}" class="wchart" role="img" aria-label="${esc(t().weightT)}"><line x1="10" x2="${W - 10}" y1="${H - 14}" y2="${H - 14}" stroke="var(--line)"/>
    <polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4 : 2.5}" fill="var(--accent)"/>`).join("")}
    <text x="10" y="12" font-size="11" fill="var(--muted)">${fnum(Math.max(...vs))}</text><text x="10" y="${H - 2}" font-size="11" fill="var(--muted)">${fnum(Math.min(...vs))}</text>
    <text x="${W - 10}" y="${H - 2}" font-size="11" fill="var(--muted)" text-anchor="end">${ks[ks.length - 1].slice(5).split("-").reverse().join(".")}</text></svg>`;
}
function coachMini() { const T = t(); return `<div class="coach mini"><div><b>${esc(T.coachQ)}</b><p class="subtle" style="margin:2px 0 0">${esc(T.coachQd)}</p></div><a class="btn main" href="#me-coach">${esc(T.wantProg)}</a></div>`; }
function normOut() {
  const T = t(), n = calcNorm(); let h = "";
  if (n) h += `<div class="macros" style="margin-top:12px">${[n.k, n.p, n.f, n.c].map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${v}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>
    <p class="macnote">${esc(T.normNote.replace("{t}", n.tdee))}${n.floor ? " " + esc(T.normFloor) : ""}</p><button class="btn main" id="setGoal" style="margin-top:8px">${esc(T.setGoal)}</button>`;
  else h += `<p class="subtle">${esc(T.normFill)}</p>`;
  return h;
}
function renderMe(focus) {
  const T = t(), n = calcNorm();
  let h = `<section class="mebox"><h2>${esc(T.normT)}</h2><p class="hint">${esc(T.normD)}</p>
    <div class="modes" style="grid-template-columns:1fr 1fr"><button data-sex="f" aria-pressed="${prof.sex === "f"}">${esc(T.female)}</button><button data-sex="m" aria-pressed="${prof.sex === "m"}">${esc(T.male)}</button></div>
    <div class="grid4" style="grid-template-columns:repeat(3,1fr);margin-top:8px"><label class="field">${esc(T.age)}<input id="pa" type="number" inputmode="numeric" value="${esc(prof.age)}"></label><label class="field">${esc(T.height)}<input id="ph" type="number" inputmode="numeric" value="${esc(prof.h)}"></label><label class="field">${esc(T.weight)}<input id="pw" type="number" inputmode="decimal" value="${esc(prof.w)}"></label></div>
    <label class="field" style="margin-top:8px">${esc(T.activity)}<select id="pact" class="sel">${T.acts.map((a, i) => `<option value="${[1.2, 1.375, 1.55, 1.725][i]}">${esc(a)}</option>`).join("")}</select></label>
    <div class="modes" style="margin-top:8px">${["lose", "maintain", "gain"].map(a => `<button data-aim="${a}" aria-pressed="${prof.aim === a}">${esc(T.aims[a])}</button>`).join("")}</div>`;
  h += `<div id="normOut">${normOut()}</div>`;
  h += `<p class="hint" style="margin-top:10px">${esc(T.normWarn)}</p></section>`;
  const wv = weights[todayIso()] || "";
  h += `<section class="mebox"><h2>${esc(T.weightT)}</h2><div class="grid2"><label class="field">${esc(T.weightToday)}<input id="wt" type="number" inputmode="decimal" step="0.1" value="${esc(wv)}"></label><button class="btn main" id="wSave" style="align-self:end;height:42px">${esc(T.save)}</button></div>${weightChart()}`;
  const ks = Object.keys(weights).sort(); if (ks.length >= 2) { const d = weights[ks[ks.length - 1]] - weights[ks[0]]; h += `<p class="macnote">${esc(T.weightChange)}: ${d > 0 ? "+" : ""}${fnum(Math.round(d * 10) / 10)} ${esc(T.kg)}</p>`; }
  h += `</section>`;
  h += `<section class="mebox"><h2>${esc(T.notEatT)}</h2><p class="hint">${esc(T.notEatD)}</p><div class="chips">` +
    ["lactose", "gluten", "nuts", "eggs", "fish", "pork", "meat", "vegan"].map(g => `<button class="chip" data-ag="${g}" aria-pressed="${prof.groups.includes(g)}">${esc(T.allerg[g])}</button>`).join("") + `</div>
    <div class="search" style="margin-top:10px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="nes" type="search" placeholder="${esc(T.notEatAdd)}" aria-label="${esc(T.notEatAdd)}" autocomplete="off"></div><div class="results" id="neres"></div>
    <div class="chips">${prof.excl.map(k => `<button class="chip" data-nerm="${k}" aria-pressed="true">${esc(fname(k))} ✕</button>`).join("")}</div></section>`;
  h += `<section class="mebox"><h2>${esc(T.defModeT)}</h2><div class="modes" style="grid-template-columns:1fr 1fr"><button data-dm="fit" aria-pressed="${prof.defMode === "fit"}">${esc(T.modeFit)}</button><button data-dm="classic" aria-pressed="${prof.defMode === "classic"}">${esc(T.modeClassic)}</button></div></section>`;
  const links = [["telegram", COACH.telegram], ["instagram", COACH.instagram], ["whatsapp", COACH.whatsapp]].filter(x => x[1]);
  h += `<section class="mebox coach" id="coach"><h2>${esc(T.coachT)}</h2><p>${esc(T.coachIntro)}</p><ul class="tips">${T.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <div class="row2">${links.length ? links.map(([n, u]) => `<a class="btn main" href="${esc(u)}" target="_blank" rel="noopener">${esc(T.wantProg)} · ${n[0].toUpperCase() + n.slice(1)}</a>`).join("") : `<p class="subtle">${esc(T.coachSoon)}</p>`}</div></section>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
  $("#pact").value = String(prof.act);
  if (focus) { const el = $("#" + focus); el && el.scrollIntoView({block: "start"}); }
}
/* ---------- my dishes ---------- */
function itemMac(it) { return it.key ? mac(it.key, it.g) : (it.c || [0, 0, 0, 0]).map(v => v * it.g / 100); }
function dishTotal(d) { let s = [0, 0, 0, 0]; d.items.forEach(it => s = add4(s, itemMac(it))); return s; }
function renderMine() {
  const T = t();
  let h = `<section class="genbox"><h2>✨ ${esc(T.genT)}</h2><p class="hint">${esc(T.genHint)}</p>
    <div class="genrow"><input id="gq" type="text" placeholder="${esc(T.genPh)}" aria-label="${esc(T.genT)}" value="${esc(gen ? gen.text : "")}" autocomplete="off"><button class="btn main" id="genGo">${esc(T.genBtn)}</button></div>
    <div class="quick" style="margin-top:8px">${T.genEx.map(x => `<button class="chip" data-gex="${esc(x)}">${esc(x)}</button>`).join("")}</div></section><div id="genOut"></div>`;
  h += `<div class="row2" style="margin-top:22px"><a class="btn main" href="#dish-new">${esc(T.newDish)}</a></div>`;
  if (!dishes.length) h += `<div class="empty">${esc(T.emptyMine)}</div>`;
  else h += `<div class="list">` + dishes.map(d => {
    const tot = dishTotal(d), per = tot.map(v => v / (d.serv || 1));
    return `<div class="card dish"><div class="dimg">${dishImg(d)}</div><div><p class="t">${esc(d.name || T.untitled)}</p><div class="c">${d.serv} × ${esc(T.oneServ)}: ${esc(fmtM(per))}</div>
      <div class="meta"><a class="btn" href="#dish-${d.id}">${esc(T.edit)}</a><button class="btn main" data-dday="${d.id}">${esc(T.addDay)}</button></div></div></div>`;
  }).join("") + `</div>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
  renderGenOut();
}
function renderBuilder() {
  const T = t();
  if (!draft) draft = {id: null, name: "", serv: 1, items: []};
  let h = `<button class="back" id="backMine">← ${esc(T.navMine)}</button>`;
  h += `<div class="grid2"><label class="field">${esc(T.dishName)}<input id="dn" value="${esc(draft.name)}"></label><label class="field">${esc(T.servings)}<input id="dsv" type="number" inputmode="numeric" min="1" value="${draft.serv}"></label></div>`;
  h += `<div class="phrow"><div class="dimg big" id="dimgPrev">${dishImg(draft)}</div><div class="phbtns"><label class="btn" for="dph">${esc(T.photo)}</label><input id="dph" type="file" accept="image/*" hidden>${draft.photo ? `<button class="btn" id="phDel">${esc(T.photoDel)}</button>` : `<p class="subtle" style="margin:0">${esc(T.photoNote)}</p>`}</div></div>`;
  h += `<p class="lbl">${esc(T.ingredients)}</p><div class="entries" id="ditems" style="margin-top:0">` + draft.items.map((it, i) => {
    const nm = it.key ? fname(it.key) : it.name;
    return `<div class="entry"><div><div class="nm">${esc(nm)}</div><div class="sub2" id="di${i}">${esc(fmtM(itemMac(it)))}</div></div>
      <div class="qty"><input type="number" inputmode="decimal" min="0" data-dg="${i}" value="${r0(it.g)}" aria-label="${esc(T.grams)}"><span class="x">${esc(T.grams)}</span><button data-drm="${i}" aria-label="${esc(T.remove)}">✕</button></div></div>`;
  }).join("") + `</div>`;
  h += `<div class="search" style="margin-top:10px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ds" type="search" placeholder="${esc(T.addIng)}" aria-label="${esc(T.addIng)}" autocomplete="off"></div><div class="results" id="dres"></div>`;
  h += `<details class="box2"><summary>${esc(T.customProd)}</summary><div style="display:grid;gap:8px;margin-top:8px">
    <label class="field">${esc(T.name)}<input id="cpn"></label>
    <p class="subtle" style="margin:0">${esc(T.per100)}</p>
    <div class="grid4"><label class="field">${esc(T.kcal)}<input id="cpk" type="number" inputmode="decimal" min="0"></label><label class="field">${esc(T.p)}<input id="cpp" type="number" inputmode="decimal" min="0"></label><label class="field">${esc(T.fL)}<input id="cpf" type="number" inputmode="decimal" min="0"></label><label class="field">${esc(T.cL)}<input id="cpc" type="number" inputmode="decimal" min="0"></label></div>
    <div class="grid2"><label class="field">${esc(T.grams)}<input id="cpg" type="number" inputmode="decimal" min="0" value="100"></label><button class="btn main" id="cpAdd" style="align-self:end;height:42px">${esc(T.addBtn)}</button></div></div></details>`;
  h += `<div id="dtot"></div>`;
  h += `<div class="row2"><button class="btn main" id="dSave">${esc(T.save)}</button>${draft.id ? `<button class="btn danger" id="dDel">${esc(state.delArm ? T.delConfirm : T.del)}</button>` : ""}</div>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
  updateTotals();
}
function updateTotals() {
  const T = t(); if (!draft || !$("#dtot")) return;
  const tot = dishTotal(draft), per = tot.map(v => v / (draft.serv || 1));
  $("#dtot").innerHTML = `<p class="lbl">${esc(T.oneServ)}</p><div class="macros">${per.map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${r0(v)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>
    <p class="macnote">${esc(T.whole)}: ${esc(fmtM(tot))}</p>`;
  draft.items.forEach((it, i) => { const el = $("#di" + i); if (el) el.textContent = fmtM(itemMac(it)); });
  const pv = $("#dimgPrev"); if (pv && !draft.photo) pv.innerHTML = dishImg(draft);
}



/* ---------- sheets ---------- */
let sheetKind = null, sheetCtx = null, lastFocus = null;
function openSheet(kind, ctx) { sheetKind = kind; sheetCtx = ctx || {}; lastFocus = document.activeElement; $("#sheet").hidden = false; renderSheet(); const f = $("#panel input") || $("#panel button"); f && f.focus(); }
function closeSheet() { $("#sheet").hidden = true; sheetKind = null; lastFocus && lastFocus.focus && lastFocus.focus(); }
function renderSheet() {
  const T = t();
  const title = {lang: T.langT, look: T.look, swap: T.swapT, prod: T.addProd.replace(/^\+\s*/, ""), pick: T.addBtn, toplan: T.addPlan.replace(/^\+\s*/, "")}[sheetKind];
  let h = `<div class="ph"><h2>${esc(title)}</h2><button class="btn main" id="sheetDone">${esc(T.done)}</button></div>`;
  if (sheetKind === "lang") {
    h += `<div class="langs">` + ORDER.map(c => `<button data-lang="${c}" aria-pressed="${c === lang}" lang="${c}"><b>${esc(LANGS[c].native)}</b><small>${esc(LANGS[c].name)}</small></button>`).join("") + `</div>`;
  } else if (sheetKind === "look") {
    h += `<p class="lbl">${esc(T.mode)}</p><div class="modes">` + ["auto", "light", "dark"].map(m => `<button data-mode="${m}" aria-pressed="${look.mode === m}">${esc(T[m])}</button>`).join("") + `</div>`;
    const dark = isDark();
    h += `<p class="lbl">${esc(T.palette)}</p><div class="sw">` + Object.keys(PAL).map(p => `<button data-pal="${p}" aria-pressed="${!look.custom && look.pal === p}"><i style="background:${PAL[p][dark ? 1 : 0]}"></i>${esc(T.pal[p])}</button>`).join("") + `</div>`;
    h += `<div class="custom" data-on="${!!look.custom}"><input type="color" id="cc" value="${look.custom || PAL[look.pal][0]}"><label for="cc">${esc(T.custom)}</label></div>`;
    h += `<div class="preview"><span class="pill">520 ${esc(T.kcal)}</span><span class="pill p">${esc(T.p)} 42</span><span class="pill o">${esc(T.plus)}</span><button class="btn main" tabindex="-1">${esc(T.withP)}</button></div>`;
    h += `<button class="linkbtn" id="lookReset">${esc(T.resetLook)}</button>`;
  } else if (sheetKind === "swap") {
    const r = R.find(x => x.id === sheetCtx.rid), it = r.items.find(i => i[0] === sheetCtx.idx), [, key, g] = it;
    const cur = (swaps[r.id] || {})[it[0]];
    h += `<p class="subtle" style="margin-top:-6px">${esc(fname(key))}: ${rg(g)} ${esc(T.grams)} · ${esc(T.perServ)}</p>`;
    const alts = (SUBS[key] || []).filter(k => !banned(k)).map(k => { const d = add4(mac(k, g * ratio(key, k)), mac(key, g), -1).map(v => v / r.n); return {k, d, score: Math.abs(d[1]) * 4 + Math.abs(d[0]) / 8}; }).sort((a, b) => a.score - b.score);
    if (!alts.length) h += `<p>${esc(T.noSwap)}</p>`;
    else h += `<div class="alts">` + alts.map((a, i) => {
      const dk = r0(a.d[0]), dp = r0(a.d[1]), sg = v => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v);
      return `<button data-alt="${a.k}" aria-pressed="${cur === a.k}"><span><b>${esc(fname(a.k))}</b>${i === 0 ? `<span class="best">${esc(T.swapBest)}</span>` : ""}<small>${rg(g * ratio(key, a.k))} ${esc(T.grams)}</small></span>
        <span class="delta"><span class="${dk > 0 ? "up" : "dn"}">${sg(dk)} ${esc(T.kcal)}</span><br><span class="${dp < 0 ? "up" : "dn"}">${sg(dp)} ${esc(T.p)}</span></span></button>`;
    }).join("") + `</div>`;
    if (cur) h += `<button class="linkbtn" id="altReset">${esc(T.swapReset)}</button>`;
  } else if (sheetKind === "prod") {
    h += `<div class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="ps" type="search" placeholder="${esc(T.findProd)}" aria-label="${esc(T.findProd)}" autocomplete="off" value="${esc(sheetCtx.q || "")}"></div><div class="results" id="pres"></div>`;
    if (sheetCtx.key) h += `<div class="pick"><b>${esc(fname(sheetCtx.key))}</b><div class="grid2"><label class="field">${esc(T.grams)}<input id="pg" type="number" inputmode="decimal" min="0" value="${sheetCtx.g || 100}"></label><button class="btn main" id="pAdd" style="align-self:end;height:42px">${esc(T.addBtn)}</button></div><div class="sub2 subtle" id="pmac">${esc(fmtM(mac(sheetCtx.key, sheetCtx.g || 100)))}</div></div>`;
  } else if (sheetKind === "pick") {
    h += `<p class="subtle" style="margin-top:-6px">${esc(wdName(state.planDay))} · ${esc(T.slot[sheetCtx.slot])}</p>
      <div class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="pks" type="search" placeholder="${esc(T.ph)}" aria-label="${esc(T.ph)}" autocomplete="off" value="${esc(sheetCtx.q || "")}"></div><div class="results" id="pkres"></div>`;
  } else if (sheetKind === "toplan") {
    h += `<p class="lbl">${esc(T.dayT)}</p><div class="wdays">` + [0, 1, 2, 3, 4, 5, 6].map(i => `<button data-tpd="${i}" aria-pressed="${i === sheetCtx.day}"><b>${esc(wdName(i))}</b></button>`).join("") + `</div>
      <p class="lbl">${esc(T.mealT)}</p><div class="modes" style="grid-template-columns:1fr 1fr">` + SLOTS.map(s => `<button data-tps="${s}">${esc(T.slot[s])}</button>`).join("") + `</div>`;
  }
  $("#panel").innerHTML = h;
  if (sheetKind === "prod") fillProd();
  if (sheetKind === "pick") fillPick();
}
function resultsHTML(keys, attr) { return keys.map(k => `<button ${attr}="${k}"><span>${esc(fname(k))}</span><small>${r0(FOOD[k][0])} ${esc(t().kcal)} · ${esc(t().p)} ${r0(FOOD[k][1])} / 100 ${esc(t().grams)}</small></button>`).join(""); }
function fillProd() { const el = $("#pres"); if (el) el.innerHTML = resultsHTML(findFood(sheetCtx.q || ""), "data-pk"); }
function fillPick() {
  const el = $("#pkres"); if (!el) return; const q = sheetCtx.q || "", T = t();
  const rs = (q ? R.filter(r => matchQ(r, q)) : R.filter(r => favs.has(r.id)).concat(R.filter(r => !favs.has(r.id)))).slice(0, 12);
  const ds = dishes.filter(d => !q || norm(d.name).includes(norm(q))).slice(0, 6);
  el.innerHTML = ds.map(d => `<button data-pkd="${d.id}"><span>★ ${esc(d.name)}</span><small>${r0(dishTotal(d)[0] / (d.serv || 1))} ${esc(T.kcal)}</small></button>`).join("") +
    rs.map(r => `<button data-pkr="${r.id}"><span>${esc(RX(r).title)}</span><small>${r0(recipeMacros(r)[0])} ${esc(T.kcal)}</small></button>`).join("");
}
/* ---------- dish pictures drawn from ingredients ---------- */
const VIS = {
  oil: ["#E9C64A", "drizzle"], chickenthigh: ["#D9A36E", "chunk"], beef20: ["#8A4E33", "ball"], turkeyham: ["#E7A9A0", "strip"], sour20: ["#FBF7EC", "dollop"], tvorog9: ["#FBF4E4", "dollop"],
  mozzfull: ["#FFF8E6", "round"], milk32: ["#FBF9F2", "base"], cream20: ["#FBF4E2", "drizzle"], mayofull: ["#F7EFC8", "drizzle"], creamcheesefull: ["#FBF6EA", "dollop"], butter: ["#F6DE7C", "cube"],
  matsoni: ["#FBFAF4", "dollop"], imeruli: ["#F8F0D8", "cube"], flour: ["#F1EBDD", "dot"], granola: ["#C99A5B", "dot"], ricenoodles: ["#F4EEDD", "noodle"], lentilsdry: ["#C46A3A", "grain"],
  beet: ["#8E2347", "cube"], cabbage: ["#CFE3A8", "strip"], pumpkin: ["#EE8A2C", "cube"], celery: ["#9CC56A", "slice"], greenpeas: ["#7FB843", "dot"], pickles: ["#6E8B3D", "round"],
  dates: ["#7A4424", "ball"], pomegranate: ["#C2243A", "dot"], lemon: ["#F4D33B", "wedge"], peanuts: ["#C8925A", "dot"], sesame: ["#EFE2C2", "seed"], tahini: ["#D9B98A", "drizzle"],
  coconutflakes: ["#FBF8F0", "seed"], tkemali: ["#B8452F", "drizzle"], garlic: ["#F4EEDC", "dot"], ginger: ["#E6C27A", "dot"], herbs: ["#3F8C3A", "leaf"], greenonion: ["#5DA641", "ring"],
  mint: ["#46A35A", "leaf"], khmeli: ["#B88A3A", "seed"], spices: ["#A0522D", "seed"], broth: ["#E9C46A", "base"], coffee: ["#6F4A2F", "base"], protein: ["#EFE6D6", "base"],
  chicken: ["#E8C08A", "chunk"], chicken_mince: ["#D9A877", "ball"], turkey: ["#E2B98E", "chunk"], veal: ["#9A5E3C", "chunk"], beef: ["#8A5236", "chunk"], pork: ["#D9A07A", "chunk"], bacon: ["#B5533C", "strip"],
  shrimp: ["#F08A6A", "curl"], tuna: ["#C98E7A", "flake"], salmon: ["#F2895B", "chunk"], whitefish: ["#F1E6D2", "chunk"], tofu: ["#F3EBCF", "cube"], egg: ["#FFFFFF", "egg"], eggwhite: ["#FFFFFF", "base"],
  tvorog1: ["#FBF8F0", "dollop"], tvorog2: ["#FBF8F0", "dollop"], tvorog5: ["#FBF6EA", "dollop"], greek0: ["#FBFAF4", "dollop"], greek2: ["#FBF8F0", "dollop"], skyr: ["#FBFAF4", "dollop"], yogurt: ["#FBFAF4", "dollop"],
  kefir: ["#F7F5EE", "base"], milk: ["#F7F3EA", "base"], milkskim: ["#F7F6F0", "base"], oatmilk: ["#EFE4CC", "base"], almondmilk: ["#F2EADB", "base"], soymilk: ["#F2EBD5", "base"], cream10: ["#FBF4E4", "base"],
  sour: ["#FFFDF6", "dollop"], coconut: ["#FBF7EE", "base"], hard: ["#F2D27A", "cube"], lightcheese: ["#F5DC8E", "cube"], mozz: ["#FFFDF2", "round"], feta: ["#FFFFFF", "cube"], suluguni: ["#FFF6DA", "round"],
  procheese: ["#F5DFA0", "dollop"], creamcheese: ["#FFFDF6", "dollop"], oats: ["#E9D6AE", "grain"], rice: ["#FFFDF6", "grain"], ricecooked: ["#FFFDF6", "grain"], buckwheat: ["#7A5236", "grain"], buckwheatcooked: ["#7A5236", "grain"],
  pasta: ["#F2D48A", "noodle"], pastacooked: ["#F2D48A", "noodle"], bulgur: ["#D9B77E", "grain"], quinoa: ["#E8D9B5", "grain"], couscous: ["#EED9A0", "grain"], potato: ["#EBC877", "wedge"], sweetpotato: ["#E8893A", "wedge"],
  bread: ["#D9A24E", "cube"], lavash: ["#E9C98A", "wrap"], tortilla: ["#E9C98A", "wrap"], semolina: ["#F3E6C4", "base"], beans: ["#7A2E2A", "dot"], chickpeas: ["#E3C48A", "dot"], lentils: ["#A0522D", "dot"], corn: ["#F5CF3A", "dot"],
  pepper: ["#D13B2E", "slice"], zucchini: ["#9BC265", "round"], broccoli: ["#3E8E41", "floret"], cauliflower: ["#F3EEDC", "floret"], mushroom: ["#D8C3A5", "round"], spinach: ["#2F7D32", "leaf"], carrot: ["#F08A24", "round"],
  tomato: ["#E0412F", "round"], passata: ["#C9402F", "base"], cucumber: ["#8DC26F", "round"], onion: ["#E9D2E6", "ring"], eggplant: ["#5B3A6E", "round"], greenbeans: ["#4C9A47", "stick"], vegmix: ["#6AA84F", "dot"],
  lettuce: ["#7FBF5A", "leaf"], arugula: ["#4E8F3A", "leaf"], banana: ["#F5D86A", "round"], apple: ["#E05A47", "wedge"], pear: ["#D4D96A", "wedge"], berries: ["#6B2E7A", "dot"], strawberry: ["#E0334B", "dot"],
  mango: ["#F5A623", "cube"], cherry: ["#9B1B3A", "dot"], pineapple: ["#F7D154", "cube"], kiwi: ["#8DBE3A", "round"], persimmon: ["#F08A24", "wedge"], avocado: ["#A5C96B", "wedge"], olives: ["#3B3A2A", "dot"],
  pb: ["#B07A3A", "drizzle"], walnut: ["#A87A4A", "dot"], almonds: ["#C9935A", "dot"], chia: ["#333333", "seed"], honey: ["#E8A91F", "drizzle"], maple: ["#B8691A", "drizzle"], cocoa: ["#5B3A2A", "seed"],
  choc: ["#4A2A1A", "cube"], soy: ["#5A2E1A", "drizzle"], ketchup: ["#C9302C", "drizzle"], mayo: ["#FFFDF2", "drizzle"]
};
function rngOf(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t2 = Math.imul(a ^ a >>> 15, 1 | a); t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2; return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296; }; }
const ORDERV = ["leaf", "wedge", "noodle", "chunk", "flake", "ball", "strip", "curl", "cube", "round", "slice", "ring", "floret", "stick", "egg", "dot", "seed", "dollop", "drizzle"];
function inferType(items) {
  const ks = items.map(i => i.key).filter(Boolean);
  const has = arr => ks.some(k => arr.includes(k));
  if (has(["lavash", "tortilla"])) return "wrap";
  if (has(["lettuce", "arugula"])) return "salad";
  if (has(["oats"]) && has(["milk", "oatmilk", "almondmilk", "soymilk", "milkskim"])) return "oatmeal";
  if (has(["pasta", "pastacooked"])) return "pasta";
  return "plate";
}
function dishSVG(items, type, seed) {
  const R = rngOf(seed || items.map(i => i.key || i.name).join("|"));
  type = type || inferType(items);
  const parts = items.filter(i => i.key && VIS[i.key] && i.g > 0).map(i => ({k: i.key, g: i.g, c: VIS[i.key][0], s: VIS[i.key][1]}));
  const sh = [];
  const P = (x, y, r) => { let a = R() * Math.PI * 2, d = Math.sqrt(R()) * r; return [x + Math.cos(a) * d, y + Math.sin(a) * d]; };
  const shape = (p, x, y, sc) => {
    const rot = Math.round(R() * 180), c = p.c;
    switch (p.s) {
      case "leaf": return `<ellipse cx="${x}" cy="${y}" rx="${6 * sc}" ry="${3 * sc}" fill="${c}" transform="rotate(${rot} ${x} ${y})" opacity=".95"/>`;
      case "chunk": return `<rect x="${x - 4 * sc}" y="${y - 3 * sc}" width="${8 * sc}" height="${6 * sc}" rx="${1.8 * sc}" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width=".5" transform="rotate(${rot} ${x} ${y})"/>`;
      case "ball": return `<circle cx="${x}" cy="${y}" r="${4.5 * sc}" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width=".5"/>`;
      case "strip": return `<rect x="${x - 6 * sc}" y="${y - 1.5 * sc}" width="${12 * sc}" height="${3 * sc}" rx="1.2" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
      case "curl": return `<path d="M${x - 4} ${y} a4 4 0 1 1 8 0" fill="none" stroke="${c}" stroke-width="${3 * sc}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      case "flake": return `<ellipse cx="${x}" cy="${y}" rx="${4 * sc}" ry="${2.6 * sc}" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
      case "cube": return `<rect x="${x - 2.8 * sc}" y="${y - 2.8 * sc}" width="${5.6 * sc}" height="${5.6 * sc}" rx="1" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width=".5" transform="rotate(${rot} ${x} ${y})"/>`;
      case "round": return `<circle cx="${x}" cy="${y}" r="${3.8 * sc}" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="${1.6 * sc}" fill="rgba(255,255,255,.35)"/>`;
      case "slice": return `<path d="M${x - 5} ${y} q5 -6 10 0" fill="none" stroke="${c}" stroke-width="${2.6 * sc}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      case "ring": return `<circle cx="${x}" cy="${y}" r="${3.5 * sc}" fill="none" stroke="${c}" stroke-width="1.4"/>`;
      case "floret": return `<g fill="${c}"><circle cx="${x}" cy="${y}" r="${2.6 * sc}"/><circle cx="${x + 2.6}" cy="${y - 1}" r="${2.2 * sc}"/><circle cx="${x - 2.4}" cy="${y - 1.2}" r="${2.2 * sc}"/><circle cx="${x}" cy="${y - 2.8}" r="${2 * sc}"/></g>`;
      case "stick": return `<rect x="${x - 5}" y="${y - 1}" width="10" height="2" rx="1" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
      case "egg": return `<ellipse cx="${x}" cy="${y}" rx="${6 * sc}" ry="${5 * sc}" fill="#FFFFFF" stroke="#E4E0D6" stroke-width=".6"/><circle cx="${x}" cy="${y}" r="${2.6 * sc}" fill="#F2B51F"/>`;
      case "dot": return `<circle cx="${x}" cy="${y}" r="${1.9 * sc}" fill="${c}"/>`;
      case "seed": return `<circle cx="${x}" cy="${y}" r=".7" fill="${c}"/>`;
      case "dollop": return `<ellipse cx="${x}" cy="${y}" rx="${7 * sc}" ry="${5 * sc}" fill="${c}" stroke="#E6DFCF" stroke-width=".6"/>`;
      case "drizzle": return `<path d="M${x - 9} ${y} q4 -4 8 0 t8 0" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity=".9" transform="rotate(${rot} ${x} ${y})"/>`;
      case "noodle": return `<path d="M${x - 6} ${y} q3 -5 6 0 t6 0" fill="none" stroke="${c}" stroke-width="${2.4 * sc}" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`;
      case "wedge": return `<path d="M${x} ${y} l${7 * sc} -2 a7 7 0 0 1 -3 ${6 * sc} z" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width=".5" transform="rotate(${rot} ${x} ${y})"/>`;
    }
    return "";
  };
  const count = g => Math.max(2, Math.min(10, Math.round(Math.sqrt(g) / 1.6)));
  let svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="100" height="100" rx="12" fill="#F4F0E9"/>`;
  if (type === "drink") type = "smoothie";
  if (type === "smoothie") {
    const fr = parts.filter(p => !["base", "seed"].includes(p.s)), liq = parts.find(p => p.s === "base") || {c: "#F7F3EA"};
    let col = liq.c; fr.forEach((p, i) => col = mix(p.c, col, i ? .35 : .55));
    svg += `<path d="M28 20 L72 20 L65 86 L35 86 Z" fill="${col}" stroke="#9FA8A8" stroke-width="1.6"/><rect x="28" y="18" width="44" height="7" fill="${mix("#FFFFFF", col, .35)}"/><line x1="62" y1="6" x2="54" y2="44" stroke="#E58B2A" stroke-width="2.4" stroke-linecap="round"/>`;
    fr.slice(0, 3).forEach(p => { const [x, y] = P(50, 15, 8); svg += shape(p, x, y, .9); });
    return svg + `</svg>`;
  }
  const bowl = ["salad", "bowl", "oatmeal", "pasta", "soup"].includes(type);
  svg += bowl ? `<circle cx="50" cy="52" r="42" fill="#B07A4A"/><circle cx="50" cy="50" r="40" fill="#C9935A"/><circle cx="50" cy="50" r="33" fill="#FBF8F0"/>`
              : `<circle cx="50" cy="52" r="42" fill="#DCD6CC"/><circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#E6E0D5"/><circle cx="50" cy="50" r="31" fill="#FBF9F4" stroke="#EFE9DE"/>`;
  if (type === "wrap") {
    const w = parts.find(p => p.s === "wrap") || {c: "#E9C98A"}, fill = parts.filter(p => p.s !== "wrap");
    [[38, 50, -25], [62, 50, 25]].forEach(([x, y, a]) => {
      svg += `<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 10}" y="${y - 22}" width="20" height="44" rx="10" fill="${w.c}" stroke="#C9A35E" stroke-width="1"/><ellipse cx="${x}" cy="${y - 18}" rx="8" ry="5" fill="#FBF3DD"/>`;
      fill.slice(0, 5).forEach(p => { const [px, py] = P(x, y - 18, 5); svg += shape(p, px, py, .45); });
      svg += `</g>`;
    });
    return svg + `</svg>`;
  }
  if (type === "soup") {
    const liq = parts.filter(p => p.s === "base").sort((a, b) => b.g - a.g)[0];
    let col = liq ? liq.c : "#E9C46A"; parts.filter(p => p.s === "cube" || p.s === "round" || p.s === "grain").slice(0, 2).forEach(p => col = mix(p.c, col, .3));
    svg += `<circle cx="50" cy="50" r="33" fill="${col}"/><ellipse cx="42" cy="40" rx="12" ry="5" fill="#FFFFFF" opacity=".18"/>`;
    parts.filter(p => p !== liq && p.s !== "base").forEach(p => { const n = p.s === "seed" ? 14 : p.s === "drizzle" || p.s === "dollop" ? 1 : Math.max(2, count(p.g) - 1);
      for (let i = 0; i < n; i++) { const [x, y] = P(50, 50, p.s === "dollop" ? 6 : 24); svg += shape(p.s === "grain" ? {...p, s: "dot"} : p, +x.toFixed(1), +y.toFixed(1), .9); } });
    return svg + `</svg>`;
  }
  const base = parts.filter(p => p.s === "base" || p.s === "grain").sort((a, b) => b.g - a.g)[0];
  if (base) {
    if (type === "oatmeal" || bowl) svg += `<circle cx="50" cy="50" r="31" fill="${base.c}"/>`;
    else svg += `<path d="M50 19 A31 31 0 0 0 50 81 Z" fill="${base.c}"/>`;
    if (base.s === "grain") for (let i = 0; i < 70; i++) { const [x, y] = type === "plate" || type === "pasta" ? (() => { const [a, b] = P(50, 50, 29); return [Math.min(a, 49), b]; })() : P(50, 50, 29); svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="${mix("#000000", base.c, .12)}" opacity=".5"/>`; }
  }
  const rest = parts.filter(p => p !== base && p.s !== "base" && p.s !== "wrap");
  rest.sort((a, b) => ORDERV.indexOf(a.s) - ORDERV.indexOf(b.s));
  const cx = base && !bowl && type !== "oatmeal" ? 62 : 50, rad = base && !bowl && type !== "oatmeal" ? 17 : 25;
  rest.forEach(p => {
    const n = p.s === "seed" ? 18 : p.s === "drizzle" || p.s === "dollop" ? 1 : p.s === "grain" ? 0 : count(p.g);
    for (let i = 0; i < n; i++) { const [x, y] = p.s === "dollop" || p.s === "drizzle" ? P(cx, 50, rad / 3) : P(cx, 50, rad); svg += shape(p, +x.toFixed(1), +y.toFixed(1), 1); }
  });
  return svg + `</svg>`;
}
const dishImg = d => d.photo ? `<img src="${d.photo}" alt="">` : dishSVG(d.items, d.type, d.id || d.name);

/* ---------- dish generator ---------- */
const PROTS = ["chicken", "turkey", "veal", "beef", "pork", "chicken_mince", "salmon", "tuna", "shrimp", "whitefish", "tofu", "egg", "bacon"];
const VEGS = ["cucumber", "tomato", "pepper", "carrot", "corn", "mushroom", "broccoli", "zucchini", "spinach", "cauliflower", "eggplant", "greenbeans", "onion"];
const FRUITS = ["banana", "berries", "strawberry", "mango", "apple", "pear", "cherry", "pineapple", "kiwi", "persimmon"];
const MATCH = new Set([...PROTS, ...VEGS, ...FRUITS, "lettuce", "arugula", "rice", "buckwheat", "pasta", "bulgur", "quinoa", "couscous", "potato", "sweetpotato", "oats", "bread", "lavash", "tortilla",
  "beans", "chickpeas", "lentils", "tvorog5", "greek2", "skyr", "feta", "mozz", "hard", "suluguni", "avocado", "olives", "walnut", "almonds", "pb", "honey", "choc", "cocoa", "milk", "oatmilk", "almondmilk", "soymilk", "kefir", "protein", "passata"]);
const CATK = {meat: ["chicken", "chicken_mince", "turkey", "veal", "beef", "pork", "bacon"], fish: ["whitefish", "salmon", "shrimp", "tuna"],
  dairy: ["milk", "milkskim", "kefir", "yogurt", "greek0", "greek2", "skyr", "tvorog1", "tvorog2", "tvorog5", "hard", "lightcheese", "mozz", "feta", "suluguni", "procheese", "creamcheese", "cream10", "sour", "protein"],
  gluten: ["pasta", "pastacooked", "bread", "lavash", "tortilla", "bulgur", "couscous", "semolina", "oats"]};
const PMUL = {egg: .8, tuna: .85, tofu: 1.2, shrimp: 1.1, bacon: .35};
const GMUL = {potato: 3.5, sweetpotato: 3.2};
const S = (pick, g, o = {}) => Object.assign({pick, g}, o);
const TEMPL = {
  salad: [S(PROTS, [120, 200, 150], {prot: 1}), S(["lettuce", "arugula", "spinach"], [60, 80, 80]), S(["cucumber", "tomato", "pepper", "carrot", "corn", "mushroom", "broccoli"], [100, 100, 110], {n: 2, veg: 1}),
    S(["pepper", "carrot", "cucumber", "tomato", "broccoli", "zucchini"], [0, 0, 80], {s: [2], veg: 1}), S(["feta", "hard", "suluguni", "olives", "avocado"], [40, 0, 0], {s: [0], gk: {avocado: 60, olives: 30, hard: 25}}),
    S(["egg", "mozz", "tvorog5"], [0, 55, 0], {s: [1]}), S(["chickpeas", "quinoa", "beans", "avocado", "walnut"], [0, 0, 60], {s: [2], gk: {quinoa: 35, avocado: 50, walnut: 12}}),
    S(["bread"], [30, 0, 0], {s: [0]}), S(["oil"], [15, 0, 8], {s: [0, 2]}), S(["mayo"], [10, 0, 0], {s: [0]}), S(["greek0"], [0, 50, 30], {s: [1, 2]})],
  bowl: [S(PROTS, [130, 190, 150], {prot: 1}), S(["rice", "quinoa", "buckwheat", "bulgur", "couscous"], [80, 50, 65], {grain: 1}), S(VEGS.slice(0, 9), [100, 120, 120], {n: 2, veg: 1}),
    S(["avocado"], [60, 0, 40], {s: [0, 2]}), S(["beans", "chickpeas", "corn"], [0, 60, 60], {s: [1, 2]}), S(["soy"], [15, 15, 15]), S(["mayo"], [15, 0, 0], {s: [0]}), S(["greek0"], [0, 50, 30], {s: [1, 2]}), S(["oil"], [10, 0, 5], {s: [0, 2]})],
  pasta: [S(["pasta"], [100, 75, 80], {grain: 1}), S(PROTS, [120, 180, 140], {prot: 1}), S(["passata", "tomato"], [150, 150, 150]), S(["mushroom", "zucchini", "spinach", "pepper", "broccoli", "eggplant"], [80, 100, 120], {veg: 1}),
    S(["spinach", "zucchini", "broccoli"], [0, 0, 60], {s: [2], veg: 1}), S(["hard", "mozz", "suluguni"], [30, 0, 15], {s: [0, 2]}), S(["lightcheese", "tvorog5"], [0, 40, 0], {s: [1]}), S(["cream10"], [80, 0, 0], {s: [0]}), S(["oil"], [10, 3, 6])],
  wrap: [S(["lavash", "tortilla"], [70, 60, 60], {grain: 1}), S(PROTS, [120, 170, 140], {prot: 1}), S(["lettuce", "arugula"], [30, 30, 40]), S(["tomato", "cucumber", "pepper", "carrot", "corn"], [60, 60, 70], {n: 2, veg: 1}),
    S(["hard", "suluguni", "feta"], [25, 0, 0], {s: [0]}), S(["mayo"], [20, 0, 0], {s: [0]}), S(["greek0"], [0, 50, 35], {s: [1, 2]}), S(["avocado"], [0, 0, 40], {s: [2]})],
  omelet: [S(["egg"], [165, 110, 110]), S(["eggwhite"], [0, 130, 60], {s: [1, 2]}), S(["milk"], [50, 0, 0], {s: [0]}), S(["hard", "suluguni"], [30, 0, 0], {s: [0]}), S(["tvorog1"], [0, 80, 0], {s: [1]}), S(["feta"], [0, 0, 25], {s: [2]}),
    S(["tomato", "spinach", "pepper", "mushroom", "zucchini", "onion", "broccoli"], [60, 60, 80], {n: 2, veg: 1}), S(["bread"], [50, 0, 40], {s: [0, 2]}), S(["oil"], [8, 2, 4])],
  oatmeal: [S(["oats"], [60, 45, 50], {grain: 1}), S(["milk", "oatmilk", "almondmilk", "soymilk"], [200, 0, 200], {s: [0, 2]}), S(["milkskim", "soymilk", "almondmilk"], [0, 200, 0], {s: [1]}), S(FRUITS, [100, 80, 100], {fruit: 1}),
    S(["pb"], [15, 0, 0], {s: [0]}), S(["honey", "maple"], [15, 0, 8], {s: [0, 2]}), S(["protein"], [0, 30, 0], {s: [1]}), S(["greek0", "skyr"], [0, 100, 0], {s: [1]}), S(["greek2", "skyr"], [0, 0, 80], {s: [2]}), S(["walnut", "almonds", "chia"], [0, 0, 10], {s: [2]})],
  smoothie: [S(FRUITS, [100, 80, 100], {n: 2, fruit: 1}), S(["milk", "oatmilk", "almondmilk", "soymilk"], [250, 0, 200], {s: [0, 2]}), S(["milkskim", "soymilk", "almondmilk"], [0, 200, 0], {s: [1]}), S(["honey", "pb"], [15, 0, 0], {s: [0]}),
    S(["protein"], [0, 30, 0], {s: [1]}), S(["greek0", "skyr"], [0, 150, 0], {s: [1]}), S(["greek2", "skyr"], [0, 0, 120], {s: [2]}), S(["oats"], [0, 0, 20], {s: [2]}), S(["chia"], [0, 0, 6], {s: [2]})],
  plate: [S(PROTS, [150, 220, 170], {prot: 1}), S(["potato", "rice", "pasta", "buckwheat"], [80, 0, 0], {s: [0], grain: 1}), S(["buckwheat", "rice", "quinoa"], [0, 50, 0], {s: [1], grain: 1}), S(["buckwheat", "quinoa", "bulgur", "sweetpotato"], [0, 0, 70], {s: [2], grain: 1}),
    S(VEGS, [120, 150, 150], {n: 2, veg: 1}), S(["oil"], [15, 5, 8]), S(["sour"], [30, 0, 0], {s: [0]}), S(["greek0"], [0, 40, 0], {s: [1]})]
};
const ROLE_OF = k => PROTS.includes(k) ? "prot" : VEGS.includes(k) || ["lettuce", "arugula"].includes(k) ? "veg" : FRUITS.includes(k) ? "fruit" : ["rice", "buckwheat", "pasta", "bulgur", "quinoa", "couscous", "potato", "sweetpotato", "oats", "bread", "lavash", "tortilla"].includes(k) ? "grain" : "other";
const DEFG = {prot: 120, veg: 80, fruit: 80, grain: 60, other: 30};
const gw = s => s.toLowerCase().normalize("NFC");
function tokens(text) { return gw(text).replace(/[.,!?;:()"«»„“”]/g, " ").split(/\s+/).filter(Boolean); }
const stemQ = w => w.slice(0, Math.max(3, Math.min(5, w.length - 3)));
const ALIAS = {
  mushroom: ["гриб", "mushroom", "pilz", "seta", "hongo", "სოკო", "саңырауқұлақ"], chicken: ["куриц", "курин", "курк", "курятин", "chicken", "pollo", "huhn", "hähnchen", "poulet", "ქათამ", "ქათმ", "тауық"],
  beef: ["говядин", "говяж", "яловичин", "beef", "steak", "стейк", "rind", "bœuf", "boeuf", "сиыр", "საქონლ"], potato: ["картош", "картофел", "картопл", "potato", "patata", "kartoffel", "pomme de terre", "картоп", "კარტოფ"],
  egg: ["яйц", "яєць", "яйце", "eggs", "egg", "huevo", "eier", "œuf", "oeuf", "жұмыртқ", "კვერცხ"], pasta: ["макарон", "спагет", "noodle", "nudel", "spaghet", "макарон"], hard: ["сыр", "сир", "cheese", "queso", "käse", "fromage", "ყველ", "ірімшік"],
  milk: ["молок", "молоч", "milk", "leche", "milch", "lait", "რძ", "сүт"], whitefish: ["рыб", "риб", "fish", "pescado", "fisch", "poisson", "თევზ", "балық"], rice: ["рис", "rice", "arroz", "reis", "riz", "ბრინჯ", "күріш"],
  tomato: ["томат", "tomat", "pomodor", "პომიდ", "қызанақ"], cucumber: ["огур", "огір", "cucumber", "pepino", "gurke", "concombre", "კიტრ", "қияр"], shrimp: ["кревет", "shrimp", "prawn", "gamba", "garnele", "crevette", "კრევეტ", "асшаян"],
  tvorog5: ["творог", "cottage", "requesón", "requeson", "quark", "fromage blanc", "ხაჭო", "сүзбе"], greek2: ["йогурт", "yogurt", "yoghurt", "joghurt", "yaourt", "იოგურტ"], oats: ["овся", "овес", "вівся", "oat", "avena", "hafer", "avoine", "შვრი", "сұлы"]
};
function matchWord(w) {
  if (w.length < 3) return [];
  const st = stemQ(w), hits = new Set();
  for (const [k, al] of Object.entries(ALIAS)) if (al.some(a => w.startsWith(a))) hits.add(k);
  if (hits.size) return [...hits];
  for (const c of ORDER) { const F = LANGS[c].food; for (const k of MATCH) { const nm = gw(F[k] || ""); if (nm.split(/[\s/()%,.-]+/).some(p => p.startsWith(st) || (st.length >= 5 && w.includes(p) && p.length >= 4))) hits.add(k); } }
  return [...hits];
}
function parseReq(text) {
  const toks = tokens(text);
  const G = ORDER.map(c => LANGS[c].gen);
  let type = null;
  const typeIdx = i => toks.some(w => G.some(g => g.kw[i].some(k => w.includes(k))));
  for (let i = 0; i < 8; i++) if (typeIdx(i)) { type = TYPES_K[i]; break; }
  const neg = new Set(G.flatMap(g => g.neg)), negAfter = new Set(G.flatMap(g => g.negAfter)), pos = new Set(["с", "со", "з", "with", "con", "mit", "avec", "და", "қосылған"]);
  const sufs = G.flatMap(g => g.negSuffix);
  const kwAll = G.flatMap(g => g.kw.flat());
  const wants = [], excl = new Set(), used = [], skipped = [];
  let negMode = false;
  toks.forEach((w0, i) => {
    let w = w0, isNeg = negMode;
    if (neg.has(w)) { negMode = true; return; }
    if (pos.has(w)) { negMode = false; return; }
    if (negAfter.has(w)) return;
    if (negAfter.has(toks[i + 1] || "")) isNeg = true;
    for (const sf of sufs) if (sf && w.endsWith(sf) && w.length > sf.length + 2) { w = w.slice(0, -sf.length); isNeg = true; }
    const kwh = kwAll.find(k => k.length >= 3 && w.includes(k));
    if (kwh) { const rest = w.replace(kwh, ""); if (rest.length >= 4) w = rest; else if (!isNeg) return; }
    if (isNeg) for (const g of G) for (const [cat, arr] of Object.entries(g.cat)) if (arr.some(s => w.startsWith(s))) CATK[cat].forEach(k => excl.add(k));
    const hits = matchWord(w);
    if (!hits.length || hits.length > 3) return;
    if (isNeg) { hits.forEach(k => { excl.add(k); (SUBS[k] || []).filter(x => x === "passata" && k === "tomato").forEach(x => excl.add(x)); }); }
    else hits.slice(0, 1).forEach(k => { if (!wants.includes(k)) wants.push(k); });
  });
  if (excl.has("tomato")) excl.add("passata");
  const unknown = !type; if (!type) type = "plate";
  if (!["smoothie", "oatmeal"].includes(type)) { const i = wants.indexOf("protein"); if (i >= 0) wants.splice(i, 1); }
  return {type, wants: wants.filter(k => !excl.has(k)), excl: [...excl], unknown};
}
const TYPES_K = ["salad", "bowl", "pasta", "wrap", "omelet", "oatmeal", "smoothie", "plate"];
function buildDish(req, strat, seed) {
  const R = rngOf(seed + "|" + strat + "|" + req.type), excl = new Set(req.excl), used = new Set(), items = [];
  const pickR = arr => arr[Math.floor(R() * arr.length)];
  const wantsLeft = req.wants.slice();
  for (const sl of TEMPL[req.type]) {
    if (sl.s && !sl.s.includes(strat)) continue;
    let g = sl.g[strat]; if (!g) continue;
    const cands = sl.pick.filter(k => !excl.has(k) && !used.has(k));
    if (!cands.length) continue;
    const n = sl.n || 1, chosen = [];
    wantsLeft.filter(k => sl.pick.includes(k)).forEach(k => { if (chosen.length < n && !used.has(k)) chosen.push(k); });
    while (chosen.length < n) { let pool = cands.filter(k => !chosen.includes(k)); if (!pool.length) break; if (sl.prot) { const common = pool.filter(k => ["chicken", "turkey", "veal", "beef", "salmon", "tuna", "shrimp", "whitefish"].includes(k)); if (common.length) pool = common; } chosen.push(pickR(pool)); }
    chosen.forEach(k => {
      used.add(k); const i = wantsLeft.indexOf(k); if (i >= 0) wantsLeft.splice(i, 1);
      let gg = (sl.gk && sl.gk[k]) || g;
      if (sl.prot) gg *= PMUL[k] || 1; if (sl.grain) gg *= GMUL[k] || 1;
      items.push({key: k, g: rg(gg)});
    });
  }
  wantsLeft.forEach(k => { if (!used.has(k)) { used.add(k); items.push({key: k, g: DEFG[ROLE_OF(k)] * (ROLE_OF(k) === "grain" ? (GMUL[k] || 1) : 1)}); } });
  return items;
}
const lc = s => lang === "de" ? s : s.toLowerCase();
function genTitle(type, items) {
  const skip = new Set(["oil", "mayo", "soy", "honey", "maple", "greek0", "chia", "milk", "milkskim", "oatmilk", "almondmilk", "soymilk", "passata", "eggwhite", "sour", "cream10", "protein"]);
  const own = {pasta: "pasta", wrap: ["lavash", "tortilla"], oatmeal: "oats", omelet: "egg"}[type] || [];
  const names = items.filter(i => !skip.has(i.key) && ![].concat(own).includes(i.key)).slice(0, 3).map(i => lc(fname(i.key).replace(/\s*\(.*\)$/, "")));
  return `${L().gen.types[TYPES_K.indexOf(type)]}: ${names.join(", ")}`;
}
function genSteps(type, items) {
  const by = r => items.filter(i => ROLE_OF(i.key) === r && !["lettuce", "arugula"].includes(i.key)).map(i => lc(fname(i.key).replace(/\s*\(.*\)$/, "")));
  const P = by("prot")[0] || "", G = by("grain")[0] || "", V = by("veg").join(", ");
  return L().gen.steps[type].map(s => { s = s.replace("{P}", P).replace("{G}", G).replace("{V}", V || "…"); return s.charAt(0).toUpperCase() + s.slice(1); });
}
let gen = null;
function runGen(text) {
  const req = parseReq(text);
  gen = {text, req, seeds: [1, 2, 3].map(i => Date.now() + "-" + i)};
}
function genCard(strat) {
  const T = t(), req = gen.req, items = buildDish(req, strat, gen.seeds[strat]);
  gen["items" + strat] = items;
  let m = [0, 0, 0, 0]; items.forEach(it => m = add4(m, mac(it.key, it.g)));
  const [vn, vd] = L().gen.var[strat];
  return `<div class="gcard"><div class="ghead"><div class="dimg">${dishSVG(items, req.type, gen.seeds[strat])}</div><div><span class="vbadge v${strat}">${esc(vn)}</span><p class="t">${esc(genTitle(req.type, items))}</p><div class="c">${esc(vd)} · ${esc(T.oneServing)}</div></div></div>
    <div class="macros sm">${m.map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${r0(v)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>
    <ul class="gl">${items.map(it => `<li><span>${esc(fname(it.key))}</span><b>${it.g} ${esc(T.grams)}</b></li>`).join("")}</ul>
    <ol class="steps sm">${genSteps(req.type, items).map(s => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
    <div class="row2"><button class="btn main" data-gsave="${strat}">${esc(T.saveMine)}</button><button class="btn" data-gday="${strat}">${esc(T.addDay)}</button><button class="btn" data-reroll="${strat}">↻ ${esc(T.reroll)}</button></div></div>`;
}
function renderGenOut() {
  const el = $("#genOut"); if (!el) return;
  if (!gen) { el.innerHTML = ""; return; }
  const T = t(), req = gen.req;
  let h = `<div class="gmeta">`;
  if (req.unknown) h += `<p class="hint">${esc(T.genUnknown)}</p>`;
  if (req.wants.length) h += `<p class="hint">✓ ${esc(T.genUse)}: ${req.wants.map(k => esc(fname(k))).join(", ")}</p>`;
  const ex = req.excl.filter(k => MATCH.has(k)); if (ex.length) h += `<p class="hint">✕ ${esc(T.genNo)}: ${ex.slice(0, 8).map(k => esc(fname(k))).join(", ")}${ex.length > 8 ? "…" : ""}</p>`;
  h += `</div>` + [0, 1, 2].map(genCard).join("");
  el.innerHTML = h;
}



/* ---------- routing ---------- */
function route() {
  const h = location.hash, home = (h === "" || h === "#");
  const nav = h === "#day" ? "day" : /^#(plan|shop|prep)$/.test(h) ? "plan" : /^#(mine|dish-)/.test(h) ? "mine" : /^#me/.test(h) ? "me" : "r";
  chrome(nav);
  $("#tabs").hidden = !home; $("#searchBox").hidden = !home;
  if (/^#recipe-\d+$/.test(h)) renderRecipe(+h.slice(8));
  else if (h === "#zameny") renderSubs();
  else if (h === "#day") renderDay();
  else if (h === "#plan") renderPlan(false);
  else if (h === "#prep") renderPlan(true);
  else if (h === "#shop") renderShop();
  else if (h === "#me") renderMe();
  else if (h === "#me-coach") renderMe("coach");
  else if (h === "#mine") { draft = null; renderMine(); }
  else if (h === "#dish-new") { if (!draft || draft.id) draft = draft && !draft.id ? draft : {id: null, name: "", serv: 1, items: []}; renderBuilder(); }
  else if (/^#dish-\w+$/.test(h)) { const id = h.slice(6); const d = dishes.find(x => x.id === id); if (!d) { location.hash = "mine"; return; } if (!draft || draft.id !== id) draft = JSON.parse(JSON.stringify(d)); renderBuilder(); }
  else { renderTabs(); renderList(); }
  if (!/^#(dish-)/.test(h)) state.delArm = false;
  if (h === "#prep") { const p = $("#presets"); p && p.scrollIntoView({block: "start"}); } else if (h !== "#me-coach") scrollTo(0, 0);
}
function curRecipeId() { const m = /^#recipe-(\d+)$/.exec(location.hash); return m ? +m[1] : null; }
const rerender = () => { const h = location.hash; if (/^#recipe/.test(h)) renderRecipe(curRecipeId()); else if (h === "#me") renderMe(); else if (h === "#plan" || h === "#prep") renderPlan(h === "#prep"); else if (h === "#shop") renderShop(); else if (h === "#day") renderDay(); };

document.addEventListener("click", e => {
  const el = e.target, T = t();
  if (el.closest("#langBtn")) { openSheet("lang"); return; }
  if (el.closest("#lookBtn")) { openSheet("look"); return; }
  if (el.id === "sheet" || el.closest("#sheetDone")) { closeSheet(); return; }
  const lb = el.closest("[data-lang]"); if (lb) { lang = lb.dataset.lang; store.set("brfy-lang", lang); $("#q").value = ""; state.q = ""; $("#qx").hidden = true; route(); renderSheet(); return; }
  const md = el.closest("[data-mode]"); if (md) { look.mode = md.dataset.mode; saveLook(); renderSheet(); return; }
  const pl = el.closest("[data-pal]"); if (pl) { look.pal = pl.dataset.pal; look.custom = ""; saveLook(); renderSheet(); return; }
  if (el.closest("#lookReset")) { look = {mode: "auto", pal: "mint", custom: ""}; saveLook(); renderSheet(); return; }
  const al = el.closest("[data-alt]"); if (al) { const {rid, idx} = sheetCtx; (swaps[rid] = swaps[rid] || {})[idx] = al.dataset.alt; saveSwaps(); closeSheet(); renderRecipe(rid); return; }
  if (el.closest("#altReset")) { const {rid, idx} = sheetCtx; if (swaps[rid]) { delete swaps[rid][idx]; if (!Object.keys(swaps[rid]).length) delete swaps[rid]; } saveSwaps(); closeSheet(); renderRecipe(rid); return; }
  const pk = el.closest("[data-pk]"); if (pk) { sheetCtx.key = pk.dataset.pk; sheetCtx.g = sheetCtx.g || 100; renderSheet(); const g = $("#pg"); g && g.focus(); return; }
  if (el.closest("#pAdd")) { const g = +($("#pg").value || 0); if (g > 0) { if (sheetCtx.target === "shop") { addItemsToShop([[sheetCtx.key, g]]); closeSheet(); renderShop(); } else { addToDay({t: "p", key: sheetCtx.key, g}); closeSheet(); renderDay(); } } return; }
  const pkr = el.closest("[data-pkr]"); if (pkr) { const r = R.find(x => x.id === +pkr.dataset.pkr); plan.d[state.planDay][sheetCtx.slot].push({t: "r", id: r.id, n: 1, mode: prof.defMode}); savePlan(); closeSheet(); renderPlan(); return; }
  const pkd = el.closest("[data-pkd]"); if (pkd) { plan.d[state.planDay][sheetCtx.slot].push({t: "d", id: pkd.dataset.pkd, n: 1}); savePlan(); closeSheet(); renderPlan(); return; }
  const tpd = el.closest("[data-tpd]"); if (tpd) { sheetCtx.day = +tpd.dataset.tpd; renderSheet(); return; }
  const tps = el.closest("[data-tps]"); if (tps) { addRecipeToPlan(R.find(x => x.id === sheetCtx.rid), sheetCtx.day, tps.dataset.tps); closeSheet(); return; }
  if (el.closest("#panel")) return;
  const swb = el.closest("[data-swap]"); if (swb) { e.stopPropagation(); openSheet("swap", {rid: curRecipeId(), idx: +swb.dataset.swap}); return; }
  if (el.closest("#swReset")) { const id = curRecipeId(); delete swaps[id]; saveSwaps(); renderRecipe(id); return; }
  const mdb = el.closest("[data-md]"); if (mdb) { state.mode[curRecipeId()] = mdb.dataset.md; renderRecipe(curRecipeId()); return; }
  const svb = el.closest("[data-sv]"); if (svb) { const r = R.find(x => x.id === curRecipeId()); state.serv[r.id] = Math.max(1, servOf(r) + +svb.dataset.sv); renderRecipe(r.id); return; }
  if (el.closest("#toDay")) { const r = R.find(x => x.id === curRecipeId()); addToDay({t: "r", id: r.id, n: 1, per: recipeMacros(r), sw: hasSwaps(r), mode: modeOf(r), name: RX(r).title}); return; }
  if (el.closest("#toPlan")) { openSheet("toplan", {rid: curRecipeId(), day: state.planDay}); return; }
  if (el.closest("#toShop")) { const r = R.find(x => x.id === curRecipeId()); addItemsToShop(recipeShopItems(r, servOf(r))); if (!r.full && !r.gen && !shop.notes.includes(r.id)) { shop.notes.push(r.id); saveShop(); } toast(T.addedShop); return; }
  if (el.closest("#myVer")) {
    const r = R.find(x => x.id === curRecipeId()), k = servOf(r) / r.n;
    draft = {id: null, name: RX(r).title + T.copySuffix, serv: servOf(r), items: effItems(r).filter(x => x.g > 0).map(x => ({key: x.key, g: rg(x.g * k)}))};
    location.hash = "dish-new"; return;
  }
  if (el.closest("#dPrev")) { shiftDate(-1); renderDay(); return; }
  if (el.closest("#dNext")) { shiftDate(1); renderDay(); return; }
  if (el.closest("#addProd")) { openSheet("prod", {q: ""}); return; }
  if (el.closest("#shopAdd")) { openSheet("prod", {q: "", target: "shop"}); return; }
  const wt = el.closest("[data-wt]"); if (wt) { water[state.date] = Math.max(0, (water[state.date] || 0) + +wt.dataset.wt); saveW(); renderDay(); return; }
  const en = el.closest("[data-en]"); if (en) { const it = diary[state.date][+en.dataset.en]; it.n = Math.max(0.5, Math.round((it.n + +en.dataset.d) * 2) / 2); saveDiary(); renderDay(); return; }
  const erm = el.closest("[data-erm]"); if (erm) { diary[state.date].splice(+erm.dataset.erm, 1); saveDiary(); renderDay(); return; }
  /* plan */
  const pd = el.closest("[data-pd]"); if (pd) { state.planDay = +pd.dataset.pd; renderPlan(); return; }
  const padd = el.closest("[data-padd]"); if (padd) { openSheet("pick", {slot: padd.dataset.padd, q: ""}); return; }
  const pn = el.closest("[data-pn]"); if (pn) { const [sl, j] = pn.dataset.pn.split(":"), it = plan.d[state.planDay][sl][+j]; it.n = Math.max(0.5, Math.round((it.n + +pn.dataset.d) * 2) / 2); savePlan(); renderPlan(); return; }
  const prm = el.closest("[data-prm]"); if (prm) { const [sl, j] = prm.dataset.prm.split(":"); plan.d[state.planDay][sl].splice(+j, 1); savePlan(); renderPlan(); return; }
  if (el.closest("#planShop")) { shopFromPlan(); toast(T.shopMade); location.hash = "shop"; return; }
  if (el.closest("#planToDay")) { const day = plan.d[state.planDay]; let n = 0; SLOTS.forEach(sl => day[sl].forEach(e2 => { const m = planEntryMac(e2).map(v => v / e2.n); (diary[todayIso()] = diary[todayIso()] || []).push(e2.t === "r" ? {t: "r", id: e2.id, n: e2.n, per: m, mode: e2.mode, name: planName(e2)} : {t: "d", id: e2.id, n: e2.n, per: m, name: planName(e2)}); n++; })); saveDiary(); toast(T.added + " (" + n + ")"); return; }
  if (el.closest("#planClear")) { if (state.presetArm !== "clear") { state.presetArm = "clear"; renderPlan(); return; } plan = {d: [0, 1, 2, 3, 4, 5, 6].map(() => ({b: [], l: [], d: [], s: []}))}; savePlan(); state.presetArm = null; renderPlan(); return; }
  const pre = el.closest("[data-pre]"); if (pre) { const i = +pre.dataset.pre; if (!planEmpty() && state.presetArm !== i) { state.presetArm = i; renderPlan(true); return; }
    const p = PRESETS[i]; plan = {d: p.days.map(d => ({b: d.b.map(x => ({t: "r", id: x[0], n: x[1], mode: "fit"})), l: d.l.map(x => ({t: "r", id: x[0], n: x[1], mode: "fit"})), d: d.d.map(x => ({t: "r", id: x[0], n: x[1], mode: "fit"})), s: d.s.map(x => ({t: "r", id: x[0], n: x[1], mode: "fit"}))}))};
    savePlan(); state.presetArm = null; toast(T.loaded); renderPlan(); return; }
  /* shop */
  const sk = el.closest("[data-sk]"); if (sk && !el.closest("[data-srm]")) { const k = sk.dataset.sk; shop.done[k] = !shop.done[k]; saveShop(); sk.classList.toggle("done"); return; }
  const srm = el.closest("[data-srm]"); if (srm) { delete shop.items[srm.dataset.srm]; delete shop.done[srm.dataset.srm]; saveShop(); renderShop(); return; }
  if (el.closest("#shopDone")) { Object.keys(shop.done).forEach(k => { if (shop.done[k]) delete shop.items[k]; }); shop.done = {}; saveShop(); renderShop(); return; }
  if (el.closest("#shopClear")) { if (state.presetArm !== "shop") { state.presetArm = "shop"; renderShop(); return; } shop = {items: {}, done: {}, notes: []}; saveShop(); state.presetArm = null; renderShop(); return; }
  if (el.closest("#shopCopy")) { const txt = shopText(); const done2 = () => toast(T.copied);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done2).catch(() => { const ta = $("#shopTxt"); ta.value = txt; ta.classList.remove("vh"); ta.select(); });
    else { const ta = $("#shopTxt"); ta.value = txt; ta.classList.remove("vh"); ta.select(); } return; }
  /* me */
  const sx = el.closest("[data-sex]"); if (sx) { prof.sex = sx.dataset.sex; saveProf(); renderMe(); return; }
  const am = el.closest("[data-aim]"); if (am) { prof.aim = am.dataset.aim; saveProf(); renderMe(); return; }
  if (el.closest("#setGoal")) { const n = calcNorm(); if (n) { goal = {k: n.k, p: n.p, f: n.f, c: n.c}; store.set("brfy-goal", JSON.stringify(goal)); toast(T.goalSet); } return; }
  if (el.closest("#wSave")) { const v = +($("#wt").value || 0); if (v > 0) { weights[todayIso()] = v; prof.w = String(v); saveW(); saveProf(); renderMe(); } return; }
  const ag = el.closest("[data-ag]"); if (ag) { const g = ag.dataset.ag; prof.groups = prof.groups.includes(g) ? prof.groups.filter(x => x !== g) : prof.groups.concat(g); saveProf(); BANNED = bannedSet(); renderMe(); return; }
  const nek = el.closest("[data-nek]"); if (nek) { if (!prof.excl.includes(nek.dataset.nek)) prof.excl.push(nek.dataset.nek); saveProf(); BANNED = bannedSet(); renderMe(); return; }
  const nerm = el.closest("[data-nerm]"); if (nerm) { prof.excl = prof.excl.filter(k => k !== nerm.dataset.nerm); saveProf(); BANNED = bannedSet(); renderMe(); return; }
  const dm = el.closest("[data-dm]"); if (dm) { prof.defMode = dm.dataset.dm; saveProf(); renderMe(); return; }
  /* mine & generator */
  const dd = el.closest("[data-dday]"); if (dd) { const d = dishes.find(x => x.id === dd.dataset.dday); const per = dishTotal(d).map(v => v / (d.serv || 1)); addToDay({t: "d", id: d.id, n: 1, per, name: d.name}); return; }
  if (el.closest("#backMine")) { location.hash = "mine"; return; }
  if (el.closest("#genGo")) { const q = $("#gq").value.trim(); if (!q) { $("#gq").focus(); return; } runGen(q); renderGenOut(); $("#genOut").scrollIntoView({behavior: "smooth", block: "start"}); return; }
  const gx = el.closest("[data-gex]"); if (gx) { $("#gq").value = gx.dataset.gex; runGen(gx.dataset.gex); renderGenOut(); return; }
  const rr = el.closest("[data-reroll]"); if (rr) { gen.seeds[+rr.dataset.reroll] = Date.now() + "-" + Math.random(); renderGenOut(); return; }
  const gsv = el.closest("[data-gsave]"); if (gsv) { const s = +gsv.dataset.gsave, items = gen["items" + s]; dishes.push({id: Date.now().toString(36), name: genTitle(gen.req.type, items), serv: 1, type: gen.req.type, items: items.map(i => ({key: i.key, g: i.g}))}); saveDishes(); toast(T.saved); renderMine(); return; }
  const gdy = el.closest("[data-gday]"); if (gdy) { const s = +gdy.dataset.gday, items = gen["items" + s]; let m = [0, 0, 0, 0]; items.forEach(it => m = add4(m, mac(it.key, it.g))); addToDay({t: "x", n: 1, per: m, name: genTitle(gen.req.type, items)}); return; }
  if (el.closest("#phDel")) { delete draft.photo; renderBuilder(); return; }
  const dk = el.closest("[data-dk]"); if (dk) { draft.items.push({key: dk.dataset.dk, g: 100}); renderBuilder(); const s = $("#ds"); s && s.focus(); return; }
  const drm = el.closest("[data-drm]"); if (drm) { draft.items.splice(+drm.dataset.drm, 1); renderBuilder(); return; }
  if (el.closest("#cpAdd")) {
    const n = $("#cpn").value.trim(), c = ["#cpk", "#cpp", "#cpf", "#cpc"].map(s => +($(s).value || 0)), g = +($("#cpg").value || 0);
    if (!n || g <= 0) { $("#cpn").focus(); return; }
    draft.items.push({name: n, c, g}); renderBuilder(); return;
  }
  if (el.closest("#dSave")) {
    if (!draft.items.length) { toast(T.noIng); return; }
    draft.name = $("#dn").value.trim() || T.untitled; draft.serv = Math.max(1, +$("#dsv").value || 1);
    if (draft.id) { const i = dishes.findIndex(x => x.id === draft.id); dishes[i] = draft; } else { draft.id = Date.now().toString(36); dishes.push(draft); }
    if (!saveDishes() && draft.photo) { delete draft.photo; saveDishes(); toast(T.photoFail); } else toast(T.saved);
    draft = null; location.hash = "mine"; return;
  }
  if (el.closest("#dDel")) {
    if (!state.delArm) { state.delArm = true; el.closest("#dDel").textContent = T.delConfirm; return; }
    dishes = dishes.filter(x => x.id !== draft.id); saveDishes(); draft = null; state.delArm = false; location.hash = "mine"; return;
  }
  /* list */
  const f = el.closest("[data-f]");
  if (f) { e.stopPropagation(); const id = +f.dataset.f; favs.has(id) ? favs.delete(id) : favs.add(id); saveFav();
    if (/^#recipe/.test(location.hash)) { f.setAttribute("aria-pressed", favs.has(id)); f.textContent = favs.has(id) ? T.favOn : T.favAdd; } else { renderTabs(); renderList(); } return; }
  const tab = el.closest(".tab");
  if (tab && tab.tagName === "BUTTON") { state.fav = !!tab.dataset.fav && !state.fav; state.quick = !!tab.dataset.quick && !state.quick; state.cat = tab.dataset.c != null ? +tab.dataset.c : -1; renderTabs(); renderList(); return; }
  const cu = el.closest("[data-cu]"); if (cu) { state.cuis = cu.dataset.cu || null; renderList(); return; }
  if (el.closest("#showAll")) { state.showAll = true; renderList(); return; }
  const b = el.closest("[data-b]"); if (b) { state.base = state.base === b.dataset.b ? null : b.dataset.b; state.fopen = true; renderList(); return; }
  const w = el.closest("[data-w]"); if (w) { $("#q").value = state.q = w.dataset.w; $("#qx").hidden = false; renderList(); return; }
  const card = el.closest(".card[data-id]"); if (card) { location.hash = "recipe-" + card.dataset.id; return; }
  if (el.closest("#back")) { location.hash = ""; return; }
  if (el.closest("#reset")) { Object.assign(state, {cat: -1, quick: false, cuis: null, veg: "any", base: null, kcal: "any", prot: "any", sort: "def", q: "", fav: false}); $("#q").value = ""; $("#qx").hidden = true; renderTabs(); renderList(); return; }
  const li = el.closest(".ing li[data-i]"); if (li && !li.classList.contains("note") && !li.classList.contains("swp")) { const id = curRecipeId(), i = +li.dataset.i; done[id].has(i) ? done[id].delete(i) : done[id].add(i); li.classList.toggle("done"); return; }
  const pv = el.closest("[data-pv]"); if (pv) { const id = curRecipeId(); state.protOn[id] = pv.dataset.pv === "1"; renderRecipe(id); return; }
  if (el.closest("#qx")) { $("#q").value = state.q = ""; $("#qx").hidden = true; $("#q").focus(); renderList(); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#sheet").hidden) { closeSheet(); return; }
  if (e.key === "Enter" && e.target.id === "gq") { e.preventDefault(); $("#genGo").click(); return; }
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("card") && e.target.dataset.id) location.hash = "recipe-" + e.target.dataset.id;
});
document.addEventListener("change", e => {
  const id = e.target.id;
  if (id === "fk") state.kcal = e.target.value; else if (id === "fp") state.prot = e.target.value; else if (id === "fs") state.sort = e.target.value; else if (id === "fv") state.veg = e.target.value;
  else if (id === "svn") { const r = R.find(x => x.id === curRecipeId()); state.serv[r.id] = Math.max(1, Math.round(+e.target.value || 1)); renderRecipe(r.id); return; }
  else if (id === "pa" || id === "ph" || id === "pw") return;
  else if (id === "pact") { prof.act = e.target.value; saveProf(); renderMe(); return; }
  else if (id === "dph") { const f = e.target.files && e.target.files[0]; if (f) loadPhoto(f); return; }
  else if (e.target.dataset.eg != null) { const it = diary[state.date][+e.target.dataset.eg]; it.g = Math.max(0, +e.target.value || 0); saveDiary(); renderDay(); return; }
  else return;
  state.fopen = true; renderList();
});
document.addEventListener("input", e => {
  const id = e.target.id;
  if (id === "q") { state.q = e.target.value.trim(); $("#qx").hidden = !state.q; renderList(); }
  if (id === "sq") fillSubs(e.target.value);
  if (id === "pa" || id === "ph" || id === "pw") { prof[{pa: "age", ph: "h", pw: "w"}[id]] = e.target.value; saveProf(); $("#normOut").innerHTML = normOut(); }
  if (id === "cc") { look.custom = e.target.value; saveLook(); const c = document.querySelector(".custom"); c && c.setAttribute("data-on", "true"); document.querySelectorAll("[data-pal]").forEach(b => b.setAttribute("aria-pressed", "false")); }
  if (id === "ps") { sheetCtx.q = e.target.value; fillProd(); }
  if (id === "pks") { sheetCtx.q = e.target.value; fillPick(); }
  if (id === "nes") { $("#neres").innerHTML = resultsHTML(findFood(e.target.value), "data-nek"); }
  if (id === "pg") { sheetCtx.g = +e.target.value || 0; const m = $("#pmac"); if (m) m.textContent = fmtM(mac(sheetCtx.key, sheetCtx.g)); }
  if (id === "ds") { $("#dres").innerHTML = resultsHTML(findFood(e.target.value), "data-dk"); }
  if (id === "dn" && draft) draft.name = e.target.value;
  if (id === "dsv" && draft) { draft.serv = Math.max(1, +e.target.value || 1); updateTotals(); }
  if (e.target.dataset && e.target.dataset.dg != null && draft) { draft.items[+e.target.dataset.dg].g = Math.max(0, +e.target.value || 0); updateTotals(); }
});
function loadPhoto(file) {
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { const mx = 480, s = Math.min(1, mx / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    draft.photo = c.toDataURL("image/jpeg", .72); URL.revokeObjectURL(url); renderBuilder(); };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
window.addEventListener("hashchange", route);
route();
