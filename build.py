#!/usr/bin/env python3
"""Собирает приложение.

    python3 build.py            # приложение-папка dist/: страница, фото файлами, иконки, PWA (manifest + service worker)
    python3 build.py --single   # один самодостаточный файл dist-single/index.html (фото внутри файла)
    python3 build.py --watch    # пересобирать dist/ при каждом изменении в src/ и data/

Исходники:
  src/template.html  — оболочка страницы (head, разметка); метки <!--@HEAD-->, /*@CSS*/, //@DATA, //@JS
  src/styles.css     — стили
  src/app.js         — код приложения
  data/*.json        — рецепты, продукты, замены и прочие справочники
  data/langs/*.json  — переводы, по файлу на язык
  data/photos/<id>.webp — фото блюд (id рецепта = имя файла)
  data/icons/        — иконки приложения (создаются tools/make_icons.py)

dist/ нужно выкладывать целиком на хостинг с https (GitHub Pages, Netlify и т. п.):
только так браузер даст установить приложение и работать без интернета.
"""
import base64, hashlib, json, os, shutil, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))

# Порядок ключей в объекте DATA и порядок языков (влияет на порядок в переключателе).
KEYS = ["food", "subs", "ratio", "recipes", "imgs", "order", "langs", "classic", "allerg",
        "shopcat", "veglevel", "presets", "cuisines", "coach", "portion"]
LANG_ORDER = ["ru", "en", "uk", "kk", "ka", "es", "de", "fr"]
MIME = {".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
APP_NAME, SHORT_NAME, THEME = "Best Recipes For You", "BestFood", "#1D5A4B"


def pretty(v, ind=0, width=100):
    """JSON с отступами, но короткие массивы/объекты — в одну строку (удобно править руками)."""
    flat = json.dumps(v, ensure_ascii=False, separators=(", ", ": "))
    if not isinstance(v, (list, dict)) or not v or len(flat) + ind <= width:
        return flat
    pad, pad1 = " " * ind, " " * (ind + 2)
    if isinstance(v, list):
        body = ",\n".join(pad1 + pretty(x, ind + 2, width) for x in v)
        return "[\n" + body + "\n" + pad + "]"
    body = ",\n".join(pad1 + json.dumps(k, ensure_ascii=False) + ": " + pretty(x, ind + 2, width) for k, x in v.items())
    return "{\n" + body + "\n" + pad + "}"


def read(*p, mode="r"):
    with open(os.path.join(ROOT, *p), mode, **({} if "b" in mode else {"encoding": "utf-8"})) as f:
        return f.read()


def load_json(*p):
    path = os.path.join(*p)
    try:
        return json.loads(read(*p))
    except json.JSONDecodeError as e:
        sys.exit(f"Ошибка в {path}: строка {e.lineno}, позиция {e.colno}: {e.msg}")


def photo_files():
    return sorted((f for f in os.listdir(os.path.join(ROOT, "data", "photos")) if os.path.splitext(f)[1].lower() in MIME),
                  key=lambda f: (len(f), f))


def build(single=False):
    out_dir = os.path.join(ROOT, "dist-single" if single else "dist")
    data = {}
    for k in KEYS:
        if k == "langs":
            files = sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, "data", "langs")) if f.endswith(".json"))
            codes = [c for c in LANG_ORDER if c in files] + [c for c in files if c not in LANG_ORDER]
            data[k] = {c: load_json("data", "langs", c + ".json") for c in codes}
        elif k == "imgs":
            if single:
                data[k] = {os.path.splitext(f)[0]: f"data:{MIME[os.path.splitext(f)[1].lower()]};base64,"
                           + base64.b64encode(read("data", "photos", f, mode="rb")).decode() for f in photo_files()}
            else:
                data[k] = {os.path.splitext(f)[0]: "photos/" + f for f in photo_files()}
        else:
            data[k] = load_json("data", k + ".json")
    js_data = "const DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";"
    head = "" if single else (
        '<link rel="manifest" href="manifest.webmanifest">\n'
        f'<meta name="theme-color" content="{THEME}">\n'
        '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        f'<meta name="apple-mobile-web-app-title" content="{SHORT_NAME}">\n'
        '<script>window.APP_PWA = 1;</script>\n')
    html = read("src", "template.html")
    for mark, text in (("<!--@HEAD-->\n", head), ("/*@CSS*/\n", read("src", "styles.css")), ("//@DATA\n", js_data + "\n"), ("//@JS\n", read("src", "app.js"))):
        assert html.count(mark) == 1, f"метка {mark.strip()} не найдена в template.html"
        html = html.replace(mark, text)

    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir)
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    if single:
        print(f"Собрано: dist-single/index.html ({len(html.encode()) / 1024:.0f} КБ)")
        return

    os.makedirs(os.path.join(out_dir, "photos"))
    for f in photo_files():
        shutil.copy2(os.path.join(ROOT, "data", "photos", f), os.path.join(out_dir, "photos", f))
    shutil.copytree(os.path.join(ROOT, "data", "icons"), os.path.join(out_dir, "icons"))
    manifest = {"name": APP_NAME, "short_name": SHORT_NAME, "start_url": "./", "scope": "./", "display": "standalone",
                "background_color": "#F3F5F4", "theme_color": THEME, "lang": "ru",
                "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                          {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                          {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
    with open(os.path.join(out_dir, "manifest.webmanifest"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    files = ["./", "index.html", "manifest.webmanifest"] + ["icons/" + f for f in sorted(os.listdir(os.path.join(out_dir, "icons")))] + ["photos/" + f for f in photo_files()]
    ver = hashlib.sha1(html.encode() + "".join(files).encode()).hexdigest()[:10]
    with open(os.path.join(out_dir, "sw.js"), "w", encoding="utf-8") as f:
        f.write(SW.replace("__VER__", ver).replace("__FILES__", json.dumps(files)))
    total = sum(os.path.getsize(os.path.join(dp, x)) for dp, _, fs in os.walk(out_dir) for x in fs)
    print(f"Собрано: dist/ — index.html {len(html.encode()) / 1024:.0f} КБ, всего {total / 1024 / 1024:.1f} МБ, версия {ver}")


SW = """// Service worker: keeps the app and photos available offline.
const CACHE = "bestfood-__VER__", FILES = __FILES__;
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith("bestfood-")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate") { e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html"))); return; }
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req)));
    return;
  }
  if (/fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE + "-fonts").then(c => c.match(req).then(r => r || fetch(req).then(n => { c.put(req, n.clone()); return n; }))));
  }
});
"""


def snapshot():
    st = {}
    for d in ("src", "data"):
        for dp, _, fs in os.walk(os.path.join(ROOT, d)):
            for f in fs:
                p = os.path.join(dp, f); st[p] = os.path.getmtime(p)
    return st


if __name__ == "__main__":
    single = "--single" in sys.argv
    build(single)
    if "--watch" in sys.argv:
        print("Слежу за src/ и data/ … (Ctrl+C — выход)")
        last = snapshot()
        while True:
            time.sleep(0.5)
            cur = snapshot()
            if cur != last:
                last = cur
                try:
                    build(single)
                except SystemExit as e:
                    print(e)
                except Exception as e:
                    print("Ошибка сборки:", e)
