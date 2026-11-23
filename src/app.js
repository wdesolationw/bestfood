const IMGS = DATA.imgs, R = DATA.recipes, LANGS = DATA.langs, ORDER = DATA.order, FOOD = DATA.food, SUBS = DATA.subs;
const PORTION = DATA.portion || {}, LOCAL = Object.keys(DATA.portion || {}).filter(k => !Object.values(DATA.brands || {}).some(b => b.items.includes(k)));
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
const BRANDS = DATA.brands || {}, BRANDOF = {}; Object.entries(BRANDS).forEach(([b, v]) => v.items.forEach(k => BRANDOF[k] = b));
const fname = k => (BRANDOF[k] && BRANDOF[k] !== "pizza" ? BRANDS[BRANDOF[k]].name + " · " : "") + (L().food[k] || LANGS.en.food[k] || k);
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
    ? {bg: hsl(h, 10 * k, 6), surface: hsl(h, 9 * k, 11), ink: hsl(h, 10 * k, 93), muted: hsl(h, 7 * k, 64), line: hsl(h, 8 * k, 19), hot: "#FF8A66", hotSoft: "#3A2119"}
    : {bg: hsl(h, 14 * k, 96), surface: "#FFFFFF", ink: hsl(h, 20 * k, 12), muted: hsl(h, 8 * k, 42), line: hsl(h, 12 * k, 90), hot: "#D9482B", hotSoft: "#FBE7E1"};
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
  const brandHit = new Set(Object.entries(BRANDS).filter(([b, v]) => q.split(" ").some(w => w.length > 1 && norm(v.name + " " + v.alias).split(" ").some(a => a.startsWith(w)))).flatMap(([b, v]) => v.items));
  const hit = keys.filter(k => brandHit.has(k) || norm(fname(k)).includes(q) || norm(LANGS.en.food[k]).includes(q));
  hit.sort((a, b) => (brandHit.has(b) - brandHit.has(a)) || (norm(fname(a)).indexOf(q) - norm(fname(b)).indexOf(q)));
  return hit.slice(0, brandHit.size ? 16 : 8);
}
let toastT = null;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.remove("out"); if (!el.hidden) { el.hidden = true; void el.offsetWidth; } el.hidden = false; clearTimeout(toastT);
  toastT = setTimeout(() => { if (reduceMotion()) { el.hidden = true; return; } el.classList.add("out"); toastT = setTimeout(() => { el.hidden = true; el.classList.remove("out"); }, 230); }, 2200); }
/* replay an entrance animation on freshly rendered content */
function animIn(el, cls = "swap") { if (!el || reduceMotion()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  clearTimeout(el["_t" + cls]); el["_t" + cls] = setTimeout(() => el.classList.remove(cls), 1400); } // later re-renders must not replay it
let rphoto = load("brfy-rphoto", {});
const recImg = r => rphoto[r.id] ? `<img src="${rphoto[r.id]}" alt="" loading="lazy" decoding="async" class="own">` : IMGS[r.id] ? `<img src="${IMGS[r.id]}" alt="" loading="lazy" decoding="async">` : r.kind && r.kind.startsWith("svg:") ? dishSVG(r.items.map(([i, k, g]) => ({key: k, g})), r.kind.slice(4), "r" + r.id) : "";
const timeLbl = r => r.time >= 600 ? "" : `<span class="pill o">${r.time} ${esc(t().min)}</span>`;
const VEGI = {
  1: '<path d="M5.5 18.5C5.5 10 10.5 5.5 19 5c0 8.5-4.5 13.5-13.5 13.5z"/><path d="M5.5 18.5 14 10"/>',
  2: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 7.5 9 4.5 3.5 4.5c0 5 3.3 8 8.5 8z"/><path d="M12 10.5c0-4 2.8-6.5 8.5-6.5 0 4.2-3 6.5-8.5 6.5z"/>'};
const vegLbl = r => r.veg ? `<span class="vgi v${r.veg}" role="img" title="${esc(r.veg === 2 ? t().vegan : t().vegetarian)}" aria-label="${esc(r.veg === 2 ? t().vegan : t().vegetarian)}"><svg viewBox="0 0 24 24" aria-hidden="true">${VEGI[r.veg]}</svg></span>` : "";

/* ---------- chrome & list ---------- */
function chrome(route) {
  const T = t();
  document.documentElement.lang = lang;
  $("#q").placeholder = T.ph; $("#q").setAttribute("aria-label", T.ph);
  $("#qx").setAttribute("aria-label", T.clear); $("#tabs").setAttribute("aria-label", T.cats); $("#foot").textContent = T.foot;
  $("#langCode").textContent = lang.toUpperCase(); $("#fltBtn").setAttribute("aria-label", T.fl); $("#langBtn").setAttribute("aria-label", T.langT); $("#lookBtn").setAttribute("aria-label", T.look);
  const names = {r: T.navR, day: T.navFood, mine: T.navMine, me: T.navMe};
  document.querySelectorAll("[data-nav]").forEach(a => { a.querySelector("span").textContent = names[a.dataset.nav]; if (a.dataset.nav === route) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
}
function renderTabs() {
  const T = t(), allOn = state.cat < 0 && !state.fav && !state.quick;
  const tab = (attr, on, label, n) => `<button class="tab" ${attr} aria-pressed="${on}">${esc(label)}${n != null ? ` <small>${n}</small>` : ""}</button>`;
  $("#tabs").innerHTML = tab('data-c="-1"', allOn, T.all, R.length) + tab('data-quick="1"', state.quick, T.quickT, R.filter(r => r.time <= 25).length) +
    CATORDER.map(i => tab(`data-c="${i}"`, state.cat === i && !state.fav && !state.quick, catShort(i), inCat(i))).join("") +
    `<a class="tab" href="#prep">${esc(T.prepT)}</a>` + tab('data-fav="1"', state.fav, T.fav, favs.size) + `<a class="tab" href="#zameny" id="subsLink">${esc(T.sub)}</a>`;
  const on = $("#tabs .tab[aria-pressed=\"true\"]"), box = $("#tabs");
  if (on && box) box.scrollLeft = Math.max(0, on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2);
}
let DOTD = null;
function dotdPick(A) { const pool = A.filter(r => IMGS[r.id]); if (!pool.length) return null; let hsh = 0; for (const ch of todayIso()) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0; return pool[hsh % pool.length]; }
function dishOfDay(A) {
  const T = t(), r = dotdPick(A); if (!r) return "";
  const x = RX(r), m = recipeMacros(r);
  return `<section class="dotd"><div class="card rcard wide" role="link" tabindex="0" data-id="${r.id}"><div class="dimg">${recImg(r)}</div>
    <span class="dtag">${esc(T.dotd)}</span>
    <div class="ov"><p class="t">${esc(x.title)}</p><div class="m"><b>${r0(m[0])}</b> ${esc(T.kcal)} · ${esc(T.p)} ${r.base.p == null ? "?" : r0(m[1])}${r.time < 600 ? ` · ${r.time} ${esc(T.min)}` : ""}</div></div></div></section>`;
}
/* ---------- cooking mode ---------- */
const cook = {on: false, i: 0, rid: null, timer: null, wake: null};
function stepMinutes(s) { const m = /^\[\[(\d+)(?:[–-](\d+))?\s*([^\]]*)\]\]/.exec(s); if (!m) return 0; const v = +m[1]; return /ч|h|год|сағ|სთ|Std/.test(m[3]) ? v * 60 : v; }
const mmss = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s2).padStart(2, "0"); };
function timerLeft() { const tm = cook.timer; if (!tm) return 0; return tm.paused ? tm.left : (tm.end - Date.now()) / 1000; }
function beep() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(o => { const g = ac.createGain(), os = ac.createOscillator(); os.frequency.value = 880; os.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.0001, ac.currentTime + o); g.gain.exponentialRampToValueAtTime(.3, ac.currentTime + o + .02); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + o + .3); os.start(ac.currentTime + o); os.stop(ac.currentTime + o + .32); }); } catch (e) {} try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {} }
function openCook(rid) {
  cook.on = true; cook.rid = rid; cook.i = 0;
  let el = $("#cook"); if (!el) { el = document.createElement("div"); el.id = "cook"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
  el.hidden = false; document.body.classList.add("cooking"); renderCook();
  try { navigator.wakeLock && navigator.wakeLock.request("screen").then(w => cook.wake = w).catch(() => {}); } catch (e) {}
}
function closeCook() { cook.on = false; const el = $("#cook"); if (el) el.hidden = true; document.body.classList.remove("cooking"); try { cook.wake && cook.wake.release(); } catch (e) {} cook.wake = null; }
function renderCook() {
  const el = $("#cook"); if (!el || !cook.on) return; const r = R.find(x => x.id === cook.rid); if (!r) return closeCook();
  const T = t(), x = RX(r), steps = x.steps, n = steps.length, i = cook.i, s = steps[i], mm = /^\[\[(.+?)\]\]\s*/.exec(s), txt = mm ? s.slice(mm[0].length) : s, mins = stepMinutes(s);
  const tm = cook.timer, run = tm && tm.step === i;
  let tbtn = "";
  if (mins) tbtn = run ? `<div class="ctimer${tm.paused ? " paused" : ""}"><b id="ctLeft">${mmss(timerLeft())}</b><button class="btn" id="ctPause">${esc(tm.paused ? T.tGo : T.tPause)}</button><button class="btn" id="ctReset">${esc(T.tReset)}</button></div>`
    : `<button class="btn main ctstart" id="ctStart" data-min="${mins}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/></svg>${esc(T.tStart.replace("{t}", mmss(mins * 60)))}</button>`;
  const other = tm && tm.step !== i ? `<button class="ctmini" data-cgo="${tm.step}">⏱ <b id="ctLeft">${mmss(timerLeft())}</b> · ${esc(T.cookStep.replace("{n}", tm.step + 1).replace("{m}", n))}</button>` : "";
  el.innerHTML = `<div class="ckbar"><button class="rbtn" id="ckClose" aria-label="${esc(T.done)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="ckt"><b>${esc(x.title)}</b><span>${esc(T.cookStep.replace("{n}", i + 1).replace("{m}", n))}</span></div>
      <button class="rbtn" id="ckIng" aria-label="${esc(T.ingT)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg></button></div>
    <div class="ckprog"><i style="width:${(i + 1) / n * 100}%"></i></div>
    ${other}
    <div class="ckbody">${mm ? `<em class="stt">${esc(mm[1])}</em>` : ""}<p class="cktext">${esc(txt)}</p>${tbtn}</div>
    ${cook.ing ? `<div class="cking"><h3>${esc(T.ingT)}</h3><ul>${x.ing.map(z => `<li>${/^<b>/.test(z) ? z : esc(z.replace(/<[^>]+>/g, ""))}</li>`).join("")}</ul></div>` : ""}
    <div class="cknav"><button class="btn" id="ckPrev"${i ? "" : " disabled"}>${esc(T.prevS)}</button>${i < n - 1 ? `<button class="btn main" id="ckNext">${esc(T.nextS)}</button>` : `<button class="btn main" id="ckFin">${esc(T.done)}</button>`}</div>`;
}
setInterval(() => { const tm = cook.timer; if (!tm || tm.paused) return; const left = timerLeft();
  document.querySelectorAll("#ctLeft").forEach(e => e.textContent = mmss(left));
  if (left <= 0 && !tm.rang) { tm.rang = true; beep(); toast(t().tDone.replace("{n}", tm.step + 1)); cook.timer = null; renderCook(); } }, 500);
document.addEventListener("keydown", e => { if (!cook.on) return; if (e.key === "Escape") closeCook(); else if (e.key === "ArrowRight") $("#ckNext") && $("#ckNext").click(); else if (e.key === "ArrowLeft") $("#ckPrev") && $("#ckPrev").click(); });
(() => { let x0 = null; document.addEventListener("touchstart", e => { if (cook.on && e.target.closest("#cook .ckbody")) x0 = e.touches[0].clientX; }, {passive: true});
  document.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) { const b = $(dx < 0 ? "#ckNext" : "#ckPrev"); b && !b.disabled && b.click(); } }, {passive: true}); })();
function recCard(r) {
  if (DOTD === null) { DOTD = (dotdPick(R.filter(o => !warnOf(o).length)) || {}).id || 0; }
  const T = t(), x = RX(r), m = recipeMacros(r), w = warnOf(r);
  const badges = (r.var ? `<span class="bdg">${esc(T.plus)}</span>` : "") + (hasSwaps(r) || autoOf(r) ? `<span class="bdg">⇄</span>` : "") + (w.length ? `<span class="bdg w">⚠</span>` : "") + vegLbl(r);
  return `<div class="card rcard" role="link" tabindex="0" data-id="${r.id}">
    <div class="dimg">${recImg(r)}</div>
    <button class="fav" data-f="${r.id}" aria-pressed="${favs.has(r.id)}" aria-label="${esc(T.favaria)}">${favs.has(r.id) ? "★" : "☆"}</button>
    ${badges ? `<div class="bdgs">${badges}</div>` : ""}
    <div class="ov">${DOTD === r.id ? `<span class="dtag in">${esc(T.dotd)}</span>` : ""}<p class="t">${esc(x.title)}</p><div class="m"><b>${r0(m[0])}</b> ${esc(T.kcal)} · ${esc(T.p)} ${r.base.p == null ? "?" : r0(m[1])}${r.time < 600 ? ` · ${r.time} ${esc(T.min)}` : ""}</div></div></div>`;
}
const vt = {id: null}, laneX = {}; let listY = 0;
const saveListPos = () => { listY = scrollY; document.querySelectorAll(".lane").forEach(l => laneX[l.dataset.ln] = l.scrollLeft); };
function renderList() {
  const T = t(), A = filtered(), hidden = BANNED.size && !state.showAll ? filtered(true).length - A.length : 0;
  let h = "";
  const nf = (state.cuis ? 1 : 0) + (state.base ? 1 : 0) + (state.kcal !== "any" ? 1 : 0) + (state.prot !== "any" ? 1 : 0) + (state.sort !== "def" ? 1 : 0) + (state.veg !== "any" ? 1 : 0);
  h += `<details class="fl" id="fl"${state.fopen ? " open" : ""}><summary>${esc(T.fl)} ${nf ? `<b>${nf}</b>` : ""}</summary>
    <div class="filters">
    <label>${esc(T.fk)}<select id="fk"><option value="any">${esc(T.any)}</option><option value="300">${esc(T.k300)}</option><option value="500">${esc(T.k500)}</option><option value="600">${esc(T.k600)}</option></select></label>
    <label>${esc(T.fp)}<select id="fp"><option value="any">${esc(T.anyp)}</option><option value="20">${esc(T.p20)}</option><option value="30">${esc(T.p30)}</option><option value="40">${esc(T.p40)}</option></select></label>
    <label>${esc(T.fs)}<select id="fs"><option value="def">${esc(T.s0)}</option><option value="p">${esc(T.sp)}</option><option value="k">${esc(T.sk)}</option><option value="t">${esc(T.st0)}</option></select></label>
    <label>${esc(T.vegF)}<select id="fv"><option value="any">${esc(T.any)}</option><option value="veg">${esc(T.vegetarian)}</option><option value="vegan">${esc(T.vegan)}</option></select></label></div>
    <p class="flbl">${esc(T.cuisT)}</p><div class="chips" role="group" aria-label="${esc(T.cuisT)}">` + [null, ...CUIS].map(c => `<button class="chip" data-cu="${c || ""}" aria-pressed="${state.cuis === c}">${esc(c ? T.cu[c] : T.allCu)}</button>`).join("") + `</div>
    <p class="flbl">${esc(T.base)}</p><div class="chips" role="group" aria-label="${esc(T.base)}">` + BASES.map(b => `<button class="chip" data-b="${b}" aria-pressed="${state.base === b}">${esc(L().bases[b])}</button>`).join("") + `</div>
    <p class="flbl">${esc(T.quickl)}</p><div class="chips" role="group" aria-label="${esc(T.quickl)}">` + L().quick.map(w => `<button class="chip" data-w="${esc(w)}" aria-pressed="${state.q === w}">${esc(w)}</button>`).join("") + `</div></details>`;
  const lanes = !nf && !state.q && state.cat < 0 && !state.fav && !state.quick;
  if (lanes) DOTD = (dotdPick(A) || {}).id || null;
  if (!lanes) h += (state.cat >= 0 && !state.fav && !state.quick) ? `<p class="sub">${esc(catSub(state.cat))}</p>` : `<p class="sub">${esc(T.found)}${A.length}</p>`;
  if (hidden) h += `<p class="hint">${esc(T.hiddenN.replace("{n}", hidden))} <button class="linkbtn" id="showAll" style="padding:0">${esc(T.showAll)}</button></p>`;
  if (!A.length) h += `<div class="empty"><b>${esc(T.none)}</b>${esc(T.none2)}<br><br><button class="btn" id="reset">${esc(T.reset)}</button></div>`;
  else if (lanes) h += dishOfDay(A) + CATORDER.map(i => { const L2 = A.filter(r => r.cat === i); if (!L2.length) return "";
    return `<section class="lsec"><div class="lhd"><h3>${esc(catName(i))}</h3><button class="lmore" data-lane="${i}">${esc(T.all)} ${L2.length} ›</button></div>
      <div class="lane" data-ln="${i}">${L2.map(recCard).join("")}</div></section>`; }).join("");
  else h += `<div class="list">` + A.map(recCard).join("") + `</div>`;
  $("#app").innerHTML = h;
  if (lanes) document.querySelectorAll(".lane").forEach(l => { const x = laneX[l.dataset.ln]; if (x) l.scrollLeft = x; });
  if (vt.id != null) { const im = document.querySelector(`.rcard[data-id="${vt.id}"] .dimg > :first-child`); if (im) im.style.viewTransitionName = "dish"; }
  $("#fl").addEventListener("toggle", e => { state.fopen = e.target.open; $("#fltBtn").setAttribute("aria-expanded", e.target.open); });
  $("#fltDot").hidden = !nf; $("#fltBtn").setAttribute("aria-expanded", !!state.fopen);
  $("#fk").value = state.kcal; $("#fp").value = state.prot; $("#fs").value = state.sort; $("#fv").value = state.veg;
}

/* ---------- rings ---------- */
const MACC = ["var(--c-p)", "var(--c-f)", "var(--c-c)"];
// parts: [[value, color], ...]; total: full circle value (defaults to sum of parts)
function donut(parts, total, cls) {
  const R0 = 42, C = 2 * Math.PI * R0, sum = total || parts.reduce((a, [v]) => a + v, 0);
  let off = 0, arcs = "";
  if (sum > 0) parts.forEach(([v, col]) => { const len = Math.max(0, Math.min(v, sum - off)) / sum * C; if (len > 0) arcs += `<circle r="${R0}" cx="50" cy="50" stroke="${col}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off / sum * C}"/>`; off += v; });
  return `<svg class="${cls || "donut"}" viewBox="0 0 100 100" aria-hidden="true"><circle r="${R0}" cx="50" cy="50" class="trk"/>${arcs}</svg>`;
}
const macName = i => (t().mac || LANGS.en.ui.mac)[i];

/* ---------- recipe ---------- */
function macroBlock(r) {
  const T = t(), mode = modeOf(r), m = recipeMacros(r), raw = r.var ? (mode === "fit" && state.protOn[r.id] ? r.var.on : r.var.off) : r.base, k = servOf(r);
  const cells = [m[0], raw.p == null ? null : m[1], raw.f == null ? null : m[2], raw.c == null ? null : m[3]];
  const src = mode === "classic" ? T.calc : T[r.src];
  const kc = [cells[1] * 4, cells[2] * 9, cells[3] * 4], ok = cells.slice(1).every(c => c != null), ks = ok ? kc.reduce((a, b) => a + b, 0) : 0;
  return `<div class="mcard"><div class="ring">${donut(ok ? kc.map((v, i) => [v, MACC[i]]) : [])}<div class="rc"><b>${r0(m[0])}</b><span>${esc(T.kcal)}</span></div></div>
    <div class="mleg">${[1, 2, 3].map(i => `<div class="ml"><i style="background:${MACC[i - 1]}"></i><span>${esc(macName(i - 1))}</span><b>${cells[i] == null ? "–" : r0(cells[i]) + " " + esc(T.grams)}</b><small>${ok && ks ? Math.round(kc[i - 1] / ks * 100) + "%" : ""}</small></div>`).join("")}</div></div>
  <p class="macnote">${esc(T.perOne)} · ${esc(T.whole)} (${k}): ${r0(m[0] * k)} ${esc(T.kcal)}. ${esc(src)}</p>`;
}
function renderRecipe(id) {
  const r = R.find(x => x.id === id); if (!r) return renderList();
  const T = t(), x = RX(r), mode = modeOf(r), k = servOf(r) / r.n, eff = effItems(r), byIdx = {};
  eff.forEach(e => byIdx[e.idx] = e);
  done[id] = done[id] || new Set();
  const mm = recipeMacros(r), ico = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const tags = [[`cat:${r.cat}`, catName(r.cat)], ...r.cuis.map(c => [`cu:${c}`, T.cu[c]]), ...(r.veg ? [[`veg:${r.veg === 2 ? "vegan" : "veg"}`, r.veg === 2 ? T.vegan : T.vegetarian]] : []), ...r.filters.filter(f => L().bases[f]).map(f => [`b:${f}`, L().bases[f]])];
  let h = `<div class="rbar"><button class="rbtn" id="back" aria-label="${esc(T.back)}">${ico('<path d="M15 5l-7 7 7 7"/>')}</button>
    <div class="rbar-r"><button class="rbtn rfav" data-f="${r.id}" aria-pressed="${favs.has(r.id)}" aria-label="${esc(favs.has(r.id) ? T.favOn : T.favAdd)}" title="${esc(favs.has(r.id) ? T.favOn : T.favAdd)}">${ico('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>')}</button>
    <button class="rbtn" id="toPlan" aria-label="${esc(T.addPlan)}" title="${esc(T.addPlan)}">${ico('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5"/>')}</button>
    <button class="rbtn" id="toShop" aria-label="${esc(T.addShop)}" title="${esc(T.addShop)}">${ico('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>')}</button>
    <button class="rmain" id="toDay">${esc(T.addDay)}</button></div></div>
  <div class="hero"><div class="dimg big">${recImg(r)}</div><label class="phbtn" for="rphIn" title="${esc(T.myPhoto)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span class="vh">${esc(T.myPhoto)}</span></label><input type="file" id="rphIn" accept="image/*" hidden>${rphoto[r.id] ? `<button class="linkbtn phreset" id="rphReset">${esc(T.photoReset)}</button>` : ""}</div>
  <div class="rstats"><div><span>${esc(T.goalK)}</span><b>${r0(mm[0])}</b></div><div><span>${esc(macName(0))}</span><b>${r.base.p == null ? "–" : r0(mm[1]) + " " + esc(T.grams)}</b></div>${r.time < 600 ? `<div><span>${esc(T.timeL)}</span><b>${r.time} ${esc(T.min)}</b></div>` : ""}<div><span>${esc(T.servings)}</span><b>${servOf(r)}</b></div></div>
  <h1 class="rtitle">${esc(x.title)}</h1>
  <div class="rtags">${tags.map(([k, l]) => `<button class="rtag" data-tg="${esc(k)}">${esc(l)}</button>`).join("")}</div>`;
  h += `<div class="seg" role="group" aria-label="${esc(T.ver)}"><button data-md="fit" aria-pressed="${mode === "fit"}">${esc(T.modeFit)}</button><button data-md="classic" aria-pressed="${mode === "classic"}">${esc(T.modeClassic)}</button></div>`;
  if (r.var && mode === "fit") h += ` <div class="seg" role="group" aria-label="${esc(T.ver)}"><button data-pv="0" aria-pressed="${!state.protOn[r.id]}">${esc(T.noP)}</button><button data-pv="1" aria-pressed="${!!state.protOn[r.id]}">${esc(T.withP)}</button></div>`;
  h += `<p class="hint" style="margin-top:8px">${esc(mode === "fit" ? T.modeFitD : T.modeClassicD)}</p>`;
  h += `<div id="mac">${macroBlock(r)}</div>`;
  h += `<div class="servrow"><span>${esc(T.servings)}</span><div class="qty"><button data-sv="-1" aria-label="−">−</button><input id="svn" type="number" inputmode="numeric" min="1" value="${servOf(r)}" aria-label="${esc(T.servings)}"><button data-sv="1" aria-label="+">+</button></div></div>`;
  if (r.items.length) h += `<div class="row2"><button class="btn" id="myVer">${esc(T.myVersion)}</button></div>`;
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
  h += `<div class="sthd"><h3>${esc(T.steph)}</h3><button class="btn main" id="cookGo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>${esc(T.cookBtn)}</button></div><ol class="steps">` + x.steps.map(s => { const m = /^\[\[(.+?)\]\]\s*/.exec(s);
    return `<li><span>${m ? `<em class="stt">${esc(m[1])}</em>` : ""}${esc(m ? s.slice(m[0].length) : s)}</span></li>`; }).join("") + `</ol>`;
  if (x.storage) h += `<div class="box"><b>${esc(T.stor)}</b> ${esc(x.storage)}</div>`;
  if (x.note) h += `<div class="box">${esc(x.note)}</div>`;
  const rel = R.filter(o => o.cat === r.cat && o.id !== r.id && !(BANNED.size && !state.showAll && o.items.some(([i, kk]) => banned(kk)))).slice(0, 12);
  if (rel.length) h += `<section class="lsec rrel"><div class="lhd"><h3>${esc(T.related)}</h3></div><div class="lane">${rel.map(recCard).join("")}</div></section>`;
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
const slotNow = () => { const h = new Date().getHours(); return h < 11 ? "b" : h < 16 ? "l" : h < 21 ? "d" : "s"; };
const entrySlot = e => e.m || "s";
function addToDay(e, date, slot) { const d = date || state.date; e.m = e.m || slot || slotNow(); (diary[d] = diary[d] || []).push(e); saveDiary(); toast(t().added + " · " + t().slot[e.m]); }
function recentFoods() {
  const seen = new Map();
  Object.keys(diary).sort().reverse().slice(0, 30).forEach(d => (diary[d] || []).slice().reverse().forEach(e => { if (e.t === "p" && e.key && FOOD[e.key] && !seen.has(e.key)) seen.set(e.key, e.g); }));
  return [...seen].slice(0, 8);
}
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
    const prot = n === T.goalP, over = v > g, bad = over && !prot && v > g * 1.05, pct = Math.min(100, v / g * 100);
    return `<div class="goalrow"><div><span>${esc(n)}: ${r0(v)} / ${r0(g)}</span><span class="${bad ? "up" : ""}">${prot && over ? "✓ " + esc(T.chDone) : esc(over ? T.over : T.left) + " " + r0(Math.abs(g - v)) + " " + esc(u)}</span></div><div class="bar${bad ? " over" : ""}"><i style="width:${pct}%"></i></div></div>`;
  }).join("") + `</div>`;
}
function daySummary(tot) {
  const T = t(), gk = +goal.k || 0, left = gk - tot[0], over = left < 0;
  const ring = gk ? donut([[tot[0], over ? "var(--hot)" : "var(--accent)"]], gk, "donut big") : donut([[tot[1] * 4, MACC[0]], [tot[2] * 9, MACC[1]], [tot[3] * 4, MACC[2]]], 0, "donut big");
  const center = gk ? `<b class="${over ? "up" : ""}">${r0(Math.abs(left))}</b><span>${esc(over ? T.over : T.left)}</span>` : `<b>${r0(tot[0])}</b><span>${esc(T.kcal)}</span>`;
  const rows = gk ? [[T.goal, gk], [T.eaten || LANGS.en.ui.eaten, tot[0]], [over ? T.over : T.left, Math.abs(left)]] : [[T.eaten || LANGS.en.ui.eaten, tot[0]]];
  const gm = [+goal.p || 0, +goal.f || 0, +goal.c || 0];
  return `<div class="sumcard"><div class="sumtop"><div class="ring big">${ring}<div class="rc">${center}</div></div>
    <div class="sumrows">${rows.map(([n, v]) => `<div><span>${esc(n)}</span><b>${r0(v)} <small>${esc(T.kcal)}</small></b></div>`).join("")}</div></div>
    <div class="mbars">${[0, 1, 2].map(i => { const v = tot[i + 1], g = gm[i], pct = g ? Math.min(100, v / g * 100) : 0;
      return `<div class="mb"><div class="mbh"><span>${esc(macName(i))}</span><b>${r0(v)}${g ? " / " + r0(g) : ""} ${esc(T.grams)}</b></div><div class="bar"><i style="width:${g ? pct : (v > 0 ? 100 : 0)}%;background:${MACC[i]}${g ? "" : ";opacity:.35"}"></i></div></div>`; }).join("")}</div></div>`;
}
function renderDay() {
  const T = t(), list = diary[state.date] || [];
  let tot = [0, 0, 0, 0]; list.forEach(e => tot = add4(tot, entryMacros(e)));
  let h = foodSeg("day") + `<div class="daynav"><button class="iconbtn" id="dPrev" aria-label="←">‹</button><b>${esc(dateLabel())}</b><button class="iconbtn" id="dNext" aria-label="→">›</button></div>`;
  h += daySummary(tot);
  if (!(+goal.k > 0)) h += `<p class="hint" style="margin-top:10px">${esc(T.noGoal)} <a href="#me">${esc(T.calcLink)}</a></p>`;
  const wv = water[state.date] || 0, wg = waterGoal();
  h += `<div class="water"><div><b>${esc(T.waterT)}</b><span class="subtle">${fnum(wv / 1000)} / ${fnum(wg / 1000)} ${esc(T.liters)}</span></div><div class="bar"><i style="width:${Math.min(100, wv / wg * 100)}%;background:#3E8ED0"></i></div>
    <div class="qty"><button data-wt="-250" aria-label="−">−</button><span class="subtle">250 ${esc(T.ml)}</span><button data-wt="250" aria-label="+">+</button></div></div>`;
  h += `<div class="row2"><button class="btn" id="copyY">${esc(T.copyY)}</button><a class="btn" href="#mine">${esc(T.navMine)}</a></div>`;
  const row = (e, i) => {
    const m = entryMacros(e);
    const qty = e.t === "p"
      ? `<div class="qty"><input type="number" inputmode="decimal" min="0" data-eg="${i}" value="${r0(e.g)}" aria-label="${esc(T.grams)}"><span class="x">${esc(T.grams)}</span><button data-erm="${i}" aria-label="${esc(T.remove)}">✕</button></div>`
      : `<div class="qty"><button data-en="${i}" data-d="-0.5" aria-label="−">−</button><span style="min-width:34px;text-align:center;font-weight:800">${fnum(e.n)}</span><button data-en="${i}" data-d="0.5" aria-label="+">+</button><button data-erm="${i}" aria-label="${esc(T.remove)}">✕</button></div>`;
    return `<div class="entry"><div><div class="nm">${esc(entryName(e))}</div><div class="sub2">${e.t === "p" ? "" : fnum(e.n) + " " + esc(T.portions) + " · "}${esc(fmtM(m))}</div></div>${qty}</div>`;
  };
  h += SLOTS.map(sl => { const it = list.map((e, i) => [e, i]).filter(([e]) => entrySlot(e) === sl), kc = it.reduce((a, [e]) => a + entryMacros(e)[0], 0);
    return `<section class="meal"><div class="mhd"><b>${esc(T.slot[sl])}</b><span>${it.length ? r0(kc) + " " + esc(T.kcal) : ""}</span><button class="rbtn madd" data-addm="${sl}" aria-label="${esc(T.addProd)} · ${esc(T.slot[sl])}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>${it.length ? `<div class="entries">${it.map(([e, i]) => row(e, i)).join("")}</div>` : ""}</section>`; }).join("");
  if (!list.length) h += `<p class="hint">${esc(T.emptyDay)}</p>`;
  h += `<p class="note2">${esc(T.storageNote)}</p>`;
  $("#app").innerHTML = h;
}

const foodSeg = cur => `<div class="seg3">` + [["day", t().today], ["stats", t().statsT], ["plan", t().navPlan], ["shop", t().shopT]].map(([k, l]) => `<a href="#${k}"${k === cur ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("") + `</div>`;

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
/* ---------- auto week plan ---------- */
const SLOT_CATS = {b: [1, 2, 3], l: [0, 7, 4, 10], d: [0, 4, 7, 11, 10], s: [8, 5, 3, 9]}, SLOT_SHARE = {b: .25, l: .35, d: .3, s: .1};
function buildWeek() {
  const gk = +goal.k, gp = +goal.p || 0; if (!(gk > 0)) return null;
  const ok = r => !warnOf(r).length && recipeMacros(r)[0] > 40;
  const pool = {}; SLOTS.forEach(s => pool[s] = R.filter(r => SLOT_CATS[s].includes(r.cat) && ok(r)));
  const used = {}, mode = prof.defMode || "fit", rnd = n => Math.floor(Math.random() * n);
  const days = [0, 1, 2, 3, 4, 5, 6].map(di => {
    let best = null;
    for (let tr = 0; tr < 160; tr++) {
      const pick = {}; let k = 0, p = 0, pen = 0;
      for (const s of SLOTS) { const L = pool[s]; if (!L.length) continue; const r = L[rnd(L.length)], m = recipeMacros(r, mode);
        const n = Math.min(2.5, Math.max(.5, Math.round(gk * SLOT_SHARE[s] / m[0] * 2) / 2));
        pick[s] = {r, n}; k += m[0] * n; p += m[1] * n; pen += (used[r.id] || 0) * .12; }
      const score = Math.abs(k - gk) / gk + (gp ? Math.max(0, gp - p) / gp * 1.5 + Math.max(0, p - gp * 1.25) / gp * .6 : 0) + pen;
      if (!best || score < best.score) best = {score, pick, k, p};
    }
    Object.values(best.pick).forEach(({r}) => used[r.id] = (used[r.id] || 0) + 1);
    return best;
  });
  plan = {d: days.map(b => { const o = {b: [], l: [], d: [], s: []}; SLOTS.forEach(s => { const x = b.pick[s]; if (x) o[s].push({t: "r", id: x.r.id, n: x.n, mode}); }); return o; })};
  savePlan();
  return {k: r0(days.reduce((a, b) => a + b.k, 0) / 7), p: r0(days.reduce((a, b) => a + b.p, 0) / 7)};
}
function renderPlan(showPresets) {
  showPresets = showPresets || planEmpty();
  const T = t(), di = state.planDay, day = plan.d[di];
  let h = foodSeg("plan");
  h += `<section class="autop"><div><b>${esc(T.autoPlan)}</b><p>${esc(T.autoPlanD)}</p></div><button class="btn main" id="autoPlan">${esc(state.presetArm === "auto" ? T.sureAgain : T.autoPlan)}</button></section>`;
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
  let h = foodSeg("shop");
  h += `<div class="row2"><button class="btn main" id="shopAdd">${esc(T.addProd)}</button><button class="btn" id="shopCopy">${esc(T.copy)}</button><button class="btn" id="shopDone">${esc(T.clearDone)}</button><button class="btn danger" id="shopClear">${esc(state.presetArm === "shop" ? T.sureAgain : T.clearAll)}</button></div>`;
  if (!ks.length) h += `<div class="empty">${esc(T.shopEmpty)}</div>`;
  else { const nd = ks.filter(k => shop.done[k]).length; h += `<div class="shprog"><span>${esc(T.bought.replace("{a}", nd).replace("{b}", ks.length))}</span><div class="bar"><i style="width:${nd / ks.length * 100}%"></i></div></div>`; }
  if (ks.length) h += SHOPORDER.map(c => { const kk = ks.filter(k => SHOPCAT[k] === c).sort((a, b) => fname(a).localeCompare(fname(b))); if (!kk.length) return "";
    return `<p class="lbl shc"><span>${esc(T.shopCat[c])}</span><span>${kk.filter(k => shop.done[k]).length}/${kk.length}</span></p><ul class="shop">` + kk.map(k => `<li class="${shop.done[k] ? "done" : ""}" data-sk="${k}"><span>${esc(fname(k))}</span><b>${gfmt(shop.items[k])}</b><button data-srm="${k}" aria-label="${esc(T.remove)}">✕</button></li>`).join("") + `</ul>`; }).join("");
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
/* ---------- coach report & backup ---------- */
function coachReport() {
  const T = t(), ds = [...Array(7)].map((_, i) => isoAgo(6 - i)), dm = d => d.slice(8) + "." + d.slice(5, 7);
  const L = [T.rpHead.replace("{a}", dm(ds[0])).replace("{b}", dm(ds[6]))];
  if (+goal.k > 0) L.push(T.rpNorm.replace("{k}", r0(+goal.k)).replace("{p}", r0(+goal.p || 0)));
  L.push("");
  ds.forEach(d => { const tt = dayTot(d), w = water[d] || 0, wd = (new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8)).getDay() + 6) % 7;
    L.push(`${wdName(wd)} ${dm(d)}: ` + (logged(d) ? `${r0(tt[0])} ${T.kcal} · ${T.p} ${r0(tt[1])} · ${T.fL} ${r0(tt[2])} · ${T.cL} ${r0(tt[3])}` : T.rpEmpty) + (w ? ` · ${T.rpWater} ${fnum(w / 1000)} ${T.liters}` : "")); });
  const lg = ds.filter(logged), av = i => lg.length ? r0(lg.reduce((a, d) => a + dayTot(d)[i], 0) / lg.length) : 0;
  L.push(""); if (lg.length) L.push(T.rpAvg.replace("{k}", av(0)).replace("{p}", av(1)));
  L.push(T.rpDays.replace("{n}", lg.length));
  const low = lg.filter(d => dayTot(d)[0] < 1000).length; if (low) L.push("⚠ " + T.rpLow.replace("{n}", low));
  const wk = Object.keys(weights).filter(d => d >= ds[0]).sort(); if (wk.length) { const a = +weights[wk[0]], b = +weights[wk[wk.length - 1]], dd = Math.round((b - a) * 10) / 10;
    L.push(T.rpWeight.replace("{a}", fnum(a)).replace("{b}", fnum(b)).replace("{d}", (dd > 0 ? "+" : "") + fnum(dd))); }
  return L.join("\n");
}
const BK_KEYS = () => Object.keys(localStorage).filter(k => k.startsWith("brfy-"));
function backupJSON() { const o = {app: "bestfood", v: 1, at: new Date().toISOString(), data: {}}; try { BK_KEYS().forEach(k => o.data[k] = localStorage.getItem(k)); } catch (e) {} return JSON.stringify(o); }
const toB64 = s => btoa(unescape(encodeURIComponent(s))), fromB64 = s => decodeURIComponent(escape(atob(s.replace(/\s+/g, ""))));
function restoreBackup(txt) {
  let o; try { o = JSON.parse(txt.trim().startsWith("{") ? txt : fromB64(txt.trim())); } catch (e) { o = null; }
  if (!o || o.app !== "bestfood" || typeof o.data !== "object") { toast(t().bkBad); return false; }
  try { BK_KEYS().forEach(k => localStorage.removeItem(k)); Object.entries(o.data).forEach(([k, v]) => { if (k.startsWith("brfy-")) localStorage.setItem(k, v); }); } catch (e) { toast(t().bkBad); return false; }
  toast(t().bkDone); setTimeout(() => location.reload(), 600); return true;
}
async function copyText(txt, msg) { try { await navigator.clipboard.writeText(txt); toast(msg); } catch (e) { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast(msg); } catch (e2) {} ta.remove(); } }

/* ---------- progress ---------- */
const isoAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const dayTot = d => (diary[d] || []).reduce((a, e) => add4(a, entryMacros(e)), [0, 0, 0, 0]);
const logged = d => (diary[d] || []).length > 0;
const onTarget = d => { const g = +goal.k, tt = dayTot(d); return logged(d) && g > 0 && Math.abs(tt[0] - g) <= g * .1 && (!(+goal.p > 0) || tt[1] >= +goal.p * .9); };
function streak(fn) { let n = 0, i = logged(todayIso()) ? 0 : 1; while (fn(isoAgo(i))) { n++; i++; } return n; }
function weightAvg(from, to) { const v = Object.keys(weights).filter(d => d >= isoAgo(to) && d <= isoAgo(from)).map(d => +weights[d]).filter(x => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
function checkIn() {
  const T = t(), gk = +goal.k; if (!(gk > 0)) return {msg: T.noGoal};
  const days = [...Array(7)].map((_, i) => isoAgo(i + 1)).filter(logged), avg = days.length ? days.reduce((a, d) => a + dayTot(d)[0], 0) / days.length : 0;
  if (days.length >= 3 && avg < gk * .7) return {msg: T.chkLow.replace("{a}", r0(avg)).replace("{g}", r0(gk)), warn: true};
  const last = load("brfy-checkin", null); if (last) { const left = 14 - Math.round((new Date(todayIso()) - new Date(last)) / 864e5); if (left > 0) return {msg: T.chkWait.replace("{n}", left)}; }
  const now = weightAvg(0, 6), before = weightAvg(14, 20); if (now == null || before == null) return {msg: T.chkNeed};
  const d = now - before, ds = (d > 0 ? "+" : "") + fnum(Math.round(d * 10) / 10), w = now, aim = prof.aim;
  let x = 0, key = "chkOk";
  if (aim === "lose") { if (d > -0.2) { x = -150; key = "chkLower"; } else if (-d > w * .02) { x = 150; key = "chkRaise"; } }
  else if (aim === "gain") { if (d < 0.2) { x = 150; key = "chkGainUp"; } else if (d > 1) { x = -150; key = "chkGainDown"; } }
  else if (Math.abs(d) > 0.6) { x = d > 0 ? -100 : 100; key = "chkMaint"; }
  return {msg: T[key].replace("{d}", ds).replace("{x}", Math.abs(x)), x, k: Math.round((gk + x) / 10) * 10};
}
const CHALL = [
  ["ch1", 7, d => { const ms = SLOTS.map(s => (diary[d] || []).filter(e => entrySlot(e) === s)).filter(a => a.length); return ms.length > 0 && ms.every(a => a.reduce((s, e) => s + entryMacros(e)[1], 0) >= 20); }],
  ["ch2", 7, d => (water[d] || 0) >= waterGoal()],
  ["ch3", 5, d => { const g = +goal.k; return g > 0 && logged(d) && Math.abs(dayTot(d)[0] - g) <= g * .1; }],
  ["ch4", 7, logged],
];
function barChart(n) {
  const T = t(), ds = [...Array(n)].map((_, i) => isoAgo(n - 1 - i)), vals = ds.map(d => dayTot(d)), gk = +goal.k || 0;
  const W = 340, H = 150, pad = 18, mx = Math.max(gk * 1.25, ...vals.map(v => v[0]), 1), bw = (W - pad * 2) / n, y = v => H - 22 - (v / mx) * (H - 34);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="schart" role="img" aria-label="${esc(T.goalK)}">`;
  if (gk) s += `<line x1="${pad}" x2="${W - pad}" y1="${y(gk).toFixed(1)}" y2="${y(gk).toFixed(1)}" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="${W - pad}" y="${(y(gk) - 4).toFixed(1)}" text-anchor="end" class="ct">${r0(gk)}</text>`;
  vals.forEach((v, i) => { const x = pad + i * bw + bw * .18, w = bw * .64, top = y(v[0]), over = gk && v[0] > gk * 1.1, low = gk && v[0] > 0 && v[0] < gk * .7;
    s += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(H - 22 - top).toFixed(1)}" rx="${Math.min(4, w / 2).toFixed(1)}" fill="${over ? "var(--hot)" : "var(--accent)"}"${low ? ' opacity=".4"' : ""}/>`;
    if (n <= 7) s += `<text x="${(x + w / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ct">${esc(wdName((new Date(+ds[i].slice(0, 4), +ds[i].slice(5, 7) - 1, +ds[i].slice(8)).getDay() + 6) % 7))}</text>`; });
  if (n > 7) s += `<text x="${pad}" y="${H - 6}" class="ct">${ds[0].slice(5).split("-").reverse().join(".")}</text><text x="${W - pad}" y="${H - 6}" text-anchor="end" class="ct">${ds[n - 1].slice(5).split("-").reverse().join(".")}</text>`;
  return s + `</svg>`;
}
function renderStats() {
  const T = t(), n = state.statN || 7, ds = [...Array(n)].map((_, i) => isoAgo(i)).filter(logged);
  const avg = i => ds.length ? r0(ds.reduce((a, d) => a + dayTot(d)[i], 0) / ds.length) : "–";
  let h = foodSeg("stats");
  h += `<div class="streaks"><div><b>${streak(logged)}</b><span>${esc(T.streakLog)}</span></div><div><b>${streak(onTarget)}</b><span>${esc(T.streakNorm)}</span></div></div>`;
  h += `<div class="seg" role="group"><button data-sn="7" aria-pressed="${n === 7}">${esc(T.days7)}</button><button data-sn="30" aria-pressed="${n === 30}">${esc(T.days30)}</button></div>`;
  h += `<div class="mebox schartbox">${barChart(n)}</div>`;
  h += `<div class="rstats sx"><div><span>${esc(T.avgK)}</span><b>${avg(0)}</b></div><div><span>${esc(T.avgP)}</span><b>${avg(1)} ${esc(T.grams)}</b></div><div><span>${esc(T.daysLogged)}</span><b>${ds.length}/${n}</b></div></div>`;
  const c = checkIn();
  h += `<section class="mebox chk${c.warn ? " warn" : ""}"><h2>${esc(T.checkT)}</h2><p>${esc(c.msg)}</p>${c.x ? `<button class="btn main" id="chkApply" data-k="${c.k}">${esc(T.chkApply.replace("{k}", c.k))}</button>` : ""}</section>`;
  const ks = Object.keys(weights).sort(); if (ks.length >= 2) h += `<section class="mebox"><h2>${esc(T.weightT)}</h2>${weightChart()}</section>`;
  h += `<h3>${esc(T.challT)}</h3><div class="chall">` + CHALL.map(([k, need, fn]) => { const got = [...Array(7)].map((_, i) => isoAgo(i)).filter(fn).length, ok = got >= need;
    return `<div class="chc${ok ? " ok" : ""}"><div class="chh"><b>${esc(T[k])}</b><span>${ok ? esc(T.chDone) : got + "/" + need}</span></div><p>${esc(T[k + "d"])}</p><div class="bar"><i style="width:${Math.min(100, got / need * 100)}%"></i></div></div>`; }).join("") + `</div>`;
  $("#app").innerHTML = h;
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
  const T = t(), n = calcNorm(), gk = +goal.k || 0, lw = lastWeight();
  let h = `<section class="mehead"><div class="ava"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg></div>
    <div class="mhs"><div><b>${gk ? r0(gk) : "–"}</b><span>${esc(T.goalK)}</span></div><div><b>${+goal.p ? r0(+goal.p) : "–"}</b><span>${esc(macName(0))}, ${esc(T.grams)}</span></div><div><b>${lw ? fnum(lw) : "–"}</b><span>${esc(T.weightT)}, ${esc(T.kg)}</span></div></div></section>`;
  h += `<section class="mebox"><h2>${esc(T.normT)}</h2><p class="hint">${esc(T.normD)}</p>
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
  h += `<section class="mebox"><h2>${esc(T.reportT)}</h2><p class="hint">${esc(T.reportD)}</p><pre class="report" id="rpTxt">${esc(coachReport())}</pre>
    <div class="row2"><button class="btn main" id="rpTg">${esc(T.reportTg)}</button><button class="btn" id="rpCopy">${esc(T.copy)}</button></div></section>`;
  h += `<section class="mebox"><h2>${esc(T.backupT)}</h2><p class="hint">${esc(T.backupD)}</p>
    <div class="row2"><button class="btn main" id="bkSave">${esc(T.bkSave)}</button><button class="btn" id="bkCode">${esc(T.bkCode)}</button><label class="btn" for="bkFile">${esc(T.bkLoad)}</label><input type="file" id="bkFile" accept=".json,application/json" hidden></div>
    <div class="bkpaste"><textarea id="bkIn" rows="2" placeholder="${esc(T.bkPaste)}"></textarea><button class="btn" id="bkRestore">${esc(state.bkArm ? T.bkSure : T.bkRestore)}</button></div></section>`;
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
  let h = `<section class="genbox"><div class="genhd"><span class="genic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg></span><div><h2>${esc(T.genT)}</h2><p class="hint">${esc(T.genHint)}</p></div></div>
    <div class="genrow"><input id="gq" type="text" placeholder="${esc(T.genPh)}" aria-label="${esc(T.genT)}" value="${esc(gen ? gen.text : "")}" autocomplete="off"><button class="btn main" id="genGo">${esc(T.genBtn)}</button></div>
    <div class="quick genex">${T.genEx.map(x => `<button class="chip" data-gex="${esc(x)}">${esc(x)}</button>`).join("")}</div></section><div id="genOut"></div>`;
  h += `<div class="row2" style="margin-top:22px"><a class="btn main" href="#dish-new">${esc(T.newDish)}</a></div>`;
  if (!dishes.length) h += `<div class="empty">${esc(T.emptyMine)}</div>`;
  else h += `<div class="dlist">` + dishes.map(d => {
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
let sheetT = null;
function openSheet(kind, ctx) { clearTimeout(sheetT); $("#sheet").classList.remove("closing"); sheetKind = kind; sheetCtx = ctx || {}; lastFocus = document.activeElement; $("#sheet").hidden = false; renderSheet(); const f = $("#panel input") || $("#panel button"); f && f.focus(); }
function closeSheet() { const sh = $("#sheet"); sheetKind = null;
  if (reduceMotion() || sh.hidden) sh.hidden = true; else { sh.classList.add("closing"); clearTimeout(sheetT); sheetT = setTimeout(() => { sh.hidden = true; sh.classList.remove("closing"); }, 270); } lastFocus && lastFocus.focus && lastFocus.focus(); }
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
    if (sheetCtx.target !== "shop") h += `<div class="slotpick">` + SLOTS.map(s => `<button class="chip" data-psl="${s}" aria-pressed="${(sheetCtx.slot || slotNow()) === s}">${esc(T.slot[s])}</button>`).join("") + `</div>`;
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
function resultsHTML(keys, attr) { const T = t(); return keys.map(k => { const pg = PORTION[k], B = BRANDOF[k] && BRANDS[BRANDOF[k]], est = B && B.est, west = B && B.west;
  return `<button ${attr}="${k}"><span>${esc(fname(k))}${est ? `<em class="est">≈ ${esc(T.estT)}</em>` : west ? `<em class="est">${esc(T.westT)}</em>` : ""}</span><small>${pg ? `${west ? "≈" : ""}${pg} ${esc(T.grams)} · ${r0(FOOD[k][0] * pg / 100)} ${esc(T.kcal)} · ${esc(T.p)} ${r0(FOOD[k][1] * pg / 100)}` : `${r0(FOOD[k][0])} ${esc(T.kcal)} · ${esc(T.p)} ${r0(FOOD[k][1])} / 100 ${esc(T.grams)}`}</small></button>`; }).join(""); }
function fillProd() {
  const el = $("#pres"); if (!el) return; const T = t();
  if ((sheetCtx.q || "").trim()) { el.innerHTML = resultsHTML(findFood(sheetCtx.q), "data-pk"); return; }
  const rec = recentFoods();
  el.innerHTML = (rec.length ? `<p class="lbl">${esc(T.recent)}</p>` + rec.map(([k, g]) => `<button data-pk="${k}" data-pg="${r0(g)}"><span>${esc(fname(k))}</span><small>${r0(g)} ${esc(T.grams)} · ${r0(FOOD[k][0] * g / 100)} ${esc(T.kcal)}</small></button>`).join("") : "") +
    `<p class="lbl">${esc(T.cafesT)}</p><div class="brandpick">` + Object.entries(BRANDS).map(([b, v]) => `<button class="chip" data-brand="${b}" aria-pressed="${sheetCtx.brand === b}">${esc(v.name === "Pizza" ? T.cafesPizza || "Pizza" : v.name)}</button>`).join("") + `</div>` +
    (sheetCtx.brand && BRANDS[sheetCtx.brand] ? resultsHTML(BRANDS[sheetCtx.brand].items, "data-pk") : "") +
    `<p class="lbl">${esc(T.localT)}</p>` + LOCAL.map(k => `<button data-pk="${k}"><span>${esc(fname(k))}</span><small>1 ${esc(T.pcs)} ≈ ${PORTION[k]} ${esc(T.grams)} · ${r0(FOOD[k][0] * PORTION[k] / 100)} ${esc(T.kcal)}</small></button>`).join("");
}
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
let svgSeq = 0;
const CERAMIC = [["#FFFFFF", "#E6E0D4", "#F4EFE6"], ["#2F5A52", "#1C3A34", "#EDE6DA"], ["#E8D9C4", "#C7AF8E", "#F3EADB"], ["#3D4654", "#252B35", "#ECE6DC"], ["#F3E9DA", "#D8C6AC", "#FAF5EC"]];
function dishSVG(items, type, seed) {
  const R = rngOf(seed || items.map(i => i.key || i.name).join("|"));
  type = type || inferType(items);
  if (type === "drink") type = "smoothie";
  const id = "ds" + (++svgSeq).toString(36);
  const parts = items.filter(i => i.key && VIS[i.key] && i.g > 0).map(i => ({k: i.key, g: i.g, c: VIS[i.key][0], s: VIS[i.key][1]}));
  const dk = (c, a = .3) => mix("#1E140C", c, a), lt = (c, a = .45) => mix("#FFFFFF", c, a);
  const f = n => Math.round(n * 10) / 10;
  const rot = () => Math.round(R() * 360);
  const G = (x, y, r, s, b) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${r}) scale(${f(s)})">${b}</g>`;
  const hl = (x, y, rx, ry, o = .3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}"/>`;
  /* one ingredient piece drawn around 0,0 (about 18 units wide) */
  const body = p => {
    const c = p.c, k = p.k, d = dk(c), l = lt(c);
    switch (p.s) {
      case "chunk":
        if (k === "salmon") return `<rect x="-9" y="-6.5" width="18" height="13" rx="3.5" fill="${c}" stroke="${dk(c, .2)}" stroke-width=".7"/><path d="M-5 -6 q3 6 0 12 M0 -6.5 q3 6.5 0 13 M5 -6 q3 6 0 12" stroke="${lt(c, .6)}" stroke-width="1.1" fill="none" opacity=".85"/>`;
        if (k === "whitefish") return `<path d="M-10 -2 q2 -7 10 -6 q9 1 9 7 q-1 7 -10 6 q-9 0 -9 -7z" fill="${c}" stroke="#D9CBB2" stroke-width=".8"/><path d="M-5 -4 q2 4 0 8 M1 -5 q2 5 0 10" stroke="#E2D5BF" stroke-width="1" fill="none"/>${hl(-2, -3, 4, 1.6, .5)}`;
        return `<rect x="-9" y="-6" width="18" height="12" rx="4" fill="${c}" stroke="${d}" stroke-width=".8"/><path d="M-6 -4.5l5 9M0 -4.5l5 9" stroke="${dk(c, .55)}" stroke-width="1.7" stroke-linecap="round" opacity=".5"/>${hl(-3, -3.2, 5, 1.8, .25)}`;
      case "ball": return `<circle r="7" fill="${c}" stroke="${d}" stroke-width=".8"/>${hl(-2.5, -2.5, 2.8, 2, .28)}<circle cx="2.2" cy="2" r=".9" fill="${dk(c, .55)}"/><circle cx="-1.2" cy="3.4" r=".7" fill="${dk(c, .55)}"/><circle cx="3.4" cy="-1.5" r=".6" fill="${dk(c, .55)}"/>`;
      case "strip":
        if (k === "cabbage") return `<path d="M-11 0 q5.5 -5 11 0 t11 0" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><path d="M-10 0 q5 -4 10 0" fill="none" stroke="${l}" stroke-width=".8"/>`;
        return `<path d="M-11 -2.5 q5.5 -4 11 0 t11 0 v5 q-5.5 4 -11 0 t-11 0z" fill="${c}" stroke="${d}" stroke-width=".7"/><path d="M-10 0 q5 -3 10 0 t10 0" fill="none" stroke="${lt(c, .55)}" stroke-width="1.3" opacity=".85"/>`;
      case "curl": return `<path d="M-6 4 A7 7 0 1 1 6 4" fill="none" stroke="${dk(c, .15)}" stroke-width="7" stroke-linecap="round"/><path d="M-6 4 A7 7 0 1 1 6 4" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/><path d="M-6 4 A7 7 0 1 1 6 4" fill="none" stroke="${lt(c, .6)}" stroke-width="1.2" stroke-dasharray="1.6 2.2"/><path d="M5 5 l5 3.5 l-.5 -6z" fill="${dk(c, .25)}"/>`;
      case "flake": return `<path d="M-7 -1 q2 -6 8 -4.5 q6 1 5 6 q-2 5 -8 4 q-6 -1 -5 -5.5z" fill="${c}" stroke="${d}" stroke-width=".6"/><path d="M-4 0 l6 -2 M-2 3 l6 -1" stroke="${lt(c, .5)}" stroke-width=".9"/>`;
      case "cube":
        if (k === "bread") return `<rect x="-6" y="-6" width="12" height="12" rx="2.4" fill="${dk(c, .1)}" stroke="${dk(c, .45)}" stroke-width=".8"/><rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="1.5" fill="${lt(c, .55)}"/>`;
        return `<path d="M-5.5 -3 l5.5 -3.2 l5.5 3.2 v6.4 l-5.5 3.2 l-5.5 -3.2z" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".6"/><path d="M-5.5 -3 l5.5 -3.2 l5.5 3.2 l-5.5 3.2z" fill="${lt(c, .4)}"/><path d="M0 .2 v6.4 l5.5 -3.2 v-6.4z" fill="${dk(c, .12)}"/>`;
      case "round":
        if (k === "tomato") return `<circle r="8.4" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".7"/><circle r="6.8" fill="${lt(c, .15)}"/>` + [0, 120, 240].map(a => { const x = f(Math.cos(a * Math.PI / 180) * 3.6), y = f(Math.sin(a * Math.PI / 180) * 3.6); return `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.7" transform="rotate(${a} ${x} ${y})" fill="#F7B19D"/><circle cx="${x}" cy="${y}" r=".6" fill="#F5E6B8"/>`; }).join("") + `<circle r="1.4" fill="${lt(c, .35)}"/>`;
        if (k === "cucumber" || k === "zucchini") return `<circle r="8.2" fill="${dk(c, .45)}"/><circle r="7.2" fill="${lt(c, .5)}"/><circle r="3.6" fill="${lt(c, .72)}"/>` + [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="${f(Math.cos(a * Math.PI / 180) * 2.2)}" cy="${f(Math.sin(a * Math.PI / 180) * 2.2)}" rx=".9" ry=".5" fill="#F6F3DC" transform="rotate(${a} ${f(Math.cos(a * Math.PI / 180) * 2.2)} ${f(Math.sin(a * Math.PI / 180) * 2.2)})"/>`).join("");
        if (k === "banana") return `<circle r="7.4" fill="#FBF0C6" stroke="#E8CF7A" stroke-width=".9"/><circle r="2.4" fill="#EEDC9E"/><circle cx="1" cy="-.5" r=".5" fill="#8A6D3B"/><circle cx="-.8" cy=".7" r=".5" fill="#8A6D3B"/>${hl(-3, -3, 2.5, 1.5, .5)}`;
        if (k === "kiwi") return `<circle r="8.2" fill="#7A5A38"/><circle r="7.4" fill="${c}"/><circle r="4.6" fill="${lt(c, .3)}"/><circle r="2.4" fill="#F3F0D2"/>` + Array.from({length: 12}, (_, i) => { const a = i * 30 * Math.PI / 180; return `<ellipse cx="${f(Math.cos(a) * 3.6)}" cy="${f(Math.sin(a) * 3.6)}" rx=".7" ry=".4" fill="#1C1A12"/>`; }).join("");
        if (k === "carrot") return `<circle r="6.6" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".6"/><circle r="3.4" fill="${lt(c, .3)}"/>${hl(-2, -2.5, 2, 1, .35)}`;
        if (k === "mushroom") return `<path d="M-8.5 1 q0 -9.5 8.5 -9.5 q8.5 0 8.5 9.5z" fill="#EADBC2" stroke="#B89A72" stroke-width=".8"/><path d="M-3 1 h6 l-.6 7 q-2.4 1 -4.8 0z" fill="#F2E7D3" stroke="#B89A72" stroke-width=".7"/><path d="M-7 1 h14" stroke="#9C7E58" stroke-width="1.1"/>`;
        if (k === "eggplant") return `<circle r="8" fill="#4A2D5C"/><circle r="7" fill="#EFE3C4"/><circle r="4" fill="#E2D2A6" opacity=".7"/>`;
        if (k === "pickles") return `<circle r="7" fill="#5E7A30" stroke="#3E5520" stroke-width="1.2" stroke-dasharray="1.5 1"/><circle r="5" fill="#9DB35C"/><circle r="2" fill="#C5D08A"/>`;
        if (k === "mozz" || k === "mozzfull" || k === "suluguni") return `<circle r="7.6" fill="${c}" stroke="#E7DFC8" stroke-width=".8"/>${hl(-2.5, -2.5, 3, 2, .8)}`;
        return `<circle r="7.6" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".7"/><circle r="3.6" fill="${lt(c, .35)}"/>${hl(-2.6, -2.6, 2.4, 1.5, .35)}`;
      case "slice": return `<path d="M-9 3 q9 -13 18 0" fill="none" stroke="${dk(c, .2)}" stroke-width="5.4" stroke-linecap="round"/><path d="M-9 3 q9 -13 18 0" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><path d="M-7.5 1.4 q7.5 -10 15 0" fill="none" stroke="${lt(c, .5)}" stroke-width="1" opacity=".75"/>`;
      case "ring":
        if (k === "greenonion") return `<circle r="2.6" fill="${lt(c, .4)}" stroke="${c}" stroke-width="1.2"/>`;
        return `<circle r="7.4" fill="none" stroke="${dk(c, .1)}" stroke-width="2"/><circle r="7.4" fill="none" stroke="${lt(c, .3)}" stroke-width=".8"/><circle r="4.6" fill="none" stroke="${c}" stroke-width="1.6"/>`;
      case "floret": {
        const cl = [[-4.5, -1.5, 4.2], [4.5, -1.5, 4.2], [0, -5.5, 4.6], [0, -.5, 3.8], [-6.5, -5.5, 3.2], [6.5, -5.5, 3.2]];
        return `<path d="M-2 0 l-1.2 9 h6.4 l-1.2 -9z" fill="${lt(c, .5)}" stroke="${dk(c, .1)}" stroke-width=".5"/>` + cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".6"/>`).join("") +
          cl.map(([x, y]) => `<circle cx="${x - 1}" cy="${y - 1}" r=".8" fill="${lt(c, .45)}"/><circle cx="${x + 1.2}" cy="${y + .6}" r=".6" fill="${dk(c, .35)}"/>`).join("");
      }
      case "leaf":
        if (k === "arugula") return `<path d="M-12 0 q2 -3 4 -1 q1 -4 4 -2 q2 -4 5 -1 q3 -3 5 0 q2 1 6 4 q-4 3 -6 2 q-2 3 -5 1 q-3 3 -5 0 q-3 2 -4 -1 q-3 1 -4 -2z" fill="${c}" stroke="${dk(c, .2)}" stroke-width=".5"/><path d="M-11 0 Q0 0 12 1" stroke="${lt(c, .55)}" stroke-width=".7" fill="none"/>`;
        if (k === "lettuce") return `<path d="M-13 0 q3 -9 9 -8 q3 -3 7 -1 q5 -1 6 4 q4 3 2 6 q1 5 -5 6 q-3 3 -8 1 q-6 2 -8 -3 q-4 -2 -3 -5z" fill="${c}" stroke="${dk(c, .18)}" stroke-width=".6"/><path d="M-11 1 Q0 0 10 0 M-4 0 l-3 -5 M2 0 l3 -5 M-2 .5 l-2 5 M4 0 l2 5" stroke="${lt(c, .5)}" stroke-width=".8" fill="none"/>`;
        return `<path d="M-12 0 Q-4 -8 12 0 Q-4 8 -12 0z" fill="${c}" stroke="${dk(c, .2)}" stroke-width=".6"/><path d="M-11 0 Q0 -1 11 0" stroke="${lt(c, .5)}" stroke-width=".8" fill="none"/>`;
      case "stick": return `<rect x="-10" y="-2.2" width="20" height="4.4" rx="2.2" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".5"/><path d="M-8 -.8 h16" stroke="${lt(c, .5)}" stroke-width=".8"/>`;
      case "egg": return `<ellipse rx="10" ry="8" fill="#FFFFFF" stroke="#E0DACB" stroke-width=".8"/><circle r="4.8" fill="url(#${id}y)"/>${hl(-4, -3.5, 3, 1.4, .9)}`;
      case "dot":
        if (k === "strawberry") return `<path d="M0 7 C-8 1 -7 -6 0 -5 C7 -6 8 1 0 7z" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".6"/><path d="M0 5 C-5 1 -4.5 -3.5 0 -3 C4.5 -3.5 5 1 0 5z" fill="${lt(c, .45)}"/><path d="M-3 -5 l3 -2 l3 2 l-3 .6z" fill="#4E8F3A"/>`;
        if (k === "corn" || k === "greenpeas" || k === "chickpeas") return `<circle r="2.6" fill="${c}" stroke="${dk(c, .25)}" stroke-width=".4"/>${hl(-.8, -.8, .9, .6, .5)}`;
        if (k === "berries" || k === "cherry" || k === "olives") return `<circle r="3.8" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5"/>${hl(-1.2, -1.2, 1.3, .9, .45)}`;
        if (k === "walnut" || k === "almonds" || k === "peanuts") return `<ellipse rx="4" ry="2.8" fill="${c}" stroke="${dk(c, .35)}" stroke-width=".5"/><path d="M-2.5 0 q2.5 -2 5 0" stroke="${dk(c, .25)}" stroke-width=".6" fill="none"/>`;
        return `<ellipse rx="3.6" ry="2.6" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".5"/>${hl(-1, -1, 1.2, .7, .4)}`;
      case "seed": return `<ellipse rx="1.2" ry=".75" fill="${c}"/>`;
      case "dollop": return `<path d="M-10 2 q-2 -8 6 -9 q4 -4 9 0 q7 1 5 8 q-1 6 -10 6 q-9 0 -10 -5z" fill="${c}" stroke="${dk(c, .1)}" stroke-width=".7"/><path d="M-4 -3 q4 -3 8 1 M-5 2 q4 2 8 0" stroke="#fff" stroke-width="1.5" fill="none" opacity=".75" stroke-linecap="round"/>`;
      case "drizzle": return `<path d="M-22 2 C-14 -6 -8 8 0 0 S14 -6 22 2" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/><path d="M-20 -3 C-12 4 -4 -8 6 -2" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`;
      case "noodle": return `<path d="M-10 0 q5 -7 10 0 t10 0" fill="none" stroke="${dk(c, .18)}" stroke-width="3.6" stroke-linecap="round"/><path d="M-10 0 q5 -7 10 0 t10 0" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
      case "wedge":
        if (k === "avocado") return `<path d="M-11 4 Q0 -11 11 4 Q0 9 -11 4z" fill="#CFDD86" stroke="#3B5521" stroke-width="1.6"/><path d="M-8.5 3.4 Q0 -6.5 8.5 3.4" fill="none" stroke="#EAEFA8" stroke-width="1.4"/>`;
        if (k === "apple" || k === "pear" || k === "persimmon") return `<path d="M-10 3 Q0 -11 10 3 Q0 7 -10 3z" fill="${k === "persimmon" ? lt(c, .2) : "#FBF2D9"}" stroke="${c}" stroke-width="2"/><path d="M-2 0 l1 -2 l1 2z" fill="#6B4A2A"/>`;
        if (k === "lemon") return `<path d="M-10 4 A10 10 0 0 1 10 4z" fill="#F9E27A" stroke="#E8C22A" stroke-width="1.4"/><path d="M0 4 L-6 -2 M0 4 L0 -5 M0 4 L6 -2" stroke="#FBF1B8" stroke-width=".9"/>`;
        return `<path d="M-11 4 Q-3 -10 11 -2 L9 5 Q0 8.5 -11 4z" fill="${c}" stroke="${dk(c, .4)}" stroke-width="1.1"/><path d="M-8 2.5 Q-2 -6 8 -1" fill="none" stroke="${lt(c, .45)}" stroke-width="1.2"/>`;
    }
    return "";
  };
  const piece = (p, x, y, s = 1, r = rot()) => G(x, y, r, s, body(p));
  /* scatter n pieces inside a disc / sector, keeping them apart */
  const placed = [];
  const spot = (cx, cy, r0, r1, a0, a1, minD) => {
    let best = null, bd = -1;
    for (let t = 0; t < 14; t++) {
      const a = a0 + R() * (a1 - a0), d = Math.sqrt(r0 * r0 + R() * (r1 * r1 - r0 * r0)), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const near = placed.reduce((m, q) => Math.min(m, Math.hypot(q[0] - x, q[1] - y)), 99);
      if (near >= minD) { best = [x, y]; break; }
      if (near > bd) { bd = near; best = [x, y]; }
    }
    placed.push(best); return best;
  };
  const cnt = (g, lo = 3, hi = 11) => Math.max(lo, Math.min(hi, Math.round(Math.sqrt(g) / 1.25)));
  const TAU = Math.PI * 2;
  const kind = p => p.s === "seed" ? "seed" : p.s === "drizzle" ? "drizzle" : p.s === "dollop" ? "dollop" : p.s === "base" ? "base" : p.s === "grain" ? "grain" : p.s === "wrap" ? "wrap" : "main";
  const by = t => parts.filter(p => kind(p) === t);
  const seeds = by("seed"), drz = by("drizzle").filter(p => !["soy", "oil", "mayo", "mayofull"].includes(p.k)), dol = by("dollop");
  const grainTex = (cx, cy, r, p, n = 130) => { let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.c}"/>`; const small = ["quinoa", "couscous", "semolina", "lentilsdry"].includes(p.k);
    for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * (r - 2), x = f(cx + Math.cos(a) * d), y = f(cy + Math.sin(a) * d), sh = R();
      s += small ? `<circle cx="${x}" cy="${y}" r="1.2" fill="${sh > .5 ? lt(p.c, .4) : dk(p.c, .14)}"/>` : `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.25" fill="${sh > .45 ? lt(p.c, .5) : dk(p.c, .1)}" stroke="${dk(p.c, .22)}" stroke-width=".4" transform="rotate(${rot()} ${x} ${y})"/>`; }
    return s; };
  const sprinkle = (cx, cy, r, n) => seeds.map(p => Array.from({length: n}, () => { const a = R() * TAU, d = Math.sqrt(R()) * r; return G(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rot(), 1.2, body(p)); }).join("")).join("");
  const drizzles = (cx, cy, r) => drz.slice(0, 2).map((p, i) => G(cx + (R() - .5) * r * .3, cy - r * .15 + i * r * .3, -25 + R() * 50, r / 30, body(p))).join("");
  const dollops = (cx, cy) => dol.map((p, i) => G(cx + i * 14, cy + i * 6, rot(), 1.25, body(p))).join("");

  let defs = `<defs><linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F2EA"/><stop offset="1" stop-color="#E9E0D2"/></linearGradient>
    <filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    <radialGradient id="${id}y" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FFD866"/><stop offset="1" stop-color="#EE9F12"/></radialGradient>
    <radialGradient id="${id}ao" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>`;
  const cer = CERAMIC[Math.floor(R() * CERAMIC.length)];
  defs += `<radialGradient id="${id}cer" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${lt(cer[0], .75)}"/><stop offset=".6" stop-color="${cer[0]}"/><stop offset="1" stop-color="${cer[1]}"/></radialGradient>
    <radialGradient id="${id}pl" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#F8F6F1"/><stop offset="1" stop-color="#E4DED2"/></radialGradient>
    <clipPath id="${id}in"><circle cx="100" cy="100" r="66"/></clipPath></defs>`;
  let svg = `<rect width="200" height="200" fill="url(#${id}bg)"/><path d="M0 150 L200 120 L200 200 L0 200Z" fill="#000" opacity=".025"/>`;
  const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx + 5}" cy="${cy + 9}" rx="${rx}" ry="${ry}" fill="#3A2A18" opacity=".22" filter="url(#${id}sh)"/>`;
  const bowl = inner => shadow(100, 100, 82, 80) + `<circle cx="100" cy="100" r="84" fill="url(#${id}cer)"/><circle cx="100" cy="100" r="84" fill="none" stroke="${cer[1]}" stroke-width="1.2"/><circle cx="100" cy="100" r="70" fill="${cer[2]}"/><circle cx="100" cy="100" r="70" fill="none" stroke="${dk(cer[1], .2)}" stroke-width="1" opacity=".5"/>` +
    `<g clip-path="url(#${id}in)">${inner}</g><circle cx="100" cy="100" r="67" fill="url(#${id}ao)"/><path d="M42 62 A70 70 0 0 1 92 32" stroke="#fff" stroke-width="3" fill="none" opacity="${cer[0] === "#FFFFFF" ? .9 : .35}" stroke-linecap="round"/>`;
  const plate = () => shadow(100, 100, 86, 84) + `<circle cx="100" cy="100" r="90" fill="url(#${id}pl)"/><circle cx="100" cy="100" r="90" fill="none" stroke="#DDD6C9" stroke-width="1"/><circle cx="100" cy="100" r="68" fill="#FBFAF7" stroke="#ECE7DD" stroke-width="1.4"/><path d="M30 70 A75 75 0 0 1 70 30" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const mains = by("main").sort((a, b) => b.g - a.g);
  const herbs = mains.filter(p => ["herbs", "mint", "greenonion", "spinach", "arugula"].includes(p.k));

  if (type === "smoothie") {
    const fr = parts.filter(p => !["base", "seed", "drizzle"].includes(p.s)), liq = parts.find(p => p.s === "base") || {c: "#F7F3EA"};
    let col = liq.c; fr.forEach((p, i) => col = mix(p.k === "banana" ? "#F3DF96" : p.c, col, i ? .35 : .6)); if (parts.some(p => p.k === "cocoa" || p.k === "choc")) col = mix("#6B452C", col, .5);
    defs = defs.replace("</defs>", `<linearGradient id="${id}sm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(col, .25)}"/><stop offset="1" stop-color="${dk(col, .12)}"/></linearGradient><linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="#fff" stop-opacity=".1"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient></defs>`);
    svg += shadow(100, 168, 46, 10) + `<path d="M128 20 L108 104" stroke="#2F6F5E" stroke-width="7" stroke-linecap="round"/><path d="M128 20 L108 104" stroke="#fff" stroke-width="7" stroke-dasharray="5 7" stroke-linecap="butt" opacity=".9"/>` +
      `<path d="M58 44 L142 44 L130 168 Q100 176 70 168 Z" fill="url(#${id}sm)"/><path d="M58 44 L142 44 L141 52 Q100 60 59 52 Z" fill="${lt(col, .6)}"/>` + Array.from({length: 9}, () => `<circle cx="${f(64 + R() * 72)}" cy="${f(47 + R() * 5)}" r="${f(1 + R() * 1.6)}" fill="#fff" opacity=".7"/>`).join("") +
      `<path d="M54 38 L146 38 L131 172 Q100 182 69 172 Z" fill="url(#${id}gl)" stroke="#BFC7C6" stroke-width="1.6"/><path d="M64 50 L74 164" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
    const gar = fr[0]; if (gar) svg += G(146, 40, gar.s === "round" ? 0 : -20, 1.7, body(gar));
    fr.slice(0, 3).forEach((p, i) => { svg += G(40 + i * 16 - (i === 2 ? 30 : 0), 172 - (i === 2 ? 14 : 0), rot(), 1.2, body(p)); if (p.s === "dot") svg += G(170 - i * 12, 178, rot(), 1.1, body(p)); });
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
  }

  if (type === "wrap" || type === "sandwich") {
    svg += plate();
    const shell = parts.find(p => p.s === "wrap") || parts.find(p => p.k === "bread") || {c: type === "wrap" ? "#E9C98A" : "#D9A24E", k: "bread"};
    const fill = mains.filter(p => p.k !== "bread").slice(0, 5);
    const greens = fill.filter(p => p.s === "leaf"), others = fill.filter(p => p.s !== "leaf");
    if (type === "wrap") {
      [[78, 92, -28], [124, 104, 22]].forEach(([x, y, a], h) => {
        let g = `<rect x="-20" y="-40" width="40" height="76" rx="20" fill="${shell.c}" stroke="${dk(shell.c, .3)}" stroke-width="1.2"/>` + Array.from({length: 7}, () => `<ellipse cx="${f(-12 + R() * 24)}" cy="${f(-20 + R() * 50)}" rx="${f(2 + R() * 3)}" ry="${f(1 + R() * 1.5)}" fill="${dk(shell.c, .3)}" opacity=".35"/>`).join("") +
          `<path d="M-14 -20 v46" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/><ellipse cx="0" cy="-36" rx="19" ry="11" fill="${lt(shell.c, .55)}" stroke="${dk(shell.c, .25)}" stroke-width="1"/><ellipse cx="0" cy="-36" rx="15" ry="8" fill="${greens[0] ? greens[0].c : "#7FBF5A"}"/>`;
        others.forEach((p, i) => { for (let j = 0; j < 2; j++) g += G(-9 + ((i * 2 + j) % 4) * 6, -38 + ((i + j) % 2) * 4 - 1, rot(), .42, body(p)); });
        g += `<path d="M-15 -36 a15 8 0 0 0 30 0" fill="none" stroke="${lt(shell.c, .35)}" stroke-width="2"/>`;
        svg += G(x, y, a, 1, g);
      });
      greens.forEach(p => { svg += G(150, 58, -30, 1.3, body(p)) + G(48, 150, 20, 1.1, body(p)); });
    } else {
      const layer = (p, y) => { const c = p.k === "tomato" ? "#E0412F" : p.c; return `<path d="M-41 ${y} q3.4 ${p.s === "leaf" ? -3.5 : -1.5} 6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0 t6.8 0" fill="none" stroke="${c}" stroke-width="${p.s === "leaf" ? 4 : 3.4}" stroke-linecap="round"/>`; };
      [[84, 88, -12], [120, 118, 168]].forEach(([x, y, a]) => {
        let g = `<path d="M-42 34 L42 34 L0 -44 Z" fill="${dk(shell.c, .12)}" stroke-linejoin="round" stroke="${dk(shell.c, .3)}" stroke-width="3"/><path d="M-34 29 L34 29 L0 -33 Z" fill="${lt(shell.c, .55)}" stroke-linejoin="round" stroke="${lt(shell.c, .35)}" stroke-width="3"/>` +
          Array.from({length: 18}, () => { const u = R(), v = R() * (1 - u); return `<circle cx="${f(-26 + u * 26 + v * 52 - v * 26 + (R() - .5) * 8)}" cy="${f(24 - u * 50 * .9 - v * 4)}" r="${f(.6 + R())}" fill="${dk(shell.c, .2)}" opacity=".35"/>`; }).join("");
        const ls = [greens[0], ...others].filter(Boolean).slice(0, 4);
        g += ls.map((p, i) => layer(p, 37 + i * 3.6)).join("") + `<path d="M-42 ${39 + ls.length * 3.6} L42 ${39 + ls.length * 3.6}" stroke="${dk(shell.c, .12)}" stroke-width="5" stroke-linecap="round"/>`;
        svg += G(x, y, a, .92, g);
      });
      mains.filter(p => ["pickles", "olives", "tomato", "cucumber"].includes(p.k)).slice(0, 1).forEach(p => { for (let i = 0; i < 3; i++) svg += piece(p, 150 + i * 9, 58 + i * 5, .9); });
    }
    svg += dollops(46, 64);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
  }

  if (type === "omelet") {
    svg += plate();
    const egg = "#F4CF5D";
    defs = defs.replace("</defs>", `<radialGradient id="${id}om" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FBE38E"/><stop offset=".7" stop-color="${egg}"/><stop offset="1" stop-color="#DDA93A"/></radialGradient></defs>`);
    const fillIn = mains.filter(p => !["egg", "bread"].includes(p.k));
    let g = "";
    g += `<path d="M40 112 Q100 156 160 112" fill="none" stroke="#3A2A18" stroke-width="8" opacity=".12" filter="url(#${id}sh)"/>`;
    fillIn.forEach((p, i) => { for (let j = 0; j < 4; j++) { const u = ((i * 4 + j) * 0.137 + .12) % 1, x = 48 + u * 104, y = 108 + Math.sin(u * Math.PI) * 26; g += piece(p, x, y + 4, .8); } });
    g += `<path d="M38 108 Q100 150 162 108 Q156 46 100 42 Q44 46 38 108Z" fill="url(#${id}om)" stroke="#C99436" stroke-width="1.2"/>` +
      Array.from({length: 12}, () => `<ellipse cx="${f(60 + R() * 80)}" cy="${f(58 + R() * 50)}" rx="${f(2 + R() * 4)}" ry="${f(1.2 + R() * 2)}" fill="#C98A2E" opacity=".28"/>`).join("") + `<path d="M46 104 Q100 138 154 104" fill="none" stroke="#FFF1BC" stroke-width="2" opacity=".7"/>`;
    svg += g;
    const br = parts.find(p => p.k === "bread"); if (br) svg += G(150, 150, 20, 2.2, body(br));
    herbs.slice(0, 1).forEach(p => { for (let i = 0; i < 4; i++) svg += piece(p, 80 + R() * 40, 66 + R() * 34, .55); });
    svg += sprinkle(100, 80, 30, 10) + dollops(60, 150);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
  }

  const OUT = () => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
  const side = (x, y) => { const v = mains.filter(p => !["flour", "beef20", "beef", "pork", "potato", "tvorog5", "egg", "milk", "suluguni", "imeruli", "butter", "onion", "matsoni", "beans"].includes(p.k)).slice(0, 2); v.forEach((p, j) => { for (let i = 0; i < 3; i++) svg += piece(p, x + j * 16 + R() * 8, y + i * 7, .85); }); };
  if (type === "dumpling_round") { // khinkali, manti: round pleated dumplings with a knot
    svg += plate();
    const dough = "#F4EBD6", dd = dk(dough, .18);
    [[72, 78], [122, 74], [100, 112], [60, 124], [140, 122]].forEach(([x, y], n) => {
      let g = `<ellipse cx="2" cy="14" rx="23" ry="8" fill="#3A2A18" opacity=".18" filter="url(#${id}sh)"/><path d="M-24 6 Q-24 -18 0 -20 Q24 -18 24 6 Q22 18 0 18 Q-22 18 -24 6z" fill="${dough}" stroke="${dd}" stroke-width="1"/>`;
      for (let i = 0; i < 9; i++) { const a = -Math.PI * .95 + i * Math.PI * .95 / 4.2; g += `<path d="M0 -15 Q${f(Math.cos(a) * 13)} ${f(Math.sin(a) * 8 - 6)} ${f(Math.cos(a) * 22)} ${f(Math.sin(a) * 12 + 6)}" fill="none" stroke="${dd}" stroke-width=".9" opacity=".7"/>`; }
      g += `<ellipse cx="0" cy="-17" rx="5.5" ry="4" fill="${lt(dough, .3)}" stroke="${dd}" stroke-width="1"/><path d="M-3 -20 q3 -6 6 0" fill="${dough}" stroke="${dd}" stroke-width="1"/>` + hl(-9, -4, 6, 3, .45);
      svg += G(x, y, (n - 2) * 8, 1, g);
    });
    svg += dollops(150, 66) + Array.from({length: 14}, () => `<circle cx="${f(70 + R() * 60)}" cy="${f(60 + R() * 70)}" r=".9" fill="#2B1F14" opacity=".6"/>`).join("");
    return OUT();
  }
  if (type === "dumpling") { // pelmeni, vareniki, gyoza: half-moons
    svg += plate();
    const fried = parts.some(p => p.k === "soy"), dough = fried ? "#EFDDB6" : "#F6EEDB", dd = dk(dough, .2);
    const pos = [[64, 74], [96, 64], [130, 72], [56, 106], [90, 98], [124, 104], [150, 100], [70, 136], [106, 134], [138, 134]];
    pos.forEach(([x, y]) => {
      let g = `<path d="M-16 4 Q-14 -14 0 -14 Q14 -14 16 4 Q0 10 -16 4z" fill="${dough}" stroke="${dd}" stroke-width=".9"/>`;
      for (let i = 0; i < 6; i++) { const u = -12 + i * 5; g += `<path d="M${u} ${f(-12 + Math.abs(u) * .45)} l1.6 3.4" stroke="${dd}" stroke-width=".8" opacity=".7"/>`; }
      if (fried) g += `<path d="M-15 4 Q0 9 15 4 Q0 13 -15 4z" fill="#B97A2E" opacity=".75"/>`;
      g += hl(-6, -6, 5, 2.4, .4);
      svg += G(x, y, Math.round((R() - .5) * 50), 1, g);
    });
    if (fried) svg += `<ellipse cx="158" cy="148" rx="13" ry="9" fill="#EDE6DA"/><ellipse cx="158" cy="148" rx="10" ry="6.5" fill="#3B1E10"/>`;
    svg += dollops(150, 60);
    herbs.slice(0, 1).forEach(p => { for (let i = 0; i < 4; i++) svg += piece(p, 80 + R() * 50, 80 + R() * 40, .5); });
    return OUT();
  }
  if (type === "flat") { // khachapuri, lobiani, pizza, quesadilla: a round pie cut into wedges
    svg += plate();
    const pizza = parts.some(p => p.k === "passata"), tort = parts.some(p => p.k === "tortilla"), bean = parts.some(p => p.k === "beans");
    const crust = tort ? "#E7C584" : "#DDA552", top = pizza ? "#C9402F" : bean ? "#C8884F" : "#F2D277";
    let g = `<circle cx="0" cy="0" r="66" fill="${crust}" stroke="${dk(crust, .3)}" stroke-width="1.2"/><circle cx="0" cy="0" r="${pizza ? 56 : 62}" fill="${pizza ? top : lt(crust, .25)}"/>`;
    g += Array.from({length: 26}, () => { const a = R() * TAU, d = Math.sqrt(R()) * 58; return `<ellipse cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" rx="${f(2 + R() * 4)}" ry="${f(1.5 + R() * 2.5)}" fill="${pizza ? "#F7EFD9" : dk(crust, .35)}" opacity="${pizza ? .95 : .35}"/>`; }).join("");
    if (pizza) { g += Array.from({length: 7}, () => { const a = R() * TAU, d = 14 + R() * 34; return `<path d="M0 -5 q5 3 0 10 q-5 -3 0 -10z" fill="#3E8E3A" transform="translate(${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)}) rotate(${rot()})"/>`; }).join(""); }
    if (!pizza && !tort) g += `<circle cx="0" cy="0" r="30" fill="${top}" opacity=".35"/>`;
    for (let i = 0; i < (tort ? 4 : 6); i++) { const a = i * TAU / (tort ? 4 : 6) + .3; g += `<path d="M0 0 L${f(Math.cos(a) * 66)} ${f(Math.sin(a) * 66)}" stroke="${dk(crust, .45)}" stroke-width="1.4" opacity=".55"/>`; }
    g += `<path d="M-46 -30 A55 55 0 0 1 -10 -54" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>`;
    svg += G(100, 100, rot(), 1, g) + dollops(160, 156);
    return OUT();
  }
  if (type === "boat") { // adjarian khachapuri: a boat with cheese, yolk and butter
    svg += plate();
    const crust = "#D9973F";
    svg += `<path d="M22 100 Q60 46 100 52 Q140 46 178 100 Q140 154 100 148 Q60 154 22 100z" fill="${crust}" stroke="${dk(crust, .3)}" stroke-width="1.4" transform="rotate(-18 100 100)"/>` +
      `<g transform="rotate(-18 100 100)"><path d="M44 100 Q70 68 100 70 Q130 68 156 100 Q130 132 100 130 Q70 132 44 100z" fill="#F4D77C"/>` +
      Array.from({length: 18}, () => `<ellipse cx="${f(62 + R() * 76)}" cy="${f(84 + R() * 32)}" rx="${f(2 + R() * 4)}" ry="${f(1.4 + R() * 2)}" fill="#E2B54E" opacity=".6"/>`).join("") +
      `<ellipse cx="100" cy="100" rx="17" ry="14" fill="#FFF8EA"/><circle cx="100" cy="100" r="9" fill="url(#${id}y)"/><rect x="114" y="86" width="13" height="10" rx="2" fill="#FBE7A1" stroke="#E6C770" stroke-width=".8"/>` + hl(92, 96, 3, 2, .6) +
      `<path d="M36 92 Q64 60 100 62" stroke="#fff" stroke-width="2.4" fill="none" opacity=".3" stroke-linecap="round"/></g>`;
    return OUT();
  }
  if (type === "pancakes") { // bliny, syrniki, draniki: a stack with sour cream
    svg += plate();
    const pot = parts.some(p => p.k === "potato"), tv = parts.some(p => p.k.startsWith("tvorog")), thin = !pot && !tv;
    const c = pot ? "#C98A3A" : tv ? "#E2A24C" : "#EDC37A";
    if (thin) {
      for (let i = 0; i < 6; i++) svg += `<ellipse cx="100" cy="${112 - i * 5}" rx="58" ry="40" fill="${i % 2 ? c : lt(c, .2)}" stroke="${dk(c, .3)}" stroke-width="1"/>`;
      svg += Array.from({length: 20}, () => `<circle cx="${f(60 + R() * 80)}" cy="${f(70 + R() * 40)}" r="${f(1 + R() * 2.4)}" fill="${dk(c, .35)}" opacity=".35"/>`).join("") + `<path d="M100 84 L158 84 A58 40 0 0 1 128 118Z" fill="${lt(c, .35)}" stroke="${dk(c, .25)}" stroke-width="1" opacity=".9"/>`;
    } else {
      [[70, 84], [118, 78], [92, 122], [140, 120]].forEach(([x, y], n) => {
        let g = `<ellipse cx="2" cy="6" rx="22" ry="15" fill="#3A2A18" opacity=".18" filter="url(#${id}sh)"/><ellipse cx="0" cy="4" rx="22" ry="15" fill="${dk(c, .25)}"/><ellipse cx="0" cy="0" rx="22" ry="15" fill="${c}" stroke="${dk(c, .3)}" stroke-width="1"/>`;
        g += pot ? Array.from({length: 10}, () => `<path d="M${f(-16 + R() * 32)} ${f(-10 + R() * 20)} l${f(3 + R() * 4)} ${f(R() * 2)}" stroke="${dk(c, .4)}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`).join("") : hl(-6, -4, 10, 5, .25);
        svg += G(x, y, Math.round((R() - .5) * 30), 1, g);
      });
    }
    svg += `<ellipse cx="${thin ? 100 : 46}" cy="${thin ? 82 : 140}" rx="14" ry="9" fill="#FBF8F0" stroke="#E5DED0" stroke-width=".8"/>` + hl(thin ? 96 : 42, thin ? 79 : 137, 5, 2.5, .6);
    side(140, 150);
    return OUT();
  }

  if (type === "plate") {
    svg += plate();
    const gr = parts.find(p => p.s === "grain"), prot = mains.find(p => PROTS.includes(p.k) || ["chickenthigh", "turkeyham"].includes(p.k)), side = mains.filter(p => p !== prot);
    const mound = "M40 118 q0 -34 32 -36 q32 2 30 36 q-2 30 -32 30 q-30 0 -30 -30z";
    if (gr) svg += `<path d="${mound}" transform="translate(3 5)" fill="#3A2A18" opacity=".2" filter="url(#${id}sh)"/><g clip-path="url(#${id}pc)">${grainTex(70, 118, 34, gr.c.startsWith("#F") ? {...gr, c: "#F3EEE2"} : gr, 130)}</g><path d="${mound}" fill="none" stroke="${dk(gr.c, .18)}" stroke-width=".8" opacity=".6"/>`, defs = defs.replace("</defs>", `<clipPath id="${id}pc"><path d="M40 118 q0 -34 32 -36 q32 2 30 36 q-2 30 -32 30 q-30 0 -30 -30z"/></clipPath></defs>`);
    const starch = side.filter(p => p.s === "wedge" && ["potato", "sweetpotato"].includes(p.k));
    starch.forEach(p => { for (let i = 0; i < cnt(p.g, 5, 8); i++) { const [x, y] = spot(68, 120, 0, 28, 0, TAU, 12); svg += piece(p, x, y, 1.15); } });
    if (prot) {
      if (prot.s === "chunk" && !["salmon", "whitefish"].includes(prot.k)) {
        const c = prot.c; let g = `<path d="M-32 4 Q-30 -18 0 -17 Q30 -16 32 2 Q30 18 0 17 Q-30 18 -32 4z" fill="${dk(c, .18)}"/>`;
        for (let i = 0; i < 5; i++) { const x0 = -30 + i * 12.4; g += `<g transform="translate(${f(i * 1.6)} ${f(-i * .8)})"><path d="M${x0} -15 h11 v31 h-11z" fill="${c}" stroke="${dk(c, .3)}" stroke-width=".6" clip-path="url(#${id}fl)"/><rect x="${x0}" y="-15" width="2.6" height="31" fill="${lt(c, .45)}" clip-path="url(#${id}fl)"/></g>`; }
        g += `<g clip-path="url(#${id}fl)" stroke="${dk(c, .6)}" stroke-width="2.2" opacity=".45" stroke-linecap="round">${[-24, -12, 0, 12, 24].map(x => `<path d="M${x - 6} -14 l12 28"/>`).join("")}</g>`;
        defs = defs.replace("</defs>", `<clipPath id="${id}fl"><path d="M-32 4 Q-30 -18 0 -17 Q30 -16 32 2 Q30 18 0 17 Q-30 18 -32 4z"/></clipPath></defs>`);
        svg += G(126, 78, -28, 1.05, g);
      }
      else if (prot.s === "chunk") svg += G(130, 76, -18, 2.6, body(prot));
      else for (let i = 0; i < cnt(prot.g, 3, 7); i++) { const [x, y] = spot(128, 78, 0, 24, 0, TAU, 12); svg += piece(prot, x, y, 1.15); }
    }
    side.filter(p => !starch.includes(p)).slice(0, 3).forEach((p, j) => { const a = (.25 + j * .28) * Math.PI; for (let i = 0; i < cnt(p.g, 3, 7); i++) { const [x, y] = spot(118 + Math.cos(a) * 14, 128 + Math.sin(a) * 8, 0, 18, 0, TAU, 11); svg += piece(p, x, y, 1.05); } });
    svg += dollops(150, 112) + sprinkle(120, 90, 30, 8);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
  }

  /* bowls: salad, bowl, pasta, oatmeal, soup */
  let inner = "";
  const base = parts.filter(p => p.s === "grain" || p.s === "base").sort((a, b) => b.g - a.g)[0];
  if (type === "soup") {
    const liq = parts.filter(p => p.s === "base").sort((a, b) => b.g - a.g)[0];
    const has = k => parts.some(p => p.k === k), gOf = k => (parts.find(p => p.k === k) || {g: 0}).g;
    let col = liq ? liq.c : "#E9C46A";
    if (has("beet")) col = "#B3263E"; else if (has("pumpkin")) col = "#EE9A2E"; else if (has("kefir")) col = "#F2EFE6"; else if (has("coconut")) col = mix("#F3D9A4", "#FBF3E2", .5);
    else if (gOf("passata") + gOf("tomato") >= 40) col = gOf("passata") + gOf("tomato") >= 100 ? "#D2582E" : "#C8763E"; else parts.filter(p => ["cube", "round"].includes(p.s)).slice(0, 2).forEach(p => col = mix(p.c, col, .25));
    inner += `<circle cx="100" cy="100" r="70" fill="${col}"/><ellipse cx="84" cy="80" rx="26" ry="10" fill="#fff" opacity=".16"/>` + Array.from({length: 10}, () => `<circle cx="${f(60 + R() * 80)}" cy="${f(60 + R() * 80)}" r="${f(1 + R() * 2.4)}" fill="#F6D46A" opacity=".55" stroke="#C99A2E" stroke-width=".3"/>`).join("");
    mains.filter(p => !(p.k === "pumpkin" && col === "#EE9A2E") && p.k !== "flour").forEach(p => { for (let i = 0; i < cnt(p.g, 3, 9); i++) { const [x, y] = spot(100, 100, 0, 56, 0, TAU, 12); inner += piece(p, x, y, .95); } });
    if (has("sour")) inner += `<path d="M96 92 q10 -8 18 0 q6 8 -4 14 q-12 4 -16 -4 q-2 -6 2 -10z" fill="#FBF8F0" stroke="#E5DED0" stroke-width=".8"/>`;
  } else if (type === "pasta") {
    const sauce = parts.find(p => p.k === "passata") || parts.find(p => ["cream10", "cream20", "sour"].includes(p.k));
    const pc = (parts.find(p => p.s === "noodle") || {c: "#F2D48A"}).c, tint = sauce ? mix(sauce.c, pc, .35) : pc;
    if (sauce) inner += `<path d="M44 100 q4 -50 56 -54 q54 4 56 54 q-2 52 -56 54 q-54 -2 -56 -54z" fill="${sauce.c}" opacity=".9"/>`;
    for (let i = 0; i < 90; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 50; inner += G(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, rot(), .9 + R() * .4, body({c: i % 3 ? tint : pc, s: "noodle"})); }
    mains.filter(p => p.s !== "noodle").forEach(p => { for (let i = 0; i < cnt(p.g, 3, 8); i++) { const [x, y] = spot(100, 100, 0, 46, 0, TAU, 13); inner += piece(p, x, y, 1); } });
    inner += sprinkle(100, 100, 40, 16);
  } else {
    if (type === "salad") {
      const gr = mains.filter(p => p.s === "leaf" && ["lettuce", "arugula", "spinach"].includes(p.k));
      const lc = gr.length ? gr : [{k: "lettuce", c: "#7FBF5A", s: "leaf"}];
      inner += `<circle cx="100" cy="100" r="70" fill="${dk(lc[0].c, .35)}"/>`;
      for (let i = 0; i < 34; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 60; inner += G(100 + Math.cos(a) * d, 100 + Math.sin(a) * d, rot(), 1.5 + R() * .5, body(lc[i % lc.length])); }
      const tops = mains.filter(p => !lc.includes(p));
      tops.forEach(p => { for (let i = 0; i < cnt(p.g, 4, 10); i++) { const [x, y] = spot(100, 100, 0, 52, 0, TAU, 13); inner += piece(p, x, y, 1.1); } });
    } else {
      if (base && base.s === "grain") inner += grainTex(100, 100, 70, base, type === "oatmeal" ? 70 : 170);
      else if (base) inner += `<circle cx="100" cy="100" r="70" fill="${base.c}"/>`;
      else inner += `<circle cx="100" cy="100" r="70" fill="${type === "oatmeal" ? "#EBD9B4" : "#F4EEDD"}"/>`;
      if (type === "oatmeal") {
        inner += Array.from({length: 40}, () => { const a = R() * TAU, d = Math.sqrt(R()) * 62; return `<ellipse cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" rx="3.4" ry="2.2" fill="${R() > .5 ? "#F3E6C8" : "#D9C190"}" opacity=".8"/>`; }).join("");
        const fr = mains.slice(0, 4); const span = Math.PI * 1.1 / Math.max(1, fr.length);
        fr.forEach((p, j) => { const a0 = Math.PI * 1.05 + j * span; for (let i = 0; i < cnt(p.g, 4, 8); i++) { const [x, y] = spot(100, 100, 22, 56, a0, a0 + span, 11); inner += piece(p, x, y, 1.05); } });
      } else {
        const ms = mains.slice(0, 6), center = ms.find(p => ["egg", "avocado"].includes(p.k));
        const ring = ms.filter(p => p !== center), tot = ring.reduce((s, p) => s + Math.sqrt(p.g), 0) || 1;
        let a = R() * TAU;
        ring.forEach(p => { const span = Math.max(.7, TAU * Math.sqrt(p.g) / tot); for (let i = 0; i < cnt(p.g, 5, 11); i++) { const [x, y] = spot(100, 100, 24, 60, a + .06, a + span - .06, 12); inner += piece(p, x, y, 1.1); } a += span; });
        if (center) { for (let i = 0; i < (center.k === "egg" ? 2 : 3); i++) inner += piece(center, 92 + i * 10, 96 + (i % 2) * 8, 1.3, center.k === "egg" ? 0 : 200 + i * 25); }
      }
    }
    inner += sprinkle(100, 100, 40, 14);
  }
  inner += herbs.filter(p => type !== "salad").slice(0, 1).map(p => Array.from({length: 3}, () => piece(p, 84 + R() * 32, 84 + R() * 32, .6)).join("")).join("");
  inner += drizzles(100, 100, 52) + dollops(type === "oatmeal" ? 112 : 106, type === "oatmeal" ? 96 : 104);
  svg += bowl(inner);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${svg}</svg>`;
}
const dishImg = d => d.photo ? `<img src="${d.photo}" alt="">` : dishSVG(d.items, d.type, d.id || d.name);

/* ---------- dish generator ---------- */
const PROTS = ["chicken", "turkey", "veal", "beef", "pork", "chicken_mince", "salmon", "tuna", "shrimp", "whitefish", "tofu", "egg", "bacon"];
const VEGS = ["cucumber", "tomato", "pepper", "carrot", "corn", "mushroom", "broccoli", "zucchini", "spinach", "cauliflower", "eggplant", "greenbeans", "onion"];
const FRUITS = ["banana", "berries", "strawberry", "mango", "apple", "pear", "cherry", "pineapple", "kiwi", "persimmon"];
const MATCH = new Set(Object.keys(FOOD).filter(k => !BRANDOF[k] && !PORTION[k] && !["water", "spices", "broth", "sweetener"].includes(k)));
const CATK = {meat: ["chicken", "chicken_mince", "chickenthigh", "turkey", "turkeyham", "veal", "beef", "beef20", "pork", "bacon"], fish: ["whitefish", "salmon", "shrimp", "tuna"],
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
  sandwich: [S(["bread"], [80, 60, 70], {grain: 1}), S(["chicken", "turkey", "turkeyham", "tuna", "salmon", "egg", "bacon", "beef", "tofu"], [90, 120, 100], {prot: 1}), S(["lettuce", "arugula", "spinach"], [20, 25, 25]),
    S(["tomato", "cucumber", "pepper", "onion", "pickles"], [50, 50, 60], {n: 2, veg: 1}), S(["hard", "mozz", "suluguni", "feta"], [25, 0, 0], {s: [0]}), S(["lightcheese", "creamcheese"], [0, 30, 0], {s: [1]}),
    S(["avocado"], [0, 0, 40], {s: [2]}), S(["mayo"], [15, 0, 0], {s: [0]}), S(["greek0"], [0, 30, 25], {s: [1, 2]})],
  plate: [S(PROTS, [150, 220, 170], {prot: 1}), S(["potato", "rice", "pasta", "buckwheat"], [80, 0, 0], {s: [0], grain: 1}), S(["buckwheat", "rice", "quinoa"], [0, 50, 0], {s: [1], grain: 1}), S(["buckwheat", "quinoa", "bulgur", "sweetpotato"], [0, 0, 70], {s: [2], grain: 1}),
    S(VEGS, [120, 150, 150], {n: 2, veg: 1}), S(["oil"], [15, 5, 8]), S(["sour"], [30, 0, 0], {s: [0]}), S(["greek0"], [0, 40, 0], {s: [1]})]
};
const ROLE_OF = k => PROTS.includes(k) || ["turkeyham", "chickenthigh"].includes(k) ? "prot" : VEGS.includes(k) || ["lettuce", "arugula", "pickles", "cabbage", "beet", "pumpkin", "greenpeas"].includes(k) ? "veg" : FRUITS.includes(k) ? "fruit" : ["rice", "buckwheat", "pasta", "bulgur", "quinoa", "couscous", "potato", "sweetpotato", "oats", "bread", "lavash", "tortilla", "ricenoodles"].includes(k) ? "grain" : "other";
const DEFG = {prot: 120, veg: 80, fruit: 80, grain: 60, other: 30};
const gw = s => s.toLowerCase().normalize("NFC").replace(/ё/g, "е");
function tokens(text) { return gw(text).replace(/(\d)[.,](\d)/g, "$1.$2").replace(/(\d)\s+%/g, "$1%").replace(/[,!?;:()"«»„“”]|\.(?!\d)/g, " ").split(/\s+/).filter(Boolean); }
const ALIAS = {
  mushroom: ["гриб", "mushroom", "pilz", "seta", "hongo", "სოკო", "саңырауқұлақ"], chicken: ["куриц", "курин", "курк", "курятин", "chicken", "pollo", "huhn", "hähnchen", "poulet", "ქათამ", "ქათმ", "тауық"],
  beef: ["говядин", "говяж", "яловичин", "beef", "steak", "стейк", "rind", "bœuf", "boeuf", "сиыр", "საქონლ"], potato: ["картош", "картофел", "картопл", "potato", "patata", "kartoffel", "pomme de terre", "картоп", "კარტოფ"],
  egg: ["яйц", "яєць", "яйце", "eggs", "egg", "huevo", "eier", "œuf", "oeuf", "жұмыртқ", "კვერცხ"], pasta: ["макарон", "спагет", "noodle", "nudel", "spaghet", "макарон"], hard: ["сыр", "сир", "cheese", "queso", "käse", "fromage", "ყველ", "ірімшік"],
  milk: ["молок", "молоч", "milk", "leche", "milch", "lait", "რძ", "сүт"], whitefish: ["рыб", "риб", "fish", "pescado", "fisch", "poisson", "თევზ", "балық"], rice: ["рис", "rice", "arroz", "reis", "riz", "ბრინჯ", "күріш"],
  tomato: ["томат", "tomat", "pomodor", "პომიდ", "қызанақ"], cucumber: ["огур", "огір", "cucumber", "pepino", "gurke", "concombre", "კიტრ", "қияр"], shrimp: ["кревет", "shrimp", "prawn", "gamba", "garnele", "crevette", "კრევეტ", "асшаян"],
  eggplant: ["eggplant", "баклажан"], chicken_mince: ["hähnchenhack", "фарш", "chicken mince"], salmon: ["семг", "лосос", "форел", "сёмг", "ორაგ", "лосос"], tuna: ["тунц", "тунец", "тунц", "atún", "atun", "thunfisch", "thon", "თინუს"], pepper: ["перец", "перц", "перч", "паприк", "პილპილ"],
  turkeyham: ["ветчин", "шинк", "jamón", "jamon", "schinken", "jambon", "ლორ"], herbs: ["зелен", "укроп", "петрушк", "кинз", "базилик", "зелень", "кріп", "herbs", "მწვანი"], garlic: ["чеснок", "чесноч", "часник", "garlic", "ajo", "knoblauch", "ail", "ნიორ"],
  pickles: ["солен", "маринов", "pickle", "gurkerl", "cornichon", "pepinillo", "მწნილ"], cabbage: ["капуст", "капуст", "cabbage", "repollo", "kohl", "chou", "კომბოსტ"], cauliflower: ["цветн", "cauliflower", "coliflor", "blumenkohl", "chou-fleur"],
  tvorog5: ["творог", "cottage", "requesón", "requeson", "quark", "fromage blanc", "ხაჭო", "сүзбе"], greek2: ["йогурт", "yogurt", "yoghurt", "joghurt", "yaourt", "იოგურტ"], oats: ["овся", "овес", "вівся", "oat", "avena", "hafer", "avoine", "შვრი", "сұлы"]
};
const ENDS = new Set(["", "м", "х", "ми", "а", "у", "ы", "и", "е", "ю", "я", "й", "ь", "о", "ой", "ом", "ем", "ей", "ам", "ям", "ами", "ями", "ах", "ях", "ью", "ов", "ев", "ою", "ою", "ки", "ку", "ке", "кой", "ка", "кам", "ками", "ці", "ою", "ом", "s", "es", "e", "en", "n", "er", "os", "as", "ы", "ын", "ді", "ты", "ны", "сы", "ер", "лар"]);
const GENERICW = ["легк", "light", "leicht", "léger", "leger", "ligero", "легк", "белков", "полезн", "сытн", "быстр"];
const lcpOf = (a, b) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n; };
/* how well a typed word fits one word of a food name: 0 = no match; endings (с курицей, огурцом…) are allowed */
const ADJ = /(ая|яя|ый|ий|ой|ое|ее|ые|ие|ый|ій|а|е|і)$/;
const ADJT = new Set(["ой", "ей", "ую", "юю", "ым", "им", "ыми", "ими", "ых", "их", "ого", "его", "ому", "ему", "ая", "яя", "ый", "ий", "ое", "ее", "ые", "ие", "ою", "ій", "ім", "ого", "ої", "у", "ю"]);
function wordFit(w, p) {
  if (w === p) return 20 + w.length * 2;
  // adjectives: белая → белой, овсяное → овсяном
  if (/[а-яіїє]{3,}(ая|яя|ый|ий|ой|ое|ее|ые|ие|ій|е)$/.test(p)) { const st = p.replace(/(ая|яя|ый|ий|ой|ое|ее|ые|ие|ій|е)$/, ""); if (st.length >= 3 && w.startsWith(st) && ADJT.has(w.slice(st.length))) return st.length * 2 + 2; }
  // fleeting vowel: белок → белком, огурец → огурцом, перец → перцем
  if (/[а-я](ок|ек|ец|ен|ёк)$/.test(p)) { const st = p.slice(0, -2) + p.slice(-1); if (w.startsWith(st) && ENDS.has(w.slice(st.length))) return st.length * 2 + 2; }
  const n = lcpOf(w, p), tail = w.length - n;
  const ok = p.length <= 4 ? n >= Math.max(3, p.length - 1) && tail <= 3 && ENDS.has(w.slice(n)) : (n >= Math.max(4, p.length - (p.length >= 7 ? 2 : 1)) && tail <= 4 && (p.length >= 7 || ENDS.has(w.slice(n)))) || (p.length >= 5 && w.length >= 8 && w.includes(p));
  return ok ? n * 2 + (n === w.length && n === p.length ? 20 : 0) : 0;
}
const nameWords = nm => gw(nm).replace(/\([^)]*\)/g, " ").split(/[\s/,.%]+/).filter(x => x.length >= 2 && !/\d/.test(x));
const pctOf = nm => { const m = /(\d+(?:[.,]\d+)?)\s*%/.exec(nm || ""); return m ? m[1].replace(",", ".") : null; };
/* the same product with another fat % or state: "творог" + "9%" -> tvorog9, "Reis" + "gekocht" -> ricecooked */
const famOf = nm => gw(nm || "").replace(/\([^)]*\)/g, " ").replace(/\d+(?:[.,]\d+)?\s*%/, " ").replace(/\s+/g, " ").trim();
const qualOf = nm => [...gw(nm || "").matchAll(/\(([^)]*)\)/g)].flatMap(m => m[1].split(/[\s,]+/)).filter(x => x.length >= 3);
function withQual(k, tok) {
  if (!tok) return k;
  const pct = /^\d+(\.\d+)?%$/.test(tok) ? tok.slice(0, -1) : null;
  for (const c of ORDER) { const F = LANGS[c].food, fam = famOf(F[k]);
    for (const k2 of MATCH) if (k2 !== k && famOf(F[k2]) === fam && (pct ? pctOf(F[k2]) === pct : qualOf(F[k2]).some(q => wordFit(tok, q)))) return k2; }
  return k;
}
let NAMEW = null; // every word of every food name, incl. "(сухая)", "light", "без сахара" — known words, never reported
const knownWord = w => { if (!NAMEW) { NAMEW = new Set(); for (const c of ORDER) for (const k of Object.keys(FOOD)) gw(LANGS[c].food[k] || "").split(/[\s/,.%()]+/).forEach(x => x.length >= 2 && NAMEW.add(x)); }
  if (NAMEW.has(w)) return true; for (const x of NAMEW) if (x.length >= 3 && wordFit(w, x)) return true; return false; };
let PHRASES = null; // food names of two or more words, in every language: [key, words]
function phrases() {
  if (PHRASES) return PHRASES;
  PHRASES = [];
  for (const c of ORDER) for (const k of MATCH) { const ws = nameWords(LANGS[c].food[k] || ""); if (ws.length >= 2) PHRASES.push([k, ws]); }
  return PHRASES;
}
/* a food name of 2+ words starting at toks[i]: returns {k, len} or null ("овсяное молоко", "лёгкий сыр") */
function matchPhrase(toks, i) {
  let best = null;
  for (const [k, ws] of phrases()) {
    for (let m = Math.min(ws.length, toks.length - i); m >= 2; m--) {
      let sc = 0; for (let j = 0; j < m; j++) { const f1 = wordFit(toks[i + j], ws[j]); if (!f1) { sc = 0; break; } sc += f1; }
      if (sc && m === ws.length) sc += 10; // the whole name typed
      if (sc && (!best || m > best.len || (m === best.len && sc > best.sc))) best = {k, len: m, sc};
      if (sc) break;
    }
  }
  return best;
}
function matchWord(w) {
  if (w.length < 2 || /\d/.test(w) || GENERICW.some(a => w.startsWith(a))) return [];
  const al = {};
  for (const [k, arr] of Object.entries(ALIAS)) for (const a of arr) if (w.startsWith(a) && (a.length >= 6 || w.length - a.length <= 4)) al[k] = Math.max(al[k] || 0, a.length);
  if (Object.keys(al).length) return Object.keys(al).sort((a, b) => al[b] - al[a]); // longest alias wins: eggplant before egg
  const best = {};
  for (const c of ORDER) { const F = LANGS[c].food; for (const k of MATCH) {
    const nw = nameWords(F[k] || ""); nw.forEach((x, pi) => { if (x.length < 3 && x !== w) return; const sc = wordFit(w, x); if (sc) { const v = sc - pi * 3 - (nw.length - 1) * 4; if (!(best[k] >= v)) best[k] = v; } });
  } }
  return Object.keys(best).sort((a, b) => best[b] - best[a]);
}
/* words that carry no product: wishes, meals, adjectives */
const FILLER = ["такой", "такое", "такую", "такие", "красн", "бел", "зелен", "желт", "черн", "красн", "red", "white", "green", "yellow", "black", "rojo", "roja", "blanc", "rouge", "vert", "rot", "weiß", "weiss", "grün", "хоч", "хотел", "нужн", "надо", "мне", "сдела", "приготов", "придума", "блюд", "рецепт", "что", "нибудь", "како", "можно", "пожалуйст", "вкусн", "прост", "домашн", "для", "или", "после", "трениров", "завтрак", "ужин", "обед", "перекус", "утр", "вечер", "больш", "маленьк", "диет", "низкокал", "кето", "веган", "вегетар", "остр", "сладк", "тепл", "горяч", "холодн", "свеж", "порци", "граммов", "грамм", "много", "мало", "немного", "побольше", "поменьше", "калори", "белка", "жира", "углевод", "праздн", "детск", "ребен",
  "want", "make", "something", "please", "quick", "easy", "healthy", "high", "low", "carb", "breakfast", "lunch", "dinner", "snack", "for", "some", "recipe", "dish", "tasty", "simple", "spicy", "sweet", "fresh", "hot", "cold",
  "щось", "страв", "смачн", "сніданок", "вечер", "обід", "quier", "algo", "receta", "plato", "rápid", "rapid", "sano", "desayuno", "cena", "almuerzo", "ich", "möchte", "etwas", "rezept", "gericht", "schnell", "gesund", "frühstück", "abendessen", "mittag",
  "veux", "quelque", "chose", "recette", "plat", "pour", "sain", "petit", "déjeuner", "dîner", "маған", "тағам", "керек", "მინდა", "კერძ", "რეცეპტ"];
/* named dishes of different cuisines (data/dishes.json): "борщ", "хинкали", "pad thai" */
const DISHES = DATA.dishes || {};
const DTAIL = new Set(["", "ы", "а", "и", "у", "е", "ой", "ом", "ов", "ей", "ам", "ами", "ах", "s", "es"]);
const dishWord = (w, k) => w === k || (w.startsWith(k) && (k.length >= 5 ? w.length - k.length <= 5 : DTAIL.has(w.slice(k.length)) && w.slice(k.length) !== "е"));
/* keywords of a dish: the hand-made stems plus its name in every language (whole name, and its own distinctive words) */
let DKW = null;
const DGEN = ["суп", "супу", "сорпа", "сорпасы", "soup", "sopa", "suppe", "soupe", "წვნიანი", "крем", "cream", "crema", "creme", "пюре", "puré", "püree", "purée", "тағам", "блюдо", "with", "mit", "avec"];
const dstem = w => w.length >= 6 ? w.replace(/[аеиоуыяіюєьაეიოუaeiouy]$/, "") : w;
function dishKw(key) {
  if (!DKW) {
    DKW = {}; const cnt = {}, own = {};
    const kwAll = ORDER.flatMap(c => LANGS[c].gen.kw.flat()).map(gw);
    for (const k of Object.keys(DISHES)) { own[k] = new Set(); for (const c of ORDER) { const nm = gw((LANGS[c].dish || {})[k] ? LANGS[c].dish[k].n : "").replace(/[()]/g, " ");
      nm.split(/\s+/).filter(w => w.length >= 4 && !DGEN.some(g => w.startsWith(g)) && !kwAll.includes(w) && !matchWord(w).length).forEach(w => own[k].add(dstem(w))); } own[k].forEach(w => cnt[w] = (cnt[w] || 0) + 1); }
    for (const [k, d] of Object.entries(DISHES)) {
      const s = new Set(d.kw.map(gw));
      for (const c of ORDER) { const nm = (LANGS[c].dish || {})[k]; if (!nm) continue; const ws = gw(nm.n.replace(/\s*\(.*\)/, "")).split(/\s+/); if (ws.length > 1) s.add(ws.slice(0, -1).concat(dstem(ws[ws.length - 1])).join(" ")); }
      own[k].forEach(w => { if (cnt[w] === 1) s.add(w); });
      DKW[k] = [...s];
    }
  }
  return DKW[key];
}
function findDish(toks) {
  let best = null;
  for (const key of Object.keys(DISHES)) for (const k of dishKw(key)) {
    const kw = k.split(/\s+/);
    for (let i = 0; i + kw.length <= toks.length; i++) {
      const ok = kw.every((x, j) => j === kw.length - 1 ? dishWord(toks[i + j], x) : toks[i + j] === x);
      if (ok && (!best || k.length > best.kl)) best = {key, at: i, len: kw.length, kl: k.length};
    }
  }
  return best;
}
function parseReq(text) {
  const toks = tokens(text);
  const G = ORDER.map(c => LANGS[c].gen);
  const dsh = findDish(toks);
  const ph = {}; for (let i = 0; i < toks.length; i++) { const m = matchPhrase(toks, i); if (m) { ph[i] = m; i += m.len - 1; } }
  const inPh = new Set(); Object.entries(ph).forEach(([i, m]) => { for (let j = 0; j < m.len; j++) inPh.add(+i + j); });
  const inDish = new Set(); if (dsh) for (let j = 0; j < dsh.len; j++) { inDish.add(dsh.at + j); if (ph[dsh.at + j]) delete ph[dsh.at + j]; }
  let type = null;
  const kwIn = (w, k) => w.startsWith(k) || (k.length >= 5 && w.includes(k));
  const typeOf = w => TYPES_K.findIndex((_, i) => i !== 7 && G.some(g => (g.kw[i] || []).some(k => kwIn(w, k))));
  let typeAt = -1;
  for (const [j, w] of toks.entries()) { if (dsh) break; if (inPh.has(j)) continue; const i = typeOf(w); if (i >= 0) { type = TYPES_K[i]; typeAt = j; break; } }
  if (!type && !dsh && toks.some(w => G.some(g => g.kw[7].some(k => kwIn(w, k))))) type = "plate";
  const neg = new Set(G.flatMap(g => g.neg)), negAfter = new Set(G.flatMap(g => g.negAfter)), pos = new Set(["с", "со", "з", "with", "con", "mit", "avec", "და", "қосылған"]);
  const sufs = G.flatMap(g => g.negSuffix);
  const kwAll = G.flatMap(g => g.kw.flat());
  const wants = [], excl = new Set(), skipped = [];
  const stops = new Set(ORDER.flatMap(c => LANGS[c].stop || []).concat(["со", "из", "без", "и", "a", "y", "et", "und", "або", "или", "or", "oder", "ou", "o"]));
  const first = (c, k) => nameWords(LANGS[c].food[k] || "")[0];
  const take = (k, isNeg) => {
    if (!isNeg) { if (!wants.includes(k)) wants.push(k); return; }
    excl.add(k); if (k === "tomato") excl.add("passata");
    const fw = first(lang, k); if (fw) for (const k2 of MATCH) if (first(lang, k2) === fw) excl.add(k2); // без майонеза → обычный и лёгкий
  };
  let negMode = false;
  toks.forEach((w0, i) => {
    let w = w0, isNeg = negMode;
    if (neg.has(w)) { negMode = true; return; }
    if (pos.has(w)) { negMode = false; return; }
    if (negAfter.has(w)) return;
    if (negAfter.has(toks[i + 1] || "")) isNeg = true;
    if (inDish.has(i)) return;
    if (inPh.has(i)) { if (ph[i]) take(withQual(ph[i].k, toks[i + ph[i].len]), isNeg); return; }
    for (const sf of sufs) if (sf && w.endsWith(sf) && w.length > sf.length + 2) { w = w.slice(0, -sf.length); isNeg = true; }
    if (/^\d+(\.\d+)?%?$/.test(w)) return;
    let kwh = kwAll.find(k => k.length >= 3 && kwIn(w, k));
    if (kwh && i !== typeAt && matchWord(w).length) kwh = null; // "салат с пастой / лавашом": here it is an ingredient
    if (kwh) { const rest = w.replace(kwh, ""); if (rest.length >= 4) w = rest; else if (!isNeg) return; }
    let isCat = false;
    for (const g of G) for (const [cat, arr] of Object.entries(g.cat)) if (arr.some(s => w.startsWith(s))) { isCat = true; if (isNeg) CATK[cat].forEach(k => excl.add(k)); }
    const hits = matchWord(w);
    if (!hits.length) { if (!isCat && !kwh && w.length >= 3 && !stops.has(w) && !FILLER.some(f => w.startsWith(f)) && !GENERICW.some(f => w.startsWith(f)) && !knownWord(w)) skipped.push(w0); return; }
    take(withQual(hits[0], toks[i + 1]), isNeg);
  });
  if (excl.has("tomato")) excl.add("passata");
  let unknown = false, guessed = false;
  if (dsh) type = DISHES[dsh.key].type;
  if (!type) { const g = guessType(wants.filter(k => !excl.has(k))); if (g) { type = g; guessed = true; } else { type = "plate"; unknown = true; } }
  if (!["smoothie", "oatmeal"].includes(type)) { const i = wants.indexOf("protein"); if (i >= 0) wants.splice(i, 1); }
  return {type, dish: dsh ? dsh.key : null, wants: wants.filter(k => !excl.has(k)), excl: [...excl], unknown, guessed, skipped};
}
/* no dish word: choose the dish by the products ("овсяное молоко" -> smoothie, "яйца с сыром" -> omelet) */
function guessType(ws) {
  if (!ws.length) return null;
  const has = arr => ws.some(k => arr.includes(k)), only = arr => ws.every(k => arr.includes(k));
  const LIQ = ["milk", "milkskim", "milk32", "oatmilk", "almondmilk", "soymilk", "kefir", "coconut", "protein", "matsoni", "yogurt", "greek0", "greek2", "skyr", "tvorog1", "tvorog2", "tvorog5", "tvorog9"];
  const SWEET = [...FRUITS, "berries", "dates", "pomegranate", "lemon", "honey", "maple", "pb", "cocoa", "choc", "chia", "walnut", "almonds", "peanuts", "coconutflakes", "sugar", "ginger", "mint"];
  const GRAIN = ["rice", "ricecooked", "quinoa", "bulgur", "couscous", "buckwheat", "buckwheatcooked", "lentils", "lentilsdry", "chickpeas", "beans"];
  const GREENS = ["lettuce", "arugula", "spinach"];
  if (has(["pasta", "pastacooked", "ricenoodles"])) return "pasta";
  if (has(["lavash", "tortilla"])) return "wrap";
  if (has(["bread"])) return "sandwich";
  if (has(["oats", "granola", "semolina"])) return "oatmeal";
  if (only([...LIQ, ...SWEET])) return "smoothie";
  if (has(["egg", "eggwhite"]) && !has(GRAIN) && !has(["potato", "sweetpotato"])) return "omelet";
  if (has(GREENS) || (!has(GRAIN) && !has(["potato", "sweetpotato"]) && ws.filter(k => ROLE_OF(k) === "veg").length >= 2 && !ws.some(k => ROLE_OF(k) === "prot"))) return "salad";
  if (has(GRAIN)) return "bowl";
  return "plate";
}
const TYPES_K = ["salad", "bowl", "pasta", "wrap", "omelet", "oatmeal", "smoothie", "plate", "sandwich"];
const STARCH = ["flour", "pasta", "rice", "ricenoodles", "potato", "buckwheat", "tortilla", "lavash", "bread"];
const LEAN = [{}, {beef20: "beef", chickenthigh: "chicken", sour: "greek0", mayo: "greek0", cream10: "milk", mozzfull: "mozz", hard: "lightcheese", tvorog9: "tvorog2", tvorog5: "tvorog2", milk: "milkskim", bacon: "turkeyham"},
  {beef20: "beef", mayo: "sour", cream10: "milk", mozzfull: "mozz", tvorog9: "tvorog5"}];
function buildNamed(req, strat) {
  const d = DISHES[req.dish], excl = new Set(req.excl), items = [];
  const put = (k, g) => { const o = items.find(i => i.key === k); if (o) o.g += g; else items.push({key: k, g}); };
  const wantsLeft = req.wants.filter(k => !d.items.some(([f]) => f === k));
  const wantProt = wantsLeft.find(k => ROLE_OF(k) === "prot");
  let swapped = false;
  for (let [k, g] of d.items) {
    if (wantProt && !swapped && ROLE_OF(k) === "prot" && !req.wants.includes(k)) { k = wantProt; swapped = true; wantsLeft.splice(wantsLeft.indexOf(k), 1); } // "борщ с курицей"
    if (excl.has(k)) continue;
    const lean = LEAN[strat][k]; if (lean && !excl.has(lean)) k = lean;
    const role = ROLE_OF(k);
    if (strat === 1) g *= role === "prot" ? 1.4 : ["oil", "butter"].includes(k) ? .5 : STARCH.includes(k) ? .8 : 1;
    if (strat === 2) g *= role === "veg" ? 1.3 : ["oil", "butter"].includes(k) ? .7 : STARCH.includes(k) ? .85 : 1;
    put(k, g);
  }
  wantsLeft.forEach(k => { if (!excl.has(k)) put(k, DEFG[ROLE_OF(k)] * (ROLE_OF(k) === "grain" ? (GMUL[k] || 1) : 1)); });
  return items.map(i => ({key: i.key, g: rg(i.g)}));
}
function buildDish(req, strat, seed) {
  if (req.dish && DISHES[req.dish]) return buildNamed(req, strat);
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
function genTitle(req, items) {
  if (req.dish) return (L().dish || {})[req.dish] ? L().dish[req.dish].n : LANGS.en.dish[req.dish].n;
  const type = req.type;
  const skip = new Set(["oil", "mayo", "soy", "honey", "maple", "greek0", "chia", "milk", "milkskim", "oatmilk", "almondmilk", "soymilk", "passata", "eggwhite", "sour", "cream10", "protein"]);
  const own = {pasta: "pasta", wrap: ["lavash", "tortilla"], oatmeal: "oats", omelet: "egg", sandwich: "bread"}[type] || [];
  const names = items.filter(i => !skip.has(i.key) && ![].concat(own).includes(i.key)).slice(0, 3).map(i => lc(fname(i.key).replace(/\s*\(.*\)$/, "")));
  return `${L().gen.types[TYPES_K.indexOf(type)]}: ${names.join(", ")}`;
}
function genSteps(req, items) {
  if (req.dish) return ((L().dish || {})[req.dish] || LANGS.en.dish[req.dish]).s;
  const type = req.type;
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
  return `<div class="gcard"><div class="ghead"><div class="dimg">${dishSVG(items, req.type, gen.seeds[strat])}</div><div><span class="vbadge v${strat}">${esc(vn)}</span><p class="t">${esc(genTitle(req, items))}</p><div class="c">${esc(vd)} · ${esc(T.oneServing)}</div></div></div>
    <div class="macros sm">${m.map((v, i) => `<div class="${i === 1 ? "p" : ""}"><b>${r0(v)}</b><span>${esc(T.g[i])}</span></div>`).join("")}</div>
    <ul class="gl">${items.map(it => `<li><span>${esc(fname(it.key))}</span><b>${it.g} ${esc(T.grams)}</b></li>`).join("")}</ul>
    <ol class="steps sm">${genSteps(req, items).map(s => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
    <div class="row2"><button class="btn main" data-gsave="${strat}">${esc(T.saveMine)}</button><button class="btn" data-gday="${strat}">${esc(T.addDay)}</button><button class="btn" data-reroll="${strat}">↻ ${esc(T.reroll)}</button></div></div>`;
}
function renderGenOut() {
  const el = $("#genOut"); if (!el) return;
  if (!gen) { el.innerHTML = ""; return; }
  const T = t(), req = gen.req;
  let h = `<div class="gmeta">`;
  if (req.unknown) h += `<p class="hint">${esc(T.genUnknown)}</p>`;
  if (req.dish) {
    const kws = DISHES[req.dish].kw.map(gw).filter(k => k.length >= 4 && !/\s/.test(k));
    const rs = R.filter(r => { const tt = gw(RX(r).title); return kws.some(k => tt.split(/[\s-]+/).some(w => dishWord(w, k))); }).slice(0, 3);
    if (rs.length) h += `<p class="hint">★ ${esc(T.genHaveRec)}: ${rs.map(r => `<a href="#recipe-${r.id}">${esc(RX(r).title)}</a>`).join(", ")}</p>`;
  }
  if (req.guessed) h += `<p class="hint">${esc(T.genGuess)}: ${esc(L().gen.types[TYPES_K.indexOf(req.type)])}</p>`;
  if ((req.skipped || []).length) h += `<p class="hint">? ${esc(T.genSkip)}: ${req.skipped.map(esc).join(", ")}</p>`;
  if (req.wants.length) h += `<p class="hint">✓ ${esc(T.genUse)}: ${req.wants.map(k => esc(fname(k))).join(", ")}</p>`;
  const ex = req.excl.filter(k => MATCH.has(k)); if (ex.length) h += `<p class="hint">✕ ${esc(T.genNo)}: ${ex.slice(0, 8).map(k => esc(fname(k))).join(", ")}${ex.length > 8 ? "…" : ""}</p>`;
  h += `</div>` + [0, 1, 2].map(genCard).join("");
  el.innerHTML = h;
}



/* ---------- routing ---------- */
let lastHash = location.hash;
const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function route() {
  const h = location.hash, prev = lastHash; lastHash = h;
  const isHome = x => x === "" || x === "#", isRec = x => /^#recipe-\d+$/.test(x);
  const morph = (isHome(prev) && isRec(h)) || (isRec(prev) && isHome(h));
  if (isRec(prev) && !isHome(h)) vt.id = null;
  const done = () => { document.querySelectorAll("[style*='view-transition-name']").forEach(e => e.style.viewTransitionName = ""); };
  if (morph && document.startViewTransition && !reduceMotion()) { const tr = document.startViewTransition(() => routeNow(h, prev)); tr.ready.catch(() => {}); tr.updateCallbackDone.catch(() => {}); tr.finished.then(done, done); }
  else { routeNow(h, prev); done(); animIn($("#app"), "enter"); }
}
function routeNow(h, prev) {
  const home = (h === "" || h === "#");
  const nav = /^#(day|stats|plan|shop|prep)$/.test(h) ? "day" : /^#(mine|dish-)/.test(h) ? "mine" : /^#me/.test(h) ? "me" : "r";
  chrome(nav);
  $("#tabs").hidden = !home; $("#searchBox").hidden = !home;
  if (/^#recipe-\d+$/.test(h)) renderRecipe(+h.slice(8));
  else if (h === "#zameny") renderSubs();
  else if (h === "#day") renderDay();
  else if (h === "#stats") renderStats();
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
  if (h === "#prep") { const p = $("#presets"); p && p.scrollIntoView({block: "start"}); }
  else if (home && /^#recipe-/.test(prev || "")) scrollTo(0, listY);
  else if (h !== "#me-coach") scrollTo(0, 0);
  if (/^#recipe-\d+$/.test(h) && vt.id === +h.slice(8)) { const hi = document.querySelector(".hero .dimg > :first-child"); if (hi) hi.style.viewTransitionName = "dish"; }
}
function openRecipe(card) {
  if (!location.hash || location.hash === "#") saveListPos(); vt.id = +card.dataset.id;
  document.querySelectorAll("[style*='view-transition-name']").forEach(e => e.style.viewTransitionName = "");
  const im = card.querySelector(".dimg > :first-child"); if (im) im.style.viewTransitionName = "dish";
  location.hash = "recipe-" + card.dataset.id;
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
  const pk = el.closest("[data-pk]"); if (pk) { sheetCtx.key = pk.dataset.pk; sheetCtx.g = +pk.dataset.pg || PORTION[pk.dataset.pk] || 100; renderSheet(); const g = $("#pg"); g && g.focus(); return; }
  if (el.closest("#rphReset")) { const id = curRecipeId(); delete rphoto[id]; store.set("brfy-rphoto", JSON.stringify(rphoto)); renderRecipe(id); return; }
  if (el.closest("#cookGo")) { openCook(curRecipeId()); return; }
  if (el.closest("#ckClose")) { closeCook(); return; }
  if (el.closest("#ckNext")) { cook.i++; renderCook(); return; }
  if (el.closest("#ckPrev")) { cook.i = Math.max(0, cook.i - 1); renderCook(); return; }
  if (el.closest("#ckFin")) { closeCook(); toast(t().cookDone); return; }
  if (el.closest("#ckIng")) { cook.ing = !cook.ing; renderCook(); return; }
  const cgo = el.closest("[data-cgo]"); if (cgo) { cook.i = +cgo.dataset.cgo; renderCook(); return; }
  const cts = el.closest("#ctStart"); if (cts) { cook.timer = {step: cook.i, end: Date.now() + +cts.dataset.min * 60000, paused: false}; renderCook(); return; }
  if (el.closest("#ctPause")) { const tm = cook.timer; if (tm) { if (tm.paused) { tm.end = Date.now() + tm.left * 1000; tm.paused = false; } else { tm.left = timerLeft(); tm.paused = true; } } renderCook(); return; }
  if (el.closest("#ctReset")) { cook.timer = null; renderCook(); return; }
  if (el.closest("#rpCopy")) { copyText(coachReport(), t().reportCopied); return; }
  if (el.closest("#rpTg")) { window.open("https://t.me/share/url?url=%20&text=" + encodeURIComponent(coachReport()), "_blank", "noopener"); return; }
  if (el.closest("#bkSave")) { const b = new Blob([backupJSON()], {type: "application/json"}), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "bestfood-" + todayIso() + ".json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return; }
  if (el.closest("#bkCode")) { copyText(toB64(backupJSON()), t().bkCodeCopied); return; }
  if (el.closest("#bkRestore")) { const v = ($("#bkIn") || {}).value || ""; if (!v.trim()) return; if (!state.bkArm) { state.bkArm = true; el.closest("#bkRestore").textContent = t().bkSure; return; } state.bkArm = false; restoreBackup(v); return; }
  const snb = el.closest("[data-sn]"); if (snb) { state.statN = +snb.dataset.sn; renderStats(); return; }
  const cha = el.closest("#chkApply"); if (cha) { const k = +cha.dataset.k, dk = k - +goal.k; goal = Object.assign({}, goal, {k, c: Math.max(0, r0(+goal.c + dk / 4))}); store.set("brfy-goal", JSON.stringify(goal)); store.set("brfy-checkin", JSON.stringify(todayIso())); toast(t().chkApplied); renderStats(); return; }
  const brb = el.closest("[data-brand]"); if (brb) { sheetCtx.brand = sheetCtx.brand === brb.dataset.brand ? null : brb.dataset.brand; fillProd(); return; }
  const psl = el.closest("[data-psl]"); if (psl) { sheetCtx.slot = psl.dataset.psl; renderSheet(); return; }
  const amb = el.closest("[data-addm]"); if (amb) { openSheet("prod", {q: "", slot: amb.dataset.addm}); return; }
  if (el.closest("#copyY")) { const [y, mo, d] = state.date.split("-").map(Number), yd = iso(new Date(y, mo - 1, d - 1)), src = diary[yd] || [];
    if (!src.length) { toast(t().emptyY); return; } (diary[state.date] = diary[state.date] || []).push(...JSON.parse(JSON.stringify(src))); saveDiary(); toast(t().copiedY); renderDay(); return; }
  if (el.closest("#pAdd")) { const g = +($("#pg").value || 0); if (g > 0) { if (sheetCtx.target === "shop") { addItemsToShop([[sheetCtx.key, g]]); closeSheet(); renderShop(); } else { addToDay({t: "p", key: sheetCtx.key, g}, null, sheetCtx.slot || slotNow()); closeSheet(); renderDay(); } } return; }
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
  if (el.closest("#planToDay")) { const day = plan.d[state.planDay]; let n = 0; SLOTS.forEach(sl => day[sl].forEach(e2 => { const m = planEntryMac(e2).map(v => v / e2.n); (diary[todayIso()] = diary[todayIso()] || []).push(e2.t === "r" ? {t: "r", id: e2.id, n: e2.n, per: m, mode: e2.mode, name: planName(e2), m: sl} : {t: "d", id: e2.id, n: e2.n, per: m, name: planName(e2), m: sl}); n++; })); saveDiary(); toast(T.added + " (" + n + ")"); return; }
  if (el.closest("#planClear")) { if (state.presetArm !== "clear") { state.presetArm = "clear"; renderPlan(); return; } plan = {d: [0, 1, 2, 3, 4, 5, 6].map(() => ({b: [], l: [], d: [], s: []}))}; savePlan(); state.presetArm = null; renderPlan(); return; }
  if (el.closest("#autoPlan")) { if (!(+goal.k > 0)) { toast(t().autoNeed); return; } if (!planEmpty() && state.presetArm !== "auto") { state.presetArm = "auto"; renderPlan(false); return; }
    state.presetArm = null; const res = buildWeek(); if (res) toast(t().autoDone.replace("{k}", res.k).replace("{p}", res.p)); renderPlan(false); return; }
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
  const gsv = el.closest("[data-gsave]"); if (gsv) { const s = +gsv.dataset.gsave, items = gen["items" + s]; dishes.push({id: Date.now().toString(36), name: genTitle(gen.req, items), serv: 1, type: gen.req.type, items: items.map(i => ({key: i.key, g: i.g}))}); saveDishes(); toast(T.saved); renderMine(); return; }
  const gdy = el.closest("[data-gday]"); if (gdy) { const s = +gdy.dataset.gday, items = gen["items" + s]; let m = [0, 0, 0, 0]; items.forEach(it => m = add4(m, mac(it.key, it.g))); addToDay({t: "x", n: 1, per: m, name: genTitle(gen.req, items)}); return; }
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
    if (/^#recipe/.test(location.hash)) { f.setAttribute("aria-pressed", favs.has(id)); if (f.classList.contains("rfav")) { f.setAttribute("aria-label", favs.has(id) ? T.favOn : T.favAdd); f.title = favs.has(id) ? T.favOn : T.favAdd; } else f.textContent = favs.has(id) ? T.favOn : T.favAdd; } else { renderTabs(); renderList(); }
    if (favs.has(id)) document.querySelectorAll(`[data-f="${id}"]`).forEach(b => animIn(b, "popnow")); return; }
  const tab = el.closest(".tab");
  if (tab && tab.tagName === "BUTTON") { state.fav = !!tab.dataset.fav && !state.fav; state.quick = !!tab.dataset.quick && !state.quick; state.cat = tab.dataset.c != null ? +tab.dataset.c : -1; renderTabs(); renderList(); animIn($(".list") || $("#app")); return; }
  const cu = el.closest("[data-cu]"); if (cu) { state.cuis = cu.dataset.cu || null; state.fopen = true; renderList(); return; }
  if (el.closest("#showAll")) { state.showAll = true; renderList(); return; }
  const b = el.closest("[data-b]"); if (b) { state.base = state.base === b.dataset.b ? null : b.dataset.b; state.fopen = true; renderList(); return; }
  const w = el.closest("[data-w]"); if (w) { state.q = state.q === w.dataset.w ? "" : w.dataset.w; $("#q").value = state.q; $("#qx").hidden = !state.q; renderList(); return; }
  if (el.closest("#fltBtn")) { state.fopen = !state.fopen; if (location.hash && location.hash !== "#") location.hash = ""; else { renderList(); if (state.fopen) { const f = $("#fl"); f && f.scrollIntoView({block: "nearest", behavior: "smooth"}); } } return; }
  const tg = el.closest("[data-tg]"); if (tg) { const [kind, v] = tg.dataset.tg.split(":");
    Object.assign(state, {cat: -1, quick: false, cuis: null, veg: "any", base: null, kcal: "any", prot: "any", sort: "def", q: "", fav: false}); $("#q").value = ""; $("#qx").hidden = true;
    if (kind === "cat") state.cat = +v; else if (kind === "cu") state.cuis = v; else if (kind === "veg") state.veg = v; else if (kind === "b") state.base = v;
    listY = 0; vt.id = null; location.hash = ""; return; }
  const lm = el.closest("[data-lane]"); if (lm) { state.cat = +lm.dataset.lane; state.fav = false; state.quick = false; renderTabs(); renderList(); scrollTo(0, 0); return; }
  const card = el.closest(".card[data-id]"); if (card) { openRecipe(card); return; }
  if (el.closest("#back")) { location.hash = ""; return; }
  if (el.closest("#reset")) { Object.assign(state, {cat: -1, quick: false, cuis: null, veg: "any", base: null, kcal: "any", prot: "any", sort: "def", q: "", fav: false}); $("#q").value = ""; $("#qx").hidden = true; renderTabs(); renderList(); return; }
  const li = el.closest(".ing li[data-i]"); if (li && !li.classList.contains("note") && !li.classList.contains("swp")) { const id = curRecipeId(), i = +li.dataset.i; done[id].has(i) ? done[id].delete(i) : done[id].add(i); li.classList.toggle("done"); return; }
  const pv = el.closest("[data-pv]"); if (pv) { const id = curRecipeId(); state.protOn[id] = pv.dataset.pv === "1"; renderRecipe(id); return; }
  if (el.closest("#qx")) { $("#q").value = state.q = ""; $("#qx").hidden = true; $("#q").focus(); renderList(); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#sheet").hidden) { closeSheet(); return; }
  if (e.key === "Enter" && e.target.id === "gq") { e.preventDefault(); $("#genGo").click(); return; }
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("card") && e.target.dataset.id) openRecipe(e.target);
});
function loadRecipePhoto(file, rid) {
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { const mx = 640, sc = Math.min(1, mx / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    let d = c.toDataURL("image/webp", .75); if (!d.startsWith("data:image/webp")) d = c.toDataURL("image/jpeg", .75);
    URL.revokeObjectURL(url); rphoto[rid] = d;
    if (store.set("brfy-rphoto", JSON.stringify(rphoto))) toast(t().photoSaved); else { delete rphoto[rid]; toast(t().photoFull); }
    renderRecipe(rid); };
  img.onerror = () => URL.revokeObjectURL(url); img.src = url;
}
document.addEventListener("change", e => {
  if (e.target.id === "rphIn") { const f = e.target.files && e.target.files[0]; if (f) loadRecipePhoto(f, curRecipeId()); return; }
  if (e.target.id === "bkFile") { const f = e.target.files && e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => restoreBackup(String(r.result)); r.readAsText(f); } return; }
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
if (window.APP_PWA && "serviceWorker" in navigator && /^https?:$/.test(location.protocol)) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
