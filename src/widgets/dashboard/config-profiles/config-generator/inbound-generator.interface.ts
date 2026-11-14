/**
 * Состояние формы генератора инбаунда.
 *
 * Клиентов (`settings.clients`) генератор не создаёт: панель подставляет их
 * сама из модели пользователей (XRayConfig.includeUserBatch).
 */

export type TInboundProtocol =
    | 'hysteria'
    | 'shadowsocks'
    | 'trojan'
    | 'vless'
    | 'vmess'
    | 'wireguard'

export type TTransportNetwork = 'grpc' | 'httpupgrade' | 'kcp' | 'raw' | 'ws' | 'xdrive' | 'xhttp'

export type TSecurityType = 'none' | 'reality' | 'tls'

/** Внешний вид трафика VLESS Encryption: 2-й блок строки decryption. */
export type TVlessAppearance = 'native' | 'random' | 'xorpub'

export type TMaskType = 'fragment' | 'none'

/** UDP-маски finalmask; серверные варианты — только mkcp-legacy и salamander. */
export type TUdpMaskType = 'mkcp-legacy' | 'none' | 'salamander'

export interface IFallbackRow {
    id: string
    name: string
    alpn: string
    path: string
    dest: string
    xver: number
}

/** Строка карты заголовков: как HeaderMapEditor в 3x-ui. */
export interface IHeaderRow {
    id: string
    name: string
    value: string
}

export interface IInboundFormState {
    protocol: TInboundProtocol
    tag: string
    port: number
    listen: string

    network: TTransportNetwork
    security: TSecurityType

    // vless
    flow: string
    vlessEncryptionEnabled: boolean
    vlessAppearance: TVlessAppearance
    vlessTicket: string
    vlessServerKey: string
    vlessClientKey: string
    vlessEncryption: string
    fallbacks: IFallbackRow[]

    // shadowsocks
    shadowsocksMethod: string
    shadowsocksPassword: string
    shadowsocksIvCheck: boolean
    shadowsocksNetwork: string

    // hysteria
    hysteriaUdpIdleTimeout: number

    // wireguard
    wireguardSecretKey: string
    wireguardAddress: string
    wireguardPublicKey: string
    wireguardEndpoint: string
    wireguardAllowedIps: string
    wireguardKeepAlive: number
    wireguardMtu: number
    wireguardReserved: string

    // transport: raw (tcpSettings)
    rawAcceptProxyProtocol: boolean
    rawHeaderType: string
    rawRequestVersion: string
    rawRequestMethod: string
    rawRequestPath: string
    rawRequestHeaders: IHeaderRow[]
    rawResponseVersion: string
    rawResponseStatus: string
    rawResponseReason: string
    rawResponseHeaders: IHeaderRow[]

    // transport: ws
    wsPath: string
    wsHost: string
    wsAcceptProxyProtocol: boolean
    wsHeartbeatPeriod: number
    wsHeaders: IHeaderRow[]

    // transport: kcp
    kcpMtu: number
    kcpTti: number
    kcpUplinkCapacity: number
    kcpDownlinkCapacity: number
    kcpCwndMultiplier: number
    kcpMaxSendingWindow: number

    // transport: grpc
    grpcServiceName: string
    grpcAuthority: string
    grpcMultiMode: boolean

    // transport: httpupgrade
    httpupgradePath: string
    httpupgradeHost: string
    httpupgradeAcceptProxyProtocol: boolean
    httpupgradeHeaders: IHeaderRow[]

    // transport: xhttp
    xhttpPath: string
    xhttpHost: string
    xhttpMode: string
    xhttpScMaxEachPostBytes: string
    xhttpScMaxBufferedPosts: number
    xhttpScMinPostsIntervalMs: string
    xhttpScStreamUpServerSecs: string
    xhttpServerMaxHeaderBytes: number
    xhttpXPaddingBytes: string
    xhttpXPaddingObfsMode: boolean
    xhttpXPaddingKey: string
    xhttpXPaddingHeader: string
    xhttpXPaddingPlacement: string
    xhttpXPaddingMethod: string
    xhttpUplinkHttpMethod: string
    xhttpSessionPlacement: string
    xhttpSessionKey: string
    xhttpSessionTable: string
    xhttpSessionLength: string
    xhttpSeqPlacement: string
    xhttpSeqKey: string
    xhttpUplinkDataPlacement: string
    xhttpUplinkDataKey: string
    xhttpHeaders: IHeaderRow[]
    xhttpNoSseHeader: boolean
    xhttpEnableXmux: boolean
    xhttpXmuxMaxConcurrency: string
    xhttpXmuxMaxConnections: string
    xhttpXmuxCMaxReuseTimes: string
    xhttpXmuxHMaxRequestTimes: string
    xhttpXmuxHMaxReusableSecs: string
    xhttpXmuxHKeepAlivePeriod: number
    xhttpExtraJson: string

    // transport: xdrive
    xdriveService: string
    xdriveRemoteFolder: string
    xdriveClientId: string
    xdriveClientSecret: string
    xdriveRefreshToken: string
    xdriveSecrets: string
    xdriveAddress: string
    xdrivePort: number
    xdriveSegmentBytes: number
    xdriveFlushIntervalMs: number
    xdrivePollIntervalMs: number
    xdriveMaxPollIntervalMs: number
    xdriveSessionTtlSeconds: number
    xdriveConcurrency: number
    xdriveEagerWindowMs: number
    xdriveHoleTimeoutMs: number
    xdriveTemplate: string
    xdriveExtraJson: string

    // sockopt
    sockoptAcceptProxyProtocol: boolean
    sockoptTcpFastOpen: boolean
    sockoptTcpKeepAliveInterval: number
    sockoptTcpKeepAliveIdle: number
    sockoptTcpCongestion: string
    sockoptTcpWindowClamp: number
    sockoptTcpMaxSeg: number
    sockoptTcpUserTimeout: number
    sockoptTcpMptcp: boolean
    sockoptDomainStrategy: string
    sockoptMark: number
    sockoptInterface: string
    sockoptV6only: boolean
    sockoptPenetrate: boolean

    // finalmask
    finalmaskTcpType: TMaskType
    finalmaskFragmentPackets: string
    finalmaskFragmentLength: string
    finalmaskFragmentDelay: string
    finalmaskFragmentMaxSplit: string
    finalmaskQuicEnabled: boolean
    finalmaskQuicCongestion: string
    finalmaskQuicBrutalUp: string
    finalmaskQuicBrutalDown: string
    finalmaskQuicInitStreamReceiveWindow: number
    finalmaskQuicMaxStreamReceiveWindow: number
    finalmaskQuicInitConnectionReceiveWindow: number
    finalmaskQuicMaxConnectionReceiveWindow: number
    finalmaskQuicMaxIdleTimeout: number
    finalmaskQuicKeepAlivePeriod: number
    finalmaskQuicDisablePathMtuDiscovery: boolean
    finalmaskQuicMaxIncomingStreams: number
    finalmaskUdpType: TUdpMaskType
    finalmaskUdpHeader: string
    finalmaskUdpValue: string
    finalmaskUdpPassword: string

    // security: tls
    tlsServerName: string
    tlsAlpn: string
    tlsMinVersion: string
    tlsMaxVersion: string
    tlsCipherSuites: string
    tlsCertificateFile: string
    tlsKeyFile: string
    tlsRejectUnknownSni: boolean
    tlsEnableSessionResumption: boolean

    // security: reality
    realityTarget: string
    realityServerNames: string
    realityPrivateKey: string
    realityShortIds: string
    realityFingerprint: string
    realitySpiderX: string
    realityXver: number
    realityMldsa65Seed: string
    realityFallbackAfterBytes: number
    realityFallbackBytesPerSec: number
    realityFallbackBurstBytesPerSec: number

    // sniffing
    sniffingEnabled: boolean
    sniffingDestOverride: string[]
    sniffingMetadataOnly: boolean
    sniffingRouteOnly: boolean
    sniffingDomainsExcluded: string
    sniffingIpsExcluded: string
}
