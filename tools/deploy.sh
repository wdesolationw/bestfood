#!/bin/sh
# Собирает dist/ и выкладывает его в ветку gh-pages → https://wdesolationw.github.io/bestfood/
# Запуск: sh tools/deploy.sh
set -e
cd "$(dirname "$0")/.."
python3 build.py
touch dist/.nojekyll
REV=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
cp -R dist/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" log -1 --format=%an)" -c user.email="$(git -C "$OLDPWD" log -1 --format=%ae)" commit -q -m "Deploy $REV"
git -c http.postBuffer=524288000 push -q -f https://github.com/wdesolationw/bestfood.git gh-pages
cd - >/dev/null
rm -rf "$TMP"
echo "Выложено: https://wdesolationw.github.io/bestfood/ (обновится через 1–2 минуты)"
