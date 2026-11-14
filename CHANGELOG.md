# Changelog

Формат основан на релизных заметках Remnawave.

## [1.2.2] - 2026-11-14

### What's Changed

* chore(release): synchronize with Remnawave Panel 3.4.11

## [1.2.1] - 2026-11-10

### What's Changed

* feat(config-profiles): генератор инбаунда в редакторе конфигурации — VLESS, VMess, Trojan, Shadowsocks, Hysteria и транспорты RAW, WebSocket, gRPC, mKCP, HTTPUpgrade, XHTTP, XDRIVE
* feat(config-profiles): наборы полей повторяют 3x-ui v3.11.0 — Sockopt есть у всех транспортов, TCP-маски только у TCP, UDP-маски у mKCP, QUIC Params у XHTTP
* feat(config-profiles): карта заголовков отдельным редактором (v1 для WS/HTTPUpgrade/XHTTP, v2 с массивами для RAW-маскировки) вместо текстовых полей
* feat(config-profiles): XHTTP — плейсменты селектами (`Default (...)`, path/query/header/cookie), `sessionIDPlacement`/`sessionIDKey`/`sessionIDTable`/`sessionIDLength`, `uplinkDataPlacement`, XMUX-тумблер с дефолтами ядра
* feat(config-profiles): XDRIVE — три секрета Google Drive или tags-список для custom template (добавление по Enter), `remoteFolder`, фронт-хост и порт, тюнинг с дефолтами ядра
* feat(config-profiles): недоступные для выбранного транспорта надстройки скрыты, а несовместимая защита сбрасывается при смене транспорта
* feat(config-profiles): генерация паролей Shadowsocks и коротких ключей REALITY/XDRIVE, VLESS Encryption с ключами X25519/ML-KEM-768
* fix(config-profiles): отступ между кнопками редактора конфигурации и мобильная раскладка футера — подписи больше не обрезаются
* chore(i18n): ключи `config-generator.*` в en/ru/zh/fa приведены к единому набору

## [1.2.0] - 2026-11-10

### What's Changed

* chore(i18n): update Chinese translations for the `includeInSrrRules` fields
* chore(release): synchronize with Remnawave Panel 3.4.10
