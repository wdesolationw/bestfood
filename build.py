#!/usr/bin/env python3
"""Собирает приложение в один файл dist/index.html.

    python3 build.py           # собрать один раз
    python3 build.py --watch   # пересобирать при каждом изменении в src/ и data/

Исходники:
  src/template.html  — оболочка страницы (head, разметка); метки /*@CSS*/, //@DATA, //@JS
  src/styles.css     — стили
  src/app.js         — код приложения
  data/*.json        — рецепты, продукты, замены и прочие справочники
  data/langs/*.json  — переводы, по файлу на язык
  data/photos/<id>.webp — фото блюд (id рецепта = имя файла), встраиваются как data:URI
"""
import base64, json, os, sys, time

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "dist", "index.html")

# Порядок ключей в объекте DATA и порядок языков (влияет на порядок в переключателе).
KEYS = ["food", "subs", "ratio", "recipes", "imgs", "order", "langs", "classic", "allerg",
        "shopcat", "veglevel", "presets", "cuisines", "coach"]
LANG_ORDER = ["ru", "en", "uk", "kk", "ka", "es", "de", "fr"]


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


def build():
    data = {}
    for k in KEYS:
        if k == "langs":
            files = sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, "data", "langs")) if f.endswith(".json"))
            codes = [c for c in LANG_ORDER if c in files] + [c for c in files if c not in LANG_ORDER]
            data[k] = {c: load_json("data", "langs", c + ".json") for c in codes}
        elif k == "imgs":
            mime = {".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
            files = sorted((f for f in os.listdir(os.path.join(ROOT, "data", "photos")) if os.path.splitext(f)[1].lower() in mime),
                           key=lambda f: (len(f), f))
            data[k] = {os.path.splitext(f)[0]: f"data:{mime[os.path.splitext(f)[1].lower()]};base64,"
                       + base64.b64encode(read("data", "photos", f, mode="rb")).decode() for f in files}
        else:
            data[k] = load_json("data", k + ".json")
    js_data = "const DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";"
    html = read("src", "template.html")
    for mark, text in (("/*@CSS*/\n", read("src", "styles.css")), ("//@DATA\n", js_data + "\n"), ("//@JS\n", read("src", "app.js"))):
        assert html.count(mark) == 1, f"метка {mark.strip()} не найдена в template.html"
        html = html.replace(mark, text)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Собрано: dist/index.html ({len(html.encode()) / 1024:.0f} КБ)")


def snapshot():
    st = {}
    for d in ("src", "data"):
        for dp, _, fs in os.walk(os.path.join(ROOT, d)):
            for f in fs:
                p = os.path.join(dp, f); st[p] = os.path.getmtime(p)
    return st


if __name__ == "__main__":
    build()
    if "--watch" in sys.argv:
        print("Слежу за src/ и data/ … (Ctrl+C — выход)")
        last = snapshot()
        while True:
            time.sleep(0.5)
            cur = snapshot()
            if cur != last:
                last = cur
                try:
                    build()
                except SystemExit as e:
                    print(e)
                except Exception as e:
                    print("Ошибка сборки:", e)
