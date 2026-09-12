# XPANEL Frontend

**XPANEL** — самостоятельная панель управления Xray. Проект основан на
[Remnawave](https://github.com/remnawave) и является форком
[remnawave/frontend](https://github.com/remnawave/frontend).

| | |
|---|---|
| Организация | https://github.com/xray-panel |
| Версия | 1.1.1 |
| Лицензия | AGPL-3.0-only (см. `LICENCE`) |
| Апстрим | https://github.com/remnawave/frontend |

## Атрибуция

XPANEL — производная работа от Remnawave. Исходный код Remnawave
распространяется под лицензией AGPL-3.0-only, и XPANEL сохраняет ту же
лицензию. Все права на оригинальный код принадлежат авторам Remnawave.
Подробности — в файле `NOTICE`.

Названия «Remnawave», её логотипы и домены принадлежат авторам Remnawave и в
XPANEL не используются.

## Что это

Веб-интерфейс панели XPANEL — одностраничное приложение, которое собирается в
статику. Отдельный веб-сервер для интерфейса не нужен: собранную статику
отдаёт backend ([xray-panel/backend](https://github.com/xray-panel/backend)),
она кладётся прямо в его образ.

Стек и версии из `package.json`:

| Компонент | Версия |
|---|---|
| React | `^19.2.8` |
| Vite | `8.2.2` |
| Mantine | `9.5.2` |
| zustand | `^5.0.15` |
| TanStack Query | `5.102.3` |
| i18next | `^26.4.0` |

## Чем отличается от апстрима

- **Ребрендинг.** Название, логотипы, локали, манифест и конфигурация
  переведены на XPANEL; идентификаторы, имена таблиц и заголовки API при этом
  не тронуты ради совместимости.
- **Журнал действий.** Страница `/dashboard/management/audit-log` с фильтрами
  по действиям администраторов.
- **Управление логами.** Страница `/dashboard/management/logs`: просмотр и
  очистка логов, подтверждение опасных действий и очистка логов Xray на нодах
  прямо из панели.
- **Управление администраторами.** Раздел Настройки → Administrators
  (`/dashboard/management/admins`): список учётных записей, создание, смена
  пароля и удаление.
- **Тёмная тема** оставлена темой по умолчанию.
- **Приватность.** Убраны автоматические внешние обращения и ссылки на
  `ipinfo.io`: адреса пользователей больше не уходят на сторонние сервисы,
  остаётся только переход по ссылке, который инициирует сам администратор.
- **Контракты перенесены внутрь репозитория** — папка `vendor/`; пакеты
  `@xpanel/*` больше не берутся из npm.

## Контракты

Интерфейс использует общие контракты — zod-схемы запросов и ответов из пакета
`@xpanel/backend-contract`. Из npm этот пакет **не устанавливается**: в
`package.json` зависимость объявлена как `file:./vendor/backend-contract`.

Исходники контрактов живут в репозитории backend, в `apps/backend/libs/contract`.
В рабочую копию XPANEL они копируются скриптом `scripts/sync-contracts.sh`
(запускается из корня рабочей копии) в `vendor/backend-contract`, после чего
собираются скриптом `vendor/build-contracts.sh`. Кроме `backend-contract` в
`vendor/` лежат ещё два пакета контрактов: `node-plugins`
(`@xpanel/node-plugins`) и `subscription-page-types`
(`@xpanel/subscription-page-types`).

Каждый контракт собирается в два таргета — `build/backend` (CommonJS) и
`build/frontend` (для браузера).

```bash
# после правок контрактов в репозитории backend — из корня рабочей копии
scripts/sync-contracts.sh
```

**Менять контракты нужно в репозитории backend.** Здесь их править
бессмысленно: ближайшая синхронизация перезапишет `vendor/`. В этом
репозитории контракты только синхронизируются и собираются.

Сборка контрактов запускается автоматически из `postinstall`
(`vendor/build-contracts.sh`), поэтому после `npm ci` ничего докручивать
вручную не нужно.

## Разработка

Сначала зависимости:

```bash
npm ci
```

`postinstall` собирает вендоренные контракты; для этого нужен `tsc` из
`node_modules`, то есть зависимости должны быть установлены полностью (включая
devDependencies).

Основные скрипты:

| Скрипт | Команда | Назначение |
|---|---|---|
| `npm run start:dev` | `vite` | дев-сервер Vite с горячей перезагрузкой |
| `npm run typecheck` | `tsc --noEmit` | проверка типов |
| `npm run lint` | `oxlint --format=stylish` | линт |
| `npm run format` | `oxfmt --check` | проверка форматирования |
| `npm run cb` | `vite build` | сборка в `dist/` |
| `npm run serve` | `NODE_ENV=production tsc && vite build && vite preview --port 3333` | production-сборка и локальный предпросмотр на порту 3333 |

Есть и парные команды с автоисправлением: `format:fix`, `lint:fix`, а также
`check` (`oxfmt --check && oxlint`) и `fix` (`oxfmt && oxlint --fix`).

## Сборка и выкатка

`npm run cb` собирает статику в `dist/`. Своего сервера у фронтенда нет:
сборка кладётся в образ backend, и панель отдаёт её сама. Поэтому для
публикации изменений нужен репозиторий
[xray-panel/backend](https://github.com/xray-panel/backend).

В корне рабочей копии XPANEL есть скрипт `scripts/deploy-frontend.sh`. Он
собирает интерфейс (`npm run cb`), копирует `dist/` в контекст сборки backend
(`apps/backend/frontend-dist/`), пересобирает образ backend с корректными
метаданными сборки и перезапускает контейнер панели.

## Связанные репозитории

- [xray-panel/backend](https://github.com/xray-panel/backend) — REST API, база
  данных и отдача собранного интерфейса.
- [xray-panel/node](https://github.com/xray-panel/node) — агент на
  прокси-сервере, запускает Xray-core.
- [xray-panel/subscription-page](https://github.com/xray-panel/subscription-page) —
  страница подписки для конечного пользователя.

## Лицензия

XPANEL Frontend распространяется под **AGPL-3.0-only**. Полный текст лицензии —
в файле `LICENCE` в корне репозитория (имя файла сохранено от апстрима); в
`package.json` указано то же значение — `AGPL-3.0-only`. Сведения об атрибуции
Remnawave и о границах использования бренда — в `NOTICE`.
