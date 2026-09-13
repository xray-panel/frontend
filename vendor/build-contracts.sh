#!/usr/bin/env bash
# Сборка вендоренных контрактных библиотек XLADA.
#
# Контракты (backend-contract, node-plugins, subscription-page-types) перенесены
# в vendor/ из репозитория бэкенда, чтобы фронтенд не зависел от публикации
# пакетов @remnawave/* в npm. Каждый пакет собирается в два таргета: backend
# (commonjs) и frontend (для браузера) — так же, как это делал апстрим.
#
# Запускается автоматически через postinstall, а также вручную при обновлении
# контрактов: scripts/sync-contracts.sh в корне проекта.

set -Eeuo pipefail

VENDOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$VENDOR_DIR/.." && pwd)"
TSC="$FRONTEND_DIR/node_modules/.bin/tsc"

if [[ ! -x "$TSC" ]]; then
    echo "не найден tsc в $TSC — сначала установите зависимости фронтенда" >&2
    exit 1
fi

PACKAGES=(backend-contract node-plugins subscription-page-types)

for pkg in "${PACKAGES[@]}"; do
    dir="$VENDOR_DIR/$pkg"

    if [[ ! -d "$dir" ]]; then
        echo "пропуск $pkg: каталог не найден" >&2
        continue
    fi

    echo "сборка контракта: $pkg"
    (
        cd "$dir"
        rm -rf build
        "$TSC" -p tsconfig.backend.json
        "$TSC" -p tsconfig.frontend.json
    )
done

echo "контракты собраны"
