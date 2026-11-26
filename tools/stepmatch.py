"""Which ingredient lines each cooking step uses (from the English texts; lines are index-aligned across languages).
build.py stores the result as recipe["si"]; a recipe can set "si" by hand in recipes.json to override it."""
import re
STOP = set("""a an the and or of for with to in on into at by from as per your you any other some each
lean ground fresh frozen dry dried light plain nonfat fat free low large small medium big raw cooked canned chopped diced
shredded grated sliced drained optional mixed color colors reduced less part skim whole extra fine finely store bought homemade
style like jar jarred pack packet bag can cans tbsp tsp cup cups g ml kg pc pcs piece pieces slice slices handful handfuls
type blend powder sweet mild hot regular ready tub carton bottle about approx half quarter thin thick boneless skinless
added no sugar crispy spicy creamy brand usual best choice favorite high protein flour
smoked red black green yellow purple brown baby roasted pickled toasted minced liquid condensed buttery salted unsalted
taste seasoning""".split())
SYN = {"mayo": "mayonnaise"}
def norm(w):
    w = SYN.get(w.lower(), w.lower())
    if len(w) > 4 and w.endswith(("oes", "ches", "shes", "sses")): return w[:-2]
    if len(w) > 3 and w.endswith("ies"): return w[:-3] + "y"
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"): return w[:-1]
    return w
RAW = r"[a-zA-Zà-ÿ]+(?:-[a-zA-Zà-ÿ]+)*"
def rtoks(s): return [w.lower() for w in re.findall(RAW, s)]
def ok(w): return len(w) >= 3 and w not in STOP and not re.search(r"-(free|less|added|carb|fat|sodium|salt)$|^(no|low|non|fat|sugar)-", w)
def sig_raw(s): return [(norm(w), w) for w in rtoks(s) if ok(norm(w))]
def grams(s):
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(g|ml)\b", s); return float(m.group(1).replace(",", ".")) if m else 0
def line_alts(name, rest=""):
    name = re.sub(r"\(.*?\)", " ", name)
    lst = "," in name
    alts = [sig_raw(a) for a in re.split(r"\bor\b|/", name)]
    alts = [a for a in alts if a]
    if not alts and rest:
        alts = [sig_raw(re.split(r"[\d(]", rest)[0])]; alts = [a for a in alts if a]
    return alts, lst
def plural_ok(a, b): return a.endswith("s") == b.endswith("s") or norm(a) == a == b
def match(lines, steps, names=None):
    L = []
    for i, ln in enumerate(lines):
        if names is not None: alts, lst = line_alts(names[i]); g = ln
        else:
            if ln.startswith("<b>") or ":" not in ln: continue
            nm, rest = ln.split(":", 1); alts, lst = line_alts(nm, rest); g = grams(ln)
        if alts: L.append((i, alts, lst, g))
    cnt = {}
    for i, alts, lst, g in L:
        for w in {w for a in alts for w, _ in a}: cnt[w] = cnt.get(w, 0) + 1
    out = []
    for s in steps:
        s = re.sub(r"^\[\[.*?\]\]\s*", "", s); raw = rtoks(s); st = [norm(w) for w in raw]; S = set(st)
        bi = {(st[j], st[j + 1]) for j in range(len(st) - 1)}
        hit, covered = set(), set()
        for i, alts, lst, g in L:
            for a in alts:
                ws = [w for w, _ in a]
                spec = {w for w, r in a if cnt[w] == 1 and any(norm(x) == w and plural_ok(x, r) for x in raw)}
                bw = {w for j in range(len(ws) - 1) if (ws[j], ws[j + 1]) in bi for w in ws[j:j + 2]}
                if len(spec) >= (2 if lst and len(ws) > 1 else 1) or bw:
                    hit.add(i); why = spec | bw
                    for w, r in a:
                        if w in why: covered |= {x for x in raw if norm(x) == w and plural_ok(x, r)}
                    break
        for x in raw:
            if x in covered or not ok(norm(x)) or cnt.get(norm(x), 0) < 2: continue
            w = norm(x)
            c = [((a[-1][0] == w), -len(a), g, -i) for i, alts, lst, g in L if i not in hit for a in alts if any(w == aw and plural_ok(x, ar) for aw, ar in a)]
            if c:
                i = -max(c)[3]; hit.add(i); covered.add(x)
        out.append(sorted(hit))
    return out


def step_ingredients(r, en):
    x = en["rec"].get(str(r["id"]))
    if not x or not x[3]: return []
    if x[2]: return match(x[2], x[3])
    return match([g for _, _, g in r["items"]], x[3], [en["food"].get(k, k) for _, k, _ in r["items"]])
