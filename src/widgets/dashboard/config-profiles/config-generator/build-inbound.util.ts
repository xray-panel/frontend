import type {
    IHeaderRow,
    IInboundFormState,
    TInboundProtocol,
    TTransportNetwork
} from './inbound-generator.interface'

/**
 * Сборка объекта инбаунда из состояния формы.
 *
 * Функция чистая: только вход и выход, без React и DOM.
 *
 * Клиентов (`settings.clients`) здесь нет намеренно: панель сама подставляет
 * их из модели пользователей (XRayConfig.includeUserBatch), а
 * cleanInboundClients() перед этим очищает список.
 */

const VLESS_HANDSHAKE = 'mlkem768x25519plus'

const splitList = (value: string): string[] =>
    value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)

const setIfValue = (target: Record<string, unknown>, key: string, value: string): void => {
    if (value.trim()) {
        target[key] = value.trim()
    }
}

const setIfNumber = (target: Record<string, unknown>, key: string, value: number): void => {
    if (Number.isFinite(value) && value !== 0) {
        target[key] = value
    }
}

/**
 * Short ID для REALITY: hex-строка чётной длины до 16 символов.
 * Такое ограничение у самого Xray — нечётная длина или не-hex приводят
 * к ошибке конфигурации.
 */
export const generateShortIds = (count = 1, bytes = 4): string[] => {
    const limit = Math.max(1, Math.min(8, Math.floor(bytes)))
    const ids: string[] = []

    for (let i = 0; i < count; i += 1) {
        const buffer = new Uint8Array(limit)
        crypto.getRandomValues(buffer)
        ids.push(Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join(''))
    }

    return ids
}

/**
 * Fallbacks для VLESS/Trojan. Пустые строки не пишем: Xray подставляет
 * значения по умолчанию. Строка без `dest` бессмысленна — отбрасываем.
 */
export const buildFallbacks = (state: IInboundFormState): Record<string, unknown>[] =>
    state.fallbacks
        .filter((row) => row.dest.trim() !== '')
        .map((row) => ({
            ...(row.name.trim() && { name: row.name.trim() }),
            ...(row.alpn.trim() && { alpn: row.alpn.trim() }),
            ...(row.path.trim() && { path: row.path.trim() }),
            dest: /^\d+$/.test(row.dest.trim()) ? Number(row.dest.trim()) : row.dest.trim(),
            ...(row.xver > 0 && { xver: row.xver })
        }))

/** Сети, допустимые для протокола: xdrive работает только с VLESS. */
export const allowedNetworksFor = (protocol: TInboundProtocol): TTransportNetwork[] =>
    protocol === 'vless' ? [...NETWORKS, 'xdrive'] : NETWORKS

/**
 * Транспорты, на которых ядро реально строит TLS и REALITY. Наборы взяты из
 * 3x-ui (protocol-capabilities.ts): REALITY живёт только на RAW/XHTTP/gRPC и
 * только у VLESS/Trojan, mKCP и xdrive без TLS.
 */
const TLS_NETWORKS: TTransportNetwork[] = ['raw', 'ws', 'grpc', 'httpupgrade', 'xhttp']
const REALITY_NETWORKS: TTransportNetwork[] = ['raw', 'grpc', 'xhttp']

/** Какие уровни защиты допустимы для пары протокол + транспорт. */
export const allowedSecurityFor = (
    protocol: TInboundProtocol,
    network: TTransportNetwork = 'raw'
): string[] => {
    if (protocol === 'hysteria') return ['none']

    const security: string[] = ['none']

    if (TLS_NETWORKS.includes(network)) {
        security.push('tls')
    }

    if (REALITY_NETWORKS.includes(network) && (protocol === 'vless' || protocol === 'trojan')) {
        security.push('reality')
    }

    return security
}

/** Новая пустая строка карты заголовков. */
export const newHeaderRow = (): IHeaderRow => ({
    id: randomUuid(),
    name: '',
    value: ''
})

/** v1-форма Xray: `{ 'User-Agent': 'Mozilla/5.0' }` — по одному значению на имя. */
export const headerRowsToMap = (rows: IHeaderRow[]): Record<string, string> => {
    const map: Record<string, string> = {}

    for (const row of rows) {
        const name = row.name.trim()

        if (!name) continue

        map[name] = row.value
    }

    return map
}

/** v2-форма Xray: `{ Accept: ['text/html', 'application/json'] }` — имя может повторяться. */
export const headerRowsToMultiMap = (rows: IHeaderRow[]): Record<string, string[]> => {
    const map: Record<string, string[]> = {}

    for (const row of rows) {
        const name = row.name.trim()

        if (!name) continue

        map[name] = [...(map[name] ?? []), row.value]
    }

    return map
}

/**
 * Какие маски/надстройки применимы к транспорту — наборы взяты из 3x-ui
 * (lib/xray/forms/transport/FinalMaskForm.tsx): TCP-маски только у TCP-транспортов,
 * UDP-маски на сервере только у mKCP, QUIC-параметры только у XHTTP.
 */
const TCP_MASK_NETWORKS: TTransportNetwork[] = [
    'raw',
    'ws',
    'grpc',
    'httpupgrade',
    'xhttp',
    'xdrive'
]

export const supportsTcpMasks = (state: IInboundFormState): boolean =>
    state.protocol !== 'hysteria' && TCP_MASK_NETWORKS.includes(state.network)

export const supportsUdpMasks = (state: IInboundFormState): boolean =>
    state.protocol !== 'hysteria' && state.network === 'kcp'

export const supportsQuicParams = (state: IInboundFormState): boolean =>
    state.protocol !== 'hysteria' && state.network === 'xhttp'

export const randomUuid = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    return '00000000-0000-4000-8000-000000000000'
}

export const PROTOCOLS: TInboundProtocol[] = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria']

export const NETWORKS: TTransportNetwork[] = ['raw', 'ws', 'kcp', 'grpc', 'httpupgrade', 'xhttp']

/**
 * Методы, которые принимает inbound shadowsocks в xray-core. Список совпадает
 * с 3x-ui (SSInboundMethodSchema): `2022-blake3-chacha20-poly1305` исключён —
 * ядро отказывает 2022-chacha inbound с пользователями, а панель их добавляет.
 */
export const SHADOWSOCKS_METHODS = [
    '2022-blake3-aes-256-gcm',
    '2022-blake3-aes-128-gcm',
    'aes-256-gcm',
    'chacha20-poly1305',
    'chacha20-ietf-poly1305',
    'xchacha20-ietf-poly1305'
]

/**
 * Пароль shadowsocks: для `2022-*` ядро требует base64-ключ строго 16 или 32
 * байта, для legacy-методов подойдёт любая строка.
 */
export const generateShadowsocksPassword = (method: string): string => {
    if (!method.startsWith('2022-')) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const buffer = new Uint8Array(16)
        crypto.getRandomValues(buffer)

        return Array.from(buffer, (byte) => alphabet[byte % alphabet.length]).join('')
    }

    const size = method.includes('128') ? 16 : 32
    const buffer = new Uint8Array(size)
    crypto.getRandomValues(buffer)

    return btoa(String.fromCharCode(...buffer))
}

/** Строка `decryption` для VLESS Encryption (серверная сторона). */
export const buildVlessDecryption = (state: IInboundFormState): string => {
    if (!state.vlessEncryptionEnabled || !state.vlessServerKey.trim()) {
        return 'none'
    }

    return [
        VLESS_HANDSHAKE,
        state.vlessAppearance,
        state.vlessTicket.trim() || '600s',
        state.vlessServerKey.trim()
    ].join('.')
}

/** Парная строка `encryption` для клиента — та же схема, но с публичным ключом. */
export const buildVlessClientEncryption = (state: IInboundFormState): string => {
    if (!state.vlessEncryptionEnabled || !state.vlessClientKey.trim()) {
        return ''
    }

    return [VLESS_HANDSHAKE, state.vlessAppearance, '0rtt', state.vlessClientKey.trim()].join('.')
}

/**
 * XTLS flow работает не везде: по документации Xray `xtls-rprx-vision`
 * доступен только для RAW + TLS/REALITY либо при включённом VLESS Encryption.
 */
export const isFlowAllowed = (state: IInboundFormState): boolean =>
    state.protocol === 'vless' &&
    state.network !== 'xdrive' &&
    ((state.network === 'raw' && state.security !== 'none') || state.vlessEncryptionEnabled)

export const createDefaultFormState = (): IInboundFormState => ({
    protocol: 'vless',
    tag: 'vless-inbound',
    port: 443,
    listen: '',

    network: 'raw',
    security: 'none',

    flow: 'none',
    vlessEncryptionEnabled: false,
    vlessAppearance: 'native',
    vlessTicket: '600s',
    vlessServerKey: '',
    vlessClientKey: '',
    vlessEncryption: 'none',
    fallbacks: [],

    shadowsocksMethod: '2022-blake3-aes-256-gcm',
    shadowsocksPassword: '',
    shadowsocksIvCheck: false,
    shadowsocksNetwork: 'tcp,udp',

    hysteriaUdpIdleTimeout: 0,

    wireguardSecretKey: '',
    wireguardAddress: '10.0.0.1/24',
    wireguardPublicKey: '',
    wireguardEndpoint: '',
    wireguardAllowedIps: '0.0.0.0/0,::/0',
    wireguardKeepAlive: 0,
    wireguardMtu: 1420,
    wireguardReserved: '',

    rawAcceptProxyProtocol: false,
    rawHeaderType: 'none',
    rawRequestVersion: '1.1',
    rawRequestMethod: 'GET',
    rawRequestPath: '/',
    rawRequestHeaders: [],
    rawResponseVersion: '1.1',
    rawResponseStatus: '200',
    rawResponseReason: 'OK',
    rawResponseHeaders: [],

    wsPath: '/',
    wsHost: '',
    wsAcceptProxyProtocol: false,
    wsHeartbeatPeriod: 0,
    wsHeaders: [],

    kcpMtu: 1350,
    kcpTti: 50,
    kcpUplinkCapacity: 5,
    kcpDownlinkCapacity: 20,
    kcpCwndMultiplier: 1,
    kcpMaxSendingWindow: 2097152,

    grpcServiceName: '',
    grpcAuthority: '',
    grpcMultiMode: false,

    httpupgradePath: '/',
    httpupgradeHost: '',
    httpupgradeAcceptProxyProtocol: false,
    httpupgradeHeaders: [],

    xhttpPath: '/',
    xhttpHost: '',
    xhttpMode: 'auto',
    xhttpScMaxEachPostBytes: '',
    xhttpScMaxBufferedPosts: 0,
    xhttpScMinPostsIntervalMs: '',
    xhttpScStreamUpServerSecs: '',
    xhttpServerMaxHeaderBytes: 0,
    xhttpXPaddingBytes: '',
    xhttpXPaddingObfsMode: false,
    xhttpXPaddingKey: '',
    xhttpXPaddingHeader: '',
    xhttpXPaddingPlacement: '',
    xhttpXPaddingMethod: '',
    xhttpUplinkHttpMethod: '',
    xhttpSessionPlacement: '',
    xhttpSessionKey: '',
    xhttpSessionTable: '',
    xhttpSessionLength: '',
    xhttpSeqPlacement: '',
    xhttpSeqKey: '',
    xhttpUplinkDataPlacement: '',
    xhttpUplinkDataKey: '',
    xhttpHeaders: [],
    xhttpNoSseHeader: false,
    xhttpEnableXmux: false,
    xhttpXmuxMaxConcurrency: '',
    xhttpXmuxMaxConnections: '',
    xhttpXmuxCMaxReuseTimes: '',
    xhttpXmuxHMaxRequestTimes: '',
    xhttpXmuxHMaxReusableSecs: '',
    xhttpXmuxHKeepAlivePeriod: 0,
    xhttpExtraJson: '',

    xdriveService: 'google-drive',
    xdriveRemoteFolder: '',
    xdriveClientId: '',
    xdriveClientSecret: '',
    xdriveRefreshToken: '',
    xdriveSecrets: '',
    xdriveAddress: '',
    xdrivePort: 0,
    xdriveSegmentBytes: 0,
    xdriveFlushIntervalMs: 0,
    xdrivePollIntervalMs: 0,
    xdriveMaxPollIntervalMs: 0,
    xdriveSessionTtlSeconds: 0,
    xdriveConcurrency: 0,
    xdriveEagerWindowMs: 0,
    xdriveHoleTimeoutMs: 0,
    xdriveTemplate: '',
    xdriveExtraJson: '',

    sockoptAcceptProxyProtocol: false,
    sockoptTcpFastOpen: false,
    sockoptTcpKeepAliveInterval: 0,
    sockoptTcpKeepAliveIdle: 0,
    sockoptTcpCongestion: '',
    sockoptTcpWindowClamp: 0,
    sockoptTcpMaxSeg: 0,
    sockoptTcpUserTimeout: 0,
    sockoptTcpMptcp: false,
    sockoptDomainStrategy: '',
    sockoptMark: 0,
    sockoptInterface: '',
    sockoptV6only: false,
    sockoptPenetrate: false,

    finalmaskTcpType: 'none',
    finalmaskFragmentPackets: '1-3',
    finalmaskFragmentLength: '100-200',
    finalmaskFragmentDelay: '',
    finalmaskFragmentMaxSplit: '',
    finalmaskQuicEnabled: false,
    finalmaskQuicCongestion: '',
    finalmaskQuicBrutalUp: '',
    finalmaskQuicBrutalDown: '',
    finalmaskQuicInitStreamReceiveWindow: 0,
    finalmaskQuicMaxStreamReceiveWindow: 0,
    finalmaskQuicInitConnectionReceiveWindow: 0,
    finalmaskQuicMaxConnectionReceiveWindow: 0,
    finalmaskQuicMaxIdleTimeout: 0,
    finalmaskQuicKeepAlivePeriod: 0,
    finalmaskQuicDisablePathMtuDiscovery: false,
    finalmaskQuicMaxIncomingStreams: 0,
    finalmaskUdpType: 'none',
    finalmaskUdpHeader: '',
    finalmaskUdpValue: '',
    finalmaskUdpPassword: '',

    tlsServerName: '',
    tlsAlpn: '',
    tlsMinVersion: 'none',
    tlsMaxVersion: 'none',
    tlsCipherSuites: '',
    tlsCertificateFile: '',
    tlsKeyFile: '',
    tlsRejectUnknownSni: false,
    tlsEnableSessionResumption: false,

    realityTarget: '',
    realityServerNames: '',
    realityPrivateKey: '',
    realityShortIds: '',
    realityFingerprint: '',
    realitySpiderX: '',
    realityXver: 0,
    realityMldsa65Seed: '',
    realityFallbackAfterBytes: 0,
    realityFallbackBytesPerSec: 0,
    realityFallbackBurstBytesPerSec: 0,

    sniffingEnabled: true,
    sniffingDestOverride: ['http', 'tls', 'quic'],
    sniffingMetadataOnly: false,
    sniffingRouteOnly: false,
    sniffingDomainsExcluded: '',
    sniffingIpsExcluded: ''
})

const buildSettings = (state: IInboundFormState): Record<string, unknown> => {
    switch (state.protocol) {
        case 'vless': {
            const settings: Record<string, unknown> = {
                decryption: buildVlessDecryption(state),
                encryption: state.vlessEncryption.trim() || 'none'
            }

            if (state.flow && state.flow !== 'none' && isFlowAllowed(state)) {
                settings.flow = state.flow
            }

            const fallbacks = buildFallbacks(state)

            if (fallbacks.length > 0) {
                settings.fallbacks = fallbacks
            }

            return settings
        }

        case 'vmess': {
            return {}
        }

        case 'trojan': {
            const fallbacks = buildFallbacks(state)

            return fallbacks.length > 0 ? { fallbacks } : {}
        }

        case 'shadowsocks': {
            const settings: Record<string, unknown> = {
                method: state.shadowsocksMethod,
                network: state.shadowsocksNetwork
            }

            if (state.shadowsocksPassword.trim()) {
                settings.password = state.shadowsocksPassword.trim()
            }

            if (state.shadowsocksIvCheck) {
                settings.ivCheck = true
            }

            return settings
        }

        case 'hysteria': {
            // xray-core собирает только вторую версию: любое другое значение
            // он отвергает целиком ("version != 2").
            return { version: 2 }
        }

        case 'wireguard': {
            const peer: Record<string, unknown> = {}

            setIfValue(peer, 'publicKey', state.wireguardPublicKey)
            setIfValue(peer, 'endpoint', state.wireguardEndpoint)

            const allowedIps = splitList(state.wireguardAllowedIps)

            if (allowedIps.length > 0) {
                peer.allowedIPs = allowedIps
            }

            setIfNumber(peer, 'keepAlive', state.wireguardKeepAlive)

            const reserved = splitList(state.wireguardReserved)
                .map((item) => Number(item))
                .filter((item) => Number.isFinite(item))

            const settings: Record<string, unknown> = {
                secretKey: state.wireguardSecretKey.trim(),
                address: splitList(state.wireguardAddress),
                peers: Object.keys(peer).length > 0 ? [peer] : [],
                mtu: state.wireguardMtu
            }

            if (reserved.length > 0) {
                settings.reserved = reserved
            }

            return settings
        }

        default: {
            return {}
        }
    }
}

const buildXhttpSettings = (state: IInboundFormState): Record<string, unknown> => {
    const xhttp: Record<string, unknown> = { mode: state.xhttpMode }

    setIfValue(xhttp, 'path', state.xhttpPath)
    setIfValue(xhttp, 'host', state.xhttpHost)
    setIfValue(xhttp, 'scMaxEachPostBytes', state.xhttpScMaxEachPostBytes)
    setIfValue(xhttp, 'scMinPostsIntervalMs', state.xhttpScMinPostsIntervalMs)
    setIfValue(xhttp, 'scStreamUpServerSecs', state.xhttpScStreamUpServerSecs)
    setIfValue(xhttp, 'xPaddingBytes', state.xhttpXPaddingBytes)
    setIfValue(xhttp, 'xPaddingKey', state.xhttpXPaddingKey)
    setIfValue(xhttp, 'xPaddingHeader', state.xhttpXPaddingHeader)
    setIfValue(xhttp, 'xPaddingPlacement', state.xhttpXPaddingPlacement)
    setIfValue(xhttp, 'xPaddingMethod', state.xhttpXPaddingMethod)
    setIfValue(xhttp, 'uplinkHTTPMethod', state.xhttpUplinkHttpMethod)
    // xray-core 26.x переименовал sessionPlacement/sessionKey в
    // sessionIDPlacement/sessionIDKey и добавил table/length.
    setIfValue(xhttp, 'sessionIDPlacement', state.xhttpSessionPlacement)
    setIfValue(xhttp, 'sessionIDKey', state.xhttpSessionKey)
    setIfValue(xhttp, 'sessionIDTable', state.xhttpSessionTable)
    setIfValue(xhttp, 'sessionIDLength', state.xhttpSessionLength)
    setIfValue(xhttp, 'seqPlacement', state.xhttpSeqPlacement)
    setIfValue(xhttp, 'seqKey', state.xhttpSeqKey)
    setIfValue(xhttp, 'uplinkDataPlacement', state.xhttpUplinkDataPlacement)
    setIfValue(xhttp, 'uplinkDataKey', state.xhttpUplinkDataKey)

    setIfNumber(xhttp, 'scMaxBufferedPosts', state.xhttpScMaxBufferedPosts)
    setIfNumber(xhttp, 'serverMaxHeaderBytes', state.xhttpServerMaxHeaderBytes)

    if (state.xhttpXPaddingObfsMode) {
        xhttp.xPaddingObfsMode = true
    }

    if (state.xhttpNoSseHeader) {
        xhttp.noSSEHeader = true
    }

    const headers = headerRowsToMap(state.xhttpHeaders)

    if (Object.keys(headers).length > 0) {
        xhttp.headers = headers
    }

    if (state.xhttpEnableXmux) {
        const xmux: Record<string, unknown> = {}

        setIfValue(xmux, 'maxConcurrency', state.xhttpXmuxMaxConcurrency)
        setIfValue(xmux, 'maxConnections', state.xhttpXmuxMaxConnections)
        setIfValue(xmux, 'cMaxReuseTimes', state.xhttpXmuxCMaxReuseTimes)
        setIfValue(xmux, 'hMaxRequestTimes', state.xhttpXmuxHMaxRequestTimes)
        setIfValue(xmux, 'hMaxReusableSecs', state.xhttpXmuxHMaxReusableSecs)
        setIfNumber(xmux, 'hKeepAlivePeriod', state.xhttpXmuxHKeepAlivePeriod)

        xhttp.xmux = xmux
    }

    if (state.xhttpExtraJson.trim()) {
        try {
            const extra = JSON.parse(state.xhttpExtraJson)

            if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
                Object.assign(xhttp, extra)
            }
        } catch {
            // Некорректный JSON просто игнорируется: предпросмотр покажет итог.
        }
    }

    return xhttp
}

const buildTcpHeader = (state: IInboundFormState): Record<string, unknown> => {
    if (state.rawHeaderType !== 'http') {
        return { type: 'none' }
    }

    const requestHeaders = headerRowsToMultiMap(state.rawRequestHeaders)
    const responseHeaders = headerRowsToMultiMap(state.rawResponseHeaders)
    const paths = splitList(state.rawRequestPath)

    return {
        type: 'http',
        request: {
            version: state.rawRequestVersion.trim() || '1.1',
            method: state.rawRequestMethod.trim() || 'GET',
            path: paths.length > 0 ? paths : ['/'],
            ...(Object.keys(requestHeaders).length > 0 && { headers: requestHeaders })
        },
        response: {
            version: state.rawResponseVersion.trim() || '1.1',
            status: state.rawResponseStatus.trim() || '200',
            reason: state.rawResponseReason.trim() || 'OK',
            ...(Object.keys(responseHeaders).length > 0 && { headers: responseHeaders })
        }
    }
}

const buildTransportSettings = (state: IInboundFormState): Record<string, unknown> => {
    const stream: Record<string, unknown> = {}

    switch (state.network) {
        case 'raw': {
            stream.rawSettings = {
                acceptProxyProtocol: state.rawAcceptProxyProtocol,
                header: buildTcpHeader(state)
            }
            break
        }

        case 'ws': {
            const ws: Record<string, unknown> = {}

            setIfValue(ws, 'path', state.wsPath)
            setIfValue(ws, 'host', state.wsHost)
            setIfNumber(ws, 'heartbeatPeriod', state.wsHeartbeatPeriod)

            const wsHeaders = headerRowsToMap(state.wsHeaders)

            if (Object.keys(wsHeaders).length > 0) {
                ws.headers = wsHeaders
            }

            if (state.wsAcceptProxyProtocol) {
                ws.acceptProxyProtocol = true
            }

            stream.wsSettings = ws
            break
        }

        case 'kcp': {
            // Набор полей — как в 3x-ui: устаревшие congestion/readBufferSize/
            // writeBufferSize/header убраны, обфускация заголовка переехала
            // в UDP-маску mkcp-legacy.
            stream.kcpSettings = {
                mtu: state.kcpMtu,
                tti: state.kcpTti,
                uplinkCapacity: state.kcpUplinkCapacity,
                downlinkCapacity: state.kcpDownlinkCapacity,
                cwndMultiplier: state.kcpCwndMultiplier,
                maxSendingWindow: state.kcpMaxSendingWindow
            }
            break
        }

        case 'grpc': {
            const grpc: Record<string, unknown> = {}

            setIfValue(grpc, 'serviceName', state.grpcServiceName)
            setIfValue(grpc, 'authority', state.grpcAuthority)

            if (state.grpcMultiMode) {
                grpc.multiMode = true
            }

            stream.grpcSettings = grpc
            break
        }

        case 'httpupgrade': {
            const httpupgrade: Record<string, unknown> = {}

            setIfValue(httpupgrade, 'path', state.httpupgradePath)
            setIfValue(httpupgrade, 'host', state.httpupgradeHost)

            if (state.httpupgradeAcceptProxyProtocol) {
                httpupgrade.acceptProxyProtocol = true
            }

            const httpupgradeHeaders = headerRowsToMap(state.httpupgradeHeaders)

            if (Object.keys(httpupgradeHeaders).length > 0) {
                httpupgrade.headers = httpupgradeHeaders
            }

            stream.httpupgradeSettings = httpupgrade
            break
        }

        case 'xhttp': {
            stream.xhttpSettings = buildXhttpSettings(state)
            break
        }

        case 'xdrive': {
            const xdrive: Record<string, unknown> = {
                service: state.xdriveService || 'google-drive'
            }

            setIfValue(xdrive, 'remoteFolder', state.xdriveRemoteFolder)

            // Google Drive ждёт ровно три значения по порядку, остальные сервисы —
            // произвольный список секретов.
            const secrets =
                state.xdriveService === 'google-drive'
                    ? [state.xdriveClientId, state.xdriveClientSecret, state.xdriveRefreshToken]
                          .map((item) => item.trim())
                          .filter(Boolean)
                    : state.xdriveService === 'template'
                      ? splitList(state.xdriveSecrets)
                      : []

            if (secrets.length > 0) {
                xdrive.secrets = secrets
            }

            if (state.xdriveTemplate.trim()) {
                try {
                    const template = JSON.parse(state.xdriveTemplate)

                    if (template && typeof template === 'object' && !Array.isArray(template)) {
                        xdrive.template = template
                    }
                } catch {
                    // некорректный JSON игнорируется
                }
            }

            for (const [key, value] of Object.entries({
                segmentBytes: state.xdriveSegmentBytes,
                flushIntervalMs: state.xdriveFlushIntervalMs,
                pollIntervalMs: state.xdrivePollIntervalMs,
                maxPollIntervalMs: state.xdriveMaxPollIntervalMs,
                sessionTtlSeconds: state.xdriveSessionTtlSeconds,
                concurrency: state.xdriveConcurrency,
                eagerWindowMs: state.xdriveEagerWindowMs,
                holeTimeoutMs: state.xdriveHoleTimeoutMs
            })) {
                setIfNumber(xdrive, key, value)
            }

            if (state.xdriveExtraJson.trim()) {
                try {
                    const extra = JSON.parse(state.xdriveExtraJson)

                    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
                        Object.assign(xdrive, extra)
                    }
                } catch {
                    // некорректный JSON игнорируется, предпросмотр покажет итог
                }
            }

            stream.xdriveSettings = xdrive

            // Хост и порт хранилища живут в streamSettings, а не в xdriveSettings.
            // У локального сервиса их нет.
            if (state.xdriveService !== 'local') {
                setIfValue(stream, 'address', state.xdriveAddress)
                setIfNumber(stream, 'port', state.xdrivePort)
            }

            break
        }

        default: {
            break
        }
    }

    return stream
}

const buildSockopt = (state: IInboundFormState): Record<string, unknown> | null => {
    const sockopt: Record<string, unknown> = {}

    setIfValue(sockopt, 'tcpCongestion', state.sockoptTcpCongestion)
    setIfValue(sockopt, 'domainStrategy', state.sockoptDomainStrategy)
    setIfValue(sockopt, 'interface', state.sockoptInterface)

    setIfNumber(sockopt, 'tcpKeepAliveInterval', state.sockoptTcpKeepAliveInterval)
    setIfNumber(sockopt, 'tcpKeepAliveIdle', state.sockoptTcpKeepAliveIdle)
    setIfNumber(sockopt, 'tcpWindowClamp', state.sockoptTcpWindowClamp)
    setIfNumber(sockopt, 'tcpMaxSeg', state.sockoptTcpMaxSeg)
    setIfNumber(sockopt, 'tcpUserTimeout', state.sockoptTcpUserTimeout)
    setIfNumber(sockopt, 'mark', state.sockoptMark)

    if (state.sockoptAcceptProxyProtocol) sockopt.acceptProxyProtocol = true
    if (state.sockoptTcpFastOpen) sockopt.tcpFastOpen = true
    if (state.sockoptTcpMptcp) sockopt.tcpMptcp = true
    if (state.sockoptV6only) sockopt.v6only = true
    if (state.sockoptPenetrate) sockopt.penetrate = true

    return Object.keys(sockopt).length > 0 ? sockopt : null
}

const buildFinalmask = (state: IInboundFormState): Record<string, unknown> | null => {
    const finalmask: Record<string, unknown> = {}

    if (supportsTcpMasks(state) && state.finalmaskTcpType === 'fragment') {
        // xray-core 26.x ждёт списки диапазонов `lengths`/`delays`; пустой
        // `lengths` ядро отвергает («min can't be 0»), поэтому подставляем
        // дефолт 3x-ui.
        const settings: Record<string, unknown> = {}

        setIfValue(settings, 'packets', state.finalmaskFragmentPackets)

        const lengths = splitList(state.finalmaskFragmentLength)
        settings.lengths = lengths.length > 0 ? lengths : ['100-200']

        const delays = splitList(state.finalmaskFragmentDelay)

        if (delays.length > 0) {
            settings.delays = delays
        }

        setIfValue(settings, 'maxSplit', state.finalmaskFragmentMaxSplit)

        finalmask.tcp = [{ type: 'fragment', settings }]
    }

    if (supportsUdpMasks(state) && state.finalmaskUdpType !== 'none') {
        const settings: Record<string, unknown> = {}

        if (state.finalmaskUdpType === 'mkcp-legacy') {
            setIfValue(settings, 'header', state.finalmaskUdpHeader)
            setIfValue(settings, 'value', state.finalmaskUdpValue)
        } else {
            setIfValue(settings, 'password', state.finalmaskUdpPassword)
        }

        finalmask.udp = [
            {
                type: state.finalmaskUdpType,
                ...(Object.keys(settings).length > 0 && { settings })
            }
        ]
    }

    if (supportsQuicParams(state) && state.finalmaskQuicEnabled) {
        const quic: Record<string, unknown> = {}

        setIfValue(quic, 'congestion', state.finalmaskQuicCongestion)
        setIfValue(quic, 'brutalUp', state.finalmaskQuicBrutalUp)
        setIfValue(quic, 'brutalDown', state.finalmaskQuicBrutalDown)
        setIfNumber(quic, 'initStreamReceiveWindow', state.finalmaskQuicInitStreamReceiveWindow)
        setIfNumber(quic, 'maxStreamReceiveWindow', state.finalmaskQuicMaxStreamReceiveWindow)
        setIfNumber(
            quic,
            'initConnectionReceiveWindow',
            state.finalmaskQuicInitConnectionReceiveWindow
        )
        setIfNumber(
            quic,
            'maxConnectionReceiveWindow',
            state.finalmaskQuicMaxConnectionReceiveWindow
        )
        setIfNumber(quic, 'maxIdleTimeout', state.finalmaskQuicMaxIdleTimeout)
        setIfNumber(quic, 'keepAlivePeriod', state.finalmaskQuicKeepAlivePeriod)
        setIfNumber(quic, 'maxIncomingStreams', state.finalmaskQuicMaxIncomingStreams)

        if (state.finalmaskQuicDisablePathMtuDiscovery) {
            quic.disablePathMTUDiscovery = true
        }

        finalmask.quicParams = quic
    }

    return Object.keys(finalmask).length > 0 ? finalmask : null
}

const buildSecuritySettings = (
    state: IInboundFormState
): { security: string; settings?: Record<string, unknown> } => {
    if (state.security === 'tls') {
        const tls: Record<string, unknown> = {}

        setIfValue(tls, 'serverName', state.tlsServerName)
        setIfValue(tls, 'cipherSuites', state.tlsCipherSuites)

        const alpn = splitList(state.tlsAlpn)

        if (alpn.length > 0) {
            tls.alpn = alpn
        }

        if (state.tlsMinVersion && state.tlsMinVersion !== 'none') {
            tls.minVersion = state.tlsMinVersion
        }

        if (state.tlsMaxVersion && state.tlsMaxVersion !== 'none') {
            tls.maxVersion = state.tlsMaxVersion
        }

        if (state.tlsCertificateFile.trim() || state.tlsKeyFile.trim()) {
            tls.certificates = [
                {
                    ...(state.tlsCertificateFile.trim() && {
                        certificateFile: state.tlsCertificateFile.trim()
                    }),
                    ...(state.tlsKeyFile.trim() && { keyFile: state.tlsKeyFile.trim() })
                }
            ]
        }

        if (state.tlsRejectUnknownSni) tls.rejectUnknownSni = true
        if (state.tlsEnableSessionResumption) tls.enableSessionResumption = true

        return { security: 'tls', settings: tls }
    }

    if (state.security === 'reality') {
        const reality: Record<string, unknown> = {
            dest: state.realityTarget.trim(),
            serverNames: splitList(state.realityServerNames),
            privateKey: state.realityPrivateKey.trim(),
            shortIds: splitList(state.realityShortIds)
        }

        setIfNumber(reality, 'xver', state.realityXver)
        setIfValue(reality, 'mldsa65Seed', state.realityMldsa65Seed)
        setIfValue(reality, 'fingerprint', state.realityFingerprint)
        setIfValue(reality, 'spiderX', state.realitySpiderX)

        if (state.realityFallbackAfterBytes > 0) {
            reality.limitFallbackUpload = {
                afterBytes: state.realityFallbackAfterBytes,
                ...(state.realityFallbackBytesPerSec > 0 && {
                    bytesPerSec: state.realityFallbackBytesPerSec
                }),
                ...(state.realityFallbackBurstBytesPerSec > 0 && {
                    burstBytesPerSec: state.realityFallbackBurstBytesPerSec
                })
            }
        }

        return { security: 'reality', settings: reality }
    }

    return { security: 'none' }
}

const buildSniffing = (state: IInboundFormState): Record<string, unknown> => {
    if (!state.sniffingEnabled) {
        return { enabled: false }
    }

    const sniffing: Record<string, unknown> = {
        enabled: true,
        destOverride: state.sniffingDestOverride,
        routeOnly: state.sniffingRouteOnly
    }

    if (state.sniffingMetadataOnly) {
        sniffing.metadataOnly = true
    }

    const domains = splitList(state.sniffingDomainsExcluded)

    if (domains.length > 0) {
        sniffing.domainsExcluded = domains
    }

    const ips = splitList(state.sniffingIpsExcluded)

    if (ips.length > 0) {
        sniffing.ipsExcluded = ips
    }

    return sniffing
}

export const buildInbound = (state: IInboundFormState): Record<string, unknown> => {
    const tag = state.tag.trim() || `${state.protocol}-inbound`

    // hysteria — свой транспорт; xdrive существует только для VLESS.
    const network =
        state.protocol === 'hysteria'
            ? 'hysteria'
            : state.network === 'xdrive' && state.protocol !== 'vless'
              ? 'raw'
              : state.network

    const stream: Record<string, unknown> = { network }

    if (state.protocol === 'hysteria') {
        const hysteria: Record<string, unknown> = { version: 2 }

        setIfNumber(hysteria, 'udpIdleTimeout', state.hysteriaUdpIdleTimeout)

        stream.hysteriaSettings = hysteria
    } else {
        Object.assign(stream, buildTransportSettings(state))
    }

    // Shadowsocks не работает с REALITY, а xdrive не терпит security на инбаунде:
    // ядро читает этот TLS как клиентский TLS самого хранилища. В обоих случаях
    // пишем `none`, даже если состояние формы пришло с другим значением.
    const forceNoSecurity =
        (state.protocol === 'shadowsocks' && state.security === 'reality') || network === 'xdrive'

    const effectiveState = forceNoSecurity ? { ...state, security: 'none' as const } : state

    const security = buildSecuritySettings(effectiveState)
    stream.security = security.security

    if (security.settings && Object.keys(security.settings).length > 0) {
        stream[`${security.security}Settings`] = security.settings
    }

    const sockopt = buildSockopt(state)
    if (sockopt) stream.sockopt = sockopt

    const finalmask = buildFinalmask(state)
    if (finalmask) stream.finalmask = finalmask

    const inbound: Record<string, unknown> = {
        tag,
        port: state.port,
        protocol: state.protocol,
        settings: buildSettings(state),
        streamSettings: stream,
        sniffing: buildSniffing(state)
    }

    setIfValue(inbound, 'listen', state.listen)

    return inbound
}

export const buildConfigWithInbound = (
    config: Record<string, unknown>,
    inbound: Record<string, unknown>
): Record<string, unknown> => {
    const existing = Array.isArray(config.inbounds) ? config.inbounds : []

    return { ...config, inbounds: [...existing, inbound] }
}
