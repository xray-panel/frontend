import type { IFallbackRow, IHeaderRow, IInboundFormState } from './inbound-generator.interface'
import type { editor } from 'monaco-editor'
import type { ReactNode, RefObject } from 'react'

import { CodeHighlight } from '@mantine/code-highlight'
import {
    Accordion,
    ActionIcon,
    Button,
    Divider,
    Flex,
    Group,
    MultiSelect,
    NumberInput,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Tabs,
    TagsInput,
    Text,
    Textarea,
    TextInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
    generateMlKem768,
    generateX25519
} from '@widgets/dashboard/config-profiles/keypair-generator/keypair-utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    TbBraces,
    TbNetwork,
    TbPlus,
    TbSettings,
    TbShieldLock,
    TbTag,
    TbTrash,
    TbWand
} from 'react-icons/tb'

import {
    allowedNetworksFor,
    allowedSecurityFor,
    buildConfigWithInbound,
    buildInbound,
    buildVlessClientEncryption,
    createDefaultFormState,
    generateShadowsocksPassword,
    generateShortIds,
    isFlowAllowed,
    newHeaderRow,
    PROTOCOLS,
    randomUuid,
    SHADOWSOCKS_METHODS,
    supportsQuicParams,
    supportsTcpMasks,
    supportsUdpMasks
} from './build-inbound.util'

type THeaderKey =
    | 'httpupgradeHeaders'
    | 'rawRequestHeaders'
    | 'rawResponseHeaders'
    | 'wsHeaders'
    | 'xhttpHeaders'

const XDRIVE_SERVICES = [
    { label: 'Google Drive', value: 'google-drive' },
    { label: 'Local', value: 'local' },
    { label: 'Custom template', value: 'template' }
]

const newFallback = (): IFallbackRow => ({
    id: randomUuid(),
    name: '',
    alpn: '',
    path: '',
    dest: '',
    xver: 0
})

const FLOW_OPTIONS = [
    { label: 'none', value: 'none' },
    { label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' }
]
const APPEARANCE_OPTIONS = ['native', 'xorpub', 'random']
const KEY_TYPE_OPTIONS = [
    { label: 'X25519', value: 'x25519' },
    { label: 'ML-KEM-768', value: 'mlkem768' }
]
const TLS_VERSION_OPTIONS = [
    { label: '—', value: 'none' },
    { label: '1.0', value: '1.0' },
    { label: '1.1', value: '1.1' },
    { label: '1.2', value: '1.2' },
    { label: '1.3', value: '1.3' }
]
const XHTTP_MODE_OPTIONS = ['auto', 'packet-up', 'stream-up', 'stream-one']
// Пустое значение (дефолт ядра) нельзя держать в Select — Mantine не принимает
// value='', поэтому пункт «Default (...)» хранит сентинел и превращается в ''
// только при записи в состояние.
const DEFAULT_OPTION = 'default'
const SESSION_PLACEMENT_OPTIONS = [
    { label: 'Default (path)', value: DEFAULT_OPTION },
    { label: 'path', value: 'path' },
    { label: 'header', value: 'header' },
    { label: 'cookie', value: 'cookie' },
    { label: 'query', value: 'query' }
]
const SEQUENCE_PLACEMENT_OPTIONS = SESSION_PLACEMENT_OPTIONS
const UPLINK_DATA_PLACEMENT_OPTIONS = [
    { label: 'Default (auto)', value: DEFAULT_OPTION },
    { label: 'auto', value: 'auto' },
    { label: 'body', value: 'body' },
    { label: 'header', value: 'header' },
    { label: 'cookie', value: 'cookie' }
]
const PADDING_PLACEMENT_OPTIONS = [
    { label: 'Default (queryInHeader)', value: DEFAULT_OPTION },
    { label: 'queryInHeader', value: 'queryInHeader' },
    { label: 'header', value: 'header' },
    { label: 'cookie', value: 'cookie' },
    { label: 'query', value: 'query' }
]
const PADDING_METHOD_OPTIONS = [
    { label: 'Default (repeat-x)', value: DEFAULT_OPTION },
    { label: 'repeat-x', value: 'repeat-x' },
    { label: 'tokenish', value: 'tokenish' }
]
const SESSION_ID_TABLES = [
    'ALPHABET',
    'Alphabet',
    'BASE36',
    'Base62',
    'HEX',
    'alphabet',
    'base36',
    'hex',
    'number'
]
const UPLINK_HTTP_METHOD_OPTIONS = (mode: string) => [
    { label: 'Default (POST)', value: DEFAULT_OPTION },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    {
        disabled: mode !== 'packet-up',
        label: 'GET (packet-up only)',
        value: 'GET'
    }
]
const RAW_HEADER_OPTIONS = ['none', 'http']
const DEST_OVERRIDE_OPTIONS = ['http', 'tls', 'quic', 'fakedns']
// xray-core знает TCP-маски fragment / sudoku / header-custom / xmc / filter.
// В форме пока только fragment: остальные требуют вложенных структур, которые
// проще дописать в JSON руками.
const TCP_MASK_OPTIONS = [
    { label: 'none', value: 'none' },
    { label: 'fragment', value: 'fragment' }
]
const UDP_MASK_OPTIONS = [
    { label: 'none', value: 'none' },
    { label: 'mkcp-legacy', value: 'mkcp-legacy' },
    { label: 'salamander', value: 'salamander' }
]

interface IProps {
    editorRef: RefObject<editor.IStandaloneCodeEditor | null>
    onClose: () => void
}

export const InboundGeneratorWidget = ({ editorRef, onClose }: IProps) => {
    const { t } = useTranslation()

    const [state, setState] = useState<IInboundFormState>(createDefaultFormState)
    const [keyType, setKeyType] = useState('x25519')

    function setField<K extends keyof IInboundFormState>(key: K, value: IInboundFormState[K]) {
        setState((prev) => ({ ...prev, [key]: value }))
    }

    const inbound = useMemo(() => buildInbound(state), [state])
    const inboundJson = useMemo(() => JSON.stringify(inbound, null, 2), [inbound])
    const clientEncryption = useMemo(() => buildVlessClientEncryption(state), [state])
    const flowAllowed = isFlowAllowed(state)

    const handleApply = () => {
        const instance = editorRef.current

        if (!instance) {
            return
        }

        const raw = instance.getValue().trim()

        let baseConfig: Record<string, unknown> = {}

        if (raw.length > 0) {
            let parsed: unknown

            try {
                parsed = JSON.parse(raw)
            } catch {
                notifications.show({
                    color: 'red',
                    message: t('config-generator.invalid-json'),
                    title: t('common.message.error')
                })
                return
            }

            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                notifications.show({
                    color: 'red',
                    message: t('config-generator.invalid-json'),
                    title: t('common.message.error')
                })
                return
            }

            baseConfig = parsed as Record<string, unknown>
        }

        const nextConfig = buildConfigWithInbound(baseConfig, inbound)
        const nextValue = JSON.stringify(nextConfig, null, 2)
        const model = instance.getModel()

        if (model) {
            instance.pushUndoStop()
            instance.executeEdits('inbound-generator', [
                {
                    forceMoveMarkers: true,
                    range: model.getFullModelRange(),
                    text: nextValue
                }
            ])
            instance.pushUndoStop()
        } else {
            instance.setValue(nextValue)
        }

        notifications.show({
            color: 'teal',
            message: t('config-generator.applied'),
            title: t('common.action.save')
        })

        onClose()
    }

    const text = (
        key: keyof IInboundFormState,
        label: string,
        options?: {
            description?: string
            flex?: number
            placeholder?: string
            withAsterisk?: boolean
        }
    ) => (
        <TextInput
            description={options?.description}
            label={label}
            onChange={(event) => setField(key, event.currentTarget.value as never)}
            placeholder={options?.placeholder}
            style={options?.flex ? { flex: options.flex } : undefined}
            value={String(state[key] ?? '')}
            withAsterisk={options?.withAsterisk}
        />
    )

    const number = (key: keyof IInboundFormState, label: string, min = 0, placeholder?: string) => (
        <NumberInput
            label={label}
            min={min}
            onChange={(value) => setField(key, (typeof value === 'number' ? value : 0) as never)}
            placeholder={placeholder}
            // У полей с подсказкой ноль значит «дефолт ядра», поэтому
            // показываем его пустым полем.
            value={placeholder && Number(state[key] ?? 0) === 0 ? '' : Number(state[key] ?? 0)}
        />
    )

    const toggle = (key: keyof IInboundFormState, label: string, disabled = false) => (
        <Switch
            checked={Boolean(state[key])}
            disabled={disabled}
            label={label}
            onChange={(event) => setField(key, event.currentTarget.checked as never)}
        />
    )

    /**
     * Редактор карты заголовков — как HeaderMapEditor в 3x-ui: строки
     * «имя → значение» с кнопками добавления и удаления.
     */
    const headerRowsEditor = (key: THeaderKey, label: string) => {
        const rows = state[key]

        const patchRow = (id: string, patch: Partial<IHeaderRow>) => {
            setField(
                key,
                rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
            )
        }

        return (
            <Stack gap="xs">
                <Text fw={500} size="sm">
                    {label}
                </Text>

                {rows.map((row) => (
                    <Group gap="xs" key={row.id} wrap="nowrap">
                        <TextInput
                            onChange={(event) =>
                                patchRow(row.id, { name: event.currentTarget.value })
                            }
                            placeholder={t('config-generator.field.header-name')}
                            style={{ flex: 1 }}
                            value={row.name}
                        />
                        <TextInput
                            onChange={(event) =>
                                patchRow(row.id, { value: event.currentTarget.value })
                            }
                            placeholder={t('config-generator.field.header-value')}
                            style={{ flex: 1 }}
                            value={row.value}
                        />
                        <ActionIcon
                            aria-label={t('common.action.delete')}
                            color="red"
                            onClick={() =>
                                setField(
                                    key,
                                    rows.filter((item) => item.id !== row.id)
                                )
                            }
                            variant="subtle"
                        >
                            <TbTrash size={16} />
                        </ActionIcon>
                    </Group>
                ))}

                <Button
                    leftSection={<TbPlus size={14} />}
                    onClick={() => setField(key, [...rows, newHeaderRow()])}
                    size="xs"
                    variant="light"
                    w="fit-content"
                >
                    {t('config-generator.action.add-header')}
                </Button>
            </Stack>
        )
    }

    /** Select, у которого первый пункт — «дефолт ядра» (пустая строка в состоянии). */
    const defaultableSelect = (
        key: keyof IInboundFormState,
        label: string,
        data: { disabled?: boolean; label: string; value: string }[]
    ) => {
        const current = String(state[key] ?? '')

        return (
            <Select
                data={data}
                label={label}
                onChange={(value) =>
                    setField(key, (value === DEFAULT_OPTION ? '' : (value ?? '')) as never)
                }
                value={current === '' ? DEFAULT_OPTION : current}
            />
        )
    }

    const grid = (children: ReactNode) => (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {children}
        </SimpleGrid>
    )

    const updateFallback = (id: string, patch: Partial<IFallbackRow>) => {
        setField(
            'fallbacks',
            state.fallbacks.map((row) => (row.id === id ? { ...row, ...patch } : row))
        )
    }

    const fallbacksEditor = () => (
        <Stack gap="xs">
            <Group justify="space-between">
                <Text fw={500} size="sm">
                    {t('config-generator.fallbacks-title')}
                </Text>
                <Button
                    onClick={() => setField('fallbacks', [...state.fallbacks, newFallback()])}
                    size="compact-sm"
                    variant="default"
                >
                    {t('config-generator.action.add-fallback')}
                </Button>
            </Group>

            {state.fallbacks.length === 0 && (
                <Text c="dimmed" size="xs">
                    {t('config-generator.fallbacks-empty')}
                </Text>
            )}

            {state.fallbacks.map((row, index) => (
                <Paper key={row.id} p="xs" radius="sm" withBorder>
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text c="dimmed" size="xs">
                                #{index + 1}
                            </Text>
                            <ActionIcon
                                color="red"
                                onClick={() =>
                                    setField(
                                        'fallbacks',
                                        state.fallbacks.filter((item) => item.id !== row.id)
                                    )
                                }
                                variant="subtle"
                            >
                                <TbTrash size={14} />
                            </ActionIcon>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                            <TextInput
                                label="name"
                                onChange={(event) =>
                                    updateFallback(row.id, { name: event.currentTarget.value })
                                }
                                value={row.name}
                            />
                            <TextInput
                                label="alpn"
                                onChange={(event) =>
                                    updateFallback(row.id, { alpn: event.currentTarget.value })
                                }
                                value={row.alpn}
                            />
                            <TextInput
                                label="path"
                                onChange={(event) =>
                                    updateFallback(row.id, { path: event.currentTarget.value })
                                }
                                value={row.path}
                            />
                            <TextInput
                                label="dest"
                                onChange={(event) =>
                                    updateFallback(row.id, { dest: event.currentTarget.value })
                                }
                                placeholder="80 или /var/run/x.sock"
                                value={row.dest}
                            />
                            <NumberInput
                                label="xver"
                                max={2}
                                min={0}
                                onChange={(value) =>
                                    updateFallback(row.id, {
                                        xver: typeof value === 'number' ? value : 0
                                    })
                                }
                                value={row.xver}
                            />
                        </SimpleGrid>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    )

    const newVlessKeys = () => {
        if (keyType === 'mlkem768') {
            const keyPair = generateMlKem768()

            return {
                clientKey: keyPair.mlkem768PublicKey,
                serverKey: keyPair.mlkem768Seed
            }
        }

        const keyPair = generateX25519()

        return { clientKey: keyPair.password, serverKey: keyPair.privateKey }
    }

    const generateVlessKeys = () => {
        const keys = newVlessKeys()

        setState((prev) => ({
            ...prev,
            vlessClientKey: keys.clientKey,
            vlessServerKey: keys.serverKey
        }))
    }

    const protocolSettings = () => {
        switch (state.protocol) {
            case 'vless': {
                return (
                    <Stack gap="sm">
                        <Select
                            data={FLOW_OPTIONS}
                            description={
                                flowAllowed
                                    ? t('config-generator.hint.flow-managed')
                                    : t('config-generator.hint.flow-unavailable')
                            }
                            disabled={!flowAllowed}
                            label={t('config-generator.field.flow')}
                            onChange={(value) => setField('flow', value ?? 'none')}
                            value={state.flow}
                        />

                        <Divider label="VLESS Encryption" labelPosition="left" />

                        {toggle(
                            'vlessEncryptionEnabled',
                            t('config-generator.field.encryption-enabled')
                        )}

                        {state.vlessEncryptionEnabled && (
                            <Stack gap="sm">
                                <Select
                                    data={APPEARANCE_OPTIONS}
                                    description={t('config-generator.hint.appearance')}
                                    label={t('config-generator.field.appearance')}
                                    onChange={(value) =>
                                        setField(
                                            'vlessAppearance',
                                            (value ??
                                                'native') as IInboundFormState['vlessAppearance']
                                        )
                                    }
                                    value={state.vlessAppearance}
                                />
                                {text('vlessTicket', t('config-generator.field.ticket'), {
                                    description: t('config-generator.hint.ticket')
                                })}

                                <Flex align="flex-end" gap="xs">
                                    <Select
                                        data={KEY_TYPE_OPTIONS}
                                        label={t('config-generator.field.key-type')}
                                        onChange={(value) => setKeyType(value ?? 'x25519')}
                                        style={{ flex: 1 }}
                                        value={keyType}
                                    />
                                    <Button onClick={generateVlessKeys} variant="default">
                                        {t('config-generator.action.generate')}
                                    </Button>
                                </Flex>

                                {text('vlessServerKey', t('config-generator.field.decryption-key'))}

                                {clientEncryption && (
                                    <Textarea
                                        autosize
                                        description={t('config-generator.hint.client-encryption')}
                                        label={t('config-generator.field.client-encryption')}
                                        minRows={2}
                                        readOnly
                                        value={clientEncryption}
                                    />
                                )}
                            </Stack>
                        )}
                    </Stack>
                )
            }

            case 'vmess':
            case 'trojan': {
                return (
                    <Text c="dimmed" size="sm">
                        {t('config-generator.hint.no-protocol-settings')}
                    </Text>
                )
            }

            case 'shadowsocks': {
                return (
                    <Stack gap="sm">
                        <Select
                            data={SHADOWSOCKS_METHODS}
                            label={t('config-generator.field.method')}
                            onChange={(value) => {
                                if (!value) return
                                setState((prev) => ({
                                    ...prev,
                                    shadowsocksMethod: value,
                                    shadowsocksPassword:
                                        prev.shadowsocksPassword ||
                                        generateShadowsocksPassword(value)
                                }))
                            }}
                            value={state.shadowsocksMethod}
                        />
                        <Select
                            data={['tcp', 'udp', 'tcp,udp']}
                            label={t('config-generator.field.network')}
                            onChange={(value) => setField('shadowsocksNetwork', value ?? 'tcp,udp')}
                            value={state.shadowsocksNetwork}
                        />
                        <Flex align="flex-end" gap="xs">
                            {text('shadowsocksPassword', t('config-generator.field.password'), {
                                flex: 1
                            })}
                            <Button
                                onClick={() =>
                                    setField(
                                        'shadowsocksPassword',
                                        generateShadowsocksPassword(state.shadowsocksMethod)
                                    )
                                }
                                variant="default"
                            >
                                {t('config-generator.action.generate')}
                            </Button>
                        </Flex>
                        <Text c="dimmed" size="xs">
                            {t('config-generator.hint.shadowsocks-password')}
                        </Text>
                        {toggle('shadowsocksIvCheck', t('config-generator.field.iv-check'))}
                    </Stack>
                )
            }

            case 'hysteria': {
                return (
                    <Stack gap="sm">
                        {number(
                            'hysteriaUdpIdleTimeout',
                            t('config-generator.field.udp-idle-timeout')
                        )}
                        <Text c="dimmed" size="xs">
                            {t('config-generator.hint.hysteria-transport')}
                        </Text>
                    </Stack>
                )
            }

            default: {
                return null
            }
        }
    }

    const xhttpSettings = () => {
        const isPacketUp = state.xhttpMode === 'packet-up'
        const isStreamUp = state.xhttpMode === 'stream-up'
        const showsPacketFields = isPacketUp || state.xhttpMode === 'auto'

        return (
            <Stack gap="sm">
                {text('xhttpPath', t('config-generator.field.path'))}
                {text('xhttpHost', t('config-generator.field.host'))}

                <Select
                    data={XHTTP_MODE_OPTIONS}
                    label={t('config-generator.field.mode')}
                    onChange={(value) => setField('xhttpMode', value ?? 'auto')}
                    value={state.xhttpMode}
                />

                {showsPacketFields &&
                    grid(
                        <>
                            {text(
                                'xhttpScMaxEachPostBytes',
                                t('config-generator.field.max-upload-size'),
                                { description: t('config-generator.hint.range') }
                            )}
                            {number(
                                'xhttpScMaxBufferedPosts',
                                t('config-generator.field.max-buffered-upload'),
                                0,
                                '30'
                            )}
                            {text(
                                'xhttpScMinPostsIntervalMs',
                                t('config-generator.field.min-upload-interval'),
                                {
                                    placeholder: '50-150',
                                    description: t('config-generator.hint.range')
                                }
                            )}
                        </>
                    )}

                {isStreamUp &&
                    grid(
                        <>
                            {number(
                                'xhttpScMaxBufferedPosts',
                                t('config-generator.field.max-buffered-upload'),
                                0,
                                '30'
                            )}
                            {text(
                                'xhttpScStreamUpServerSecs',
                                t('config-generator.field.stream-up-server'),
                                {
                                    placeholder: '20-80',
                                    description: t('config-generator.hint.range')
                                }
                            )}
                        </>
                    )}

                {grid(
                    <>
                        {number(
                            'xhttpServerMaxHeaderBytes',
                            t('config-generator.field.server-max-header-bytes'),
                            0,
                            '0'
                        )}
                        {text('xhttpXPaddingBytes', t('config-generator.field.x-padding-bytes'), {
                            placeholder: '100-1000',
                            description: t('config-generator.hint.range')
                        })}
                    </>
                )}

                {headerRowsEditor('xhttpHeaders', t('config-generator.field.headers'))}

                {defaultableSelect(
                    'xhttpUplinkHttpMethod',
                    t('config-generator.field.uplink-http-method'),
                    UPLINK_HTTP_METHOD_OPTIONS(state.xhttpMode)
                )}

                {toggle('xhttpXPaddingObfsMode', t('config-generator.field.x-padding-obfs-mode'))}

                {state.xhttpXPaddingObfsMode && (
                    <Stack gap="sm">
                        {grid(
                            <>
                                {text(
                                    'xhttpXPaddingKey',
                                    t('config-generator.field.x-padding-key'),
                                    { placeholder: 'x_padding' }
                                )}
                                {text(
                                    'xhttpXPaddingHeader',
                                    t('config-generator.field.x-padding-header'),
                                    { placeholder: 'X-Padding' }
                                )}
                            </>
                        )}
                        {defaultableSelect(
                            'xhttpXPaddingPlacement',
                            t('config-generator.field.x-padding-placement'),
                            PADDING_PLACEMENT_OPTIONS
                        )}
                        {defaultableSelect(
                            'xhttpXPaddingMethod',
                            t('config-generator.field.x-padding-method'),
                            PADDING_METHOD_OPTIONS
                        )}
                    </Stack>
                )}

                {/* Плейсменты: пустая строка = дефолт ядра, поэтому первый
                    пункт списка подписан «Default (...)». */}
                {defaultableSelect(
                    'xhttpSessionPlacement',
                    t('config-generator.field.session-placement'),
                    SESSION_PLACEMENT_OPTIONS
                )}

                {state.xhttpSessionPlacement &&
                    state.xhttpSessionPlacement !== 'path' &&
                    text('xhttpSessionKey', t('config-generator.field.session-key'), {
                        placeholder: 'x_session'
                    })}

                <Select
                    clearable
                    data={SESSION_ID_TABLES}
                    description={t('config-generator.hint.session-table')}
                    label={t('config-generator.field.session-table')}
                    onChange={(value) => setField('xhttpSessionTable', value ?? '')}
                    placeholder="Base62"
                    value={state.xhttpSessionTable || null}
                />

                {state.xhttpSessionTable &&
                    text('xhttpSessionLength', t('config-generator.field.session-length'), {
                        placeholder: '8-16',
                        description: t('config-generator.hint.session-length')
                    })}

                {defaultableSelect(
                    'xhttpSeqPlacement',
                    t('config-generator.field.seq-placement'),
                    SEQUENCE_PLACEMENT_OPTIONS
                )}

                {state.xhttpSeqPlacement &&
                    state.xhttpSeqPlacement !== 'path' &&
                    text('xhttpSeqKey', t('config-generator.field.seq-key'), {
                        placeholder: 'x_seq'
                    })}

                {isPacketUp && (
                    <>
                        {defaultableSelect(
                            'xhttpUplinkDataPlacement',
                            t('config-generator.field.uplink-data-placement'),
                            UPLINK_DATA_PLACEMENT_OPTIONS
                        )}

                        {state.xhttpUplinkDataPlacement &&
                            state.xhttpUplinkDataPlacement !== 'body' &&
                            text(
                                'xhttpUplinkDataKey',
                                t('config-generator.field.uplink-data-key'),
                                {
                                    placeholder: 'x_data'
                                }
                            )}
                    </>
                )}

                {toggle('xhttpNoSseHeader', t('config-generator.field.no-sse-header'))}

                {/* Как в 3x-ui: при включении XMUX подставляем дефолты ядра,
                    иначе поля остаются пустыми и xmux уходит пустым объектом. */}
                <Switch
                    checked={state.xhttpEnableXmux}
                    label="XMUX"
                    onChange={(event) => {
                        const checked = event.currentTarget.checked

                        setState((prev) => ({
                            ...prev,
                            xhttpEnableXmux: checked,
                            xhttpXmuxMaxConnections:
                                checked && !prev.xhttpXmuxMaxConnections
                                    ? '3'
                                    : prev.xhttpXmuxMaxConnections,
                            xhttpXmuxHMaxRequestTimes:
                                checked && !prev.xhttpXmuxHMaxRequestTimes
                                    ? '600-900'
                                    : prev.xhttpXmuxHMaxRequestTimes,
                            xhttpXmuxHMaxReusableSecs:
                                checked && !prev.xhttpXmuxHMaxReusableSecs
                                    ? '1800-3000'
                                    : prev.xhttpXmuxHMaxReusableSecs
                        }))
                    }}
                />

                {state.xhttpEnableXmux && (
                    <Stack gap="sm">
                        {grid(
                            <>
                                {text(
                                    'xhttpXmuxMaxConcurrency',
                                    t('config-generator.field.xmux-max-concurrency'),
                                    {
                                        placeholder: '16-32',
                                        description: t('config-generator.hint.range')
                                    }
                                )}
                                {text(
                                    'xhttpXmuxMaxConnections',
                                    t('config-generator.field.xmux-max-connections'),
                                    {
                                        placeholder: '0',
                                        description: t('config-generator.hint.range')
                                    }
                                )}
                                {text(
                                    'xhttpXmuxCMaxReuseTimes',
                                    t('config-generator.field.xmux-c-max-reuse-times'),
                                    { description: t('config-generator.hint.range') }
                                )}
                                {text(
                                    'xhttpXmuxHMaxRequestTimes',
                                    t('config-generator.field.xmux-h-max-request-times'),
                                    { placeholder: '600-900' }
                                )}
                                {text(
                                    'xhttpXmuxHMaxReusableSecs',
                                    t('config-generator.field.xmux-h-max-reusable-secs'),
                                    { placeholder: '1800-3000' }
                                )}
                                {number(
                                    'xhttpXmuxHKeepAlivePeriod',
                                    t('config-generator.field.xmux-h-keep-alive-period')
                                )}
                            </>
                        )}
                    </Stack>
                )}

                <Textarea
                    autosize
                    description={t('config-generator.hint.extra-json')}
                    label={t('config-generator.field.extra-json')}
                    minRows={3}
                    onChange={(event) => setField('xhttpExtraJson', event.currentTarget.value)}
                    placeholder='{ "xPaddingBytes": "100-1000" }'
                    value={state.xhttpExtraJson}
                />
            </Stack>
        )
    }

    const transportSettings = () => {
        switch (state.network) {
            case 'raw': {
                const rawHttp = state.rawHeaderType === 'http'

                return (
                    <Stack gap="sm">
                        <Select
                            data={RAW_HEADER_OPTIONS}
                            label={t('config-generator.field.header-type')}
                            onChange={(value) => setField('rawHeaderType', value ?? 'none')}
                            value={state.rawHeaderType}
                        />
                        {toggle(
                            'rawAcceptProxyProtocol',
                            t('config-generator.field.accept-proxy-protocol')
                        )}

                        {rawHttp &&
                            grid(
                                <>
                                    {text(
                                        'rawRequestVersion',
                                        t('config-generator.field.request-version'),
                                        { placeholder: '1.1' }
                                    )}
                                    {text(
                                        'rawRequestMethod',
                                        t('config-generator.field.request-method'),
                                        { placeholder: 'GET' }
                                    )}
                                    {text(
                                        'rawRequestPath',
                                        t('config-generator.field.request-path'),
                                        {
                                            description: t('config-generator.hint.comma-separated'),
                                            placeholder: '/'
                                        }
                                    )}
                                    {text(
                                        'rawResponseVersion',
                                        t('config-generator.field.response-version'),
                                        { placeholder: '1.1' }
                                    )}
                                    {text(
                                        'rawResponseStatus',
                                        t('config-generator.field.response-status'),
                                        { placeholder: '200' }
                                    )}
                                    {text(
                                        'rawResponseReason',
                                        t('config-generator.field.response-reason'),
                                        { placeholder: 'OK' }
                                    )}
                                </>
                            )}

                        {rawHttp && (
                            <>
                                {headerRowsEditor(
                                    'rawRequestHeaders',
                                    t('config-generator.field.request-headers')
                                )}
                                {headerRowsEditor(
                                    'rawResponseHeaders',
                                    t('config-generator.field.response-headers')
                                )}
                            </>
                        )}
                    </Stack>
                )
            }

            case 'ws': {
                return (
                    <Stack gap="sm">
                        {text('wsPath', t('config-generator.field.path'))}
                        {text('wsHost', t('config-generator.field.host'))}
                        {number('wsHeartbeatPeriod', t('config-generator.field.heartbeat-period'))}
                        {toggle(
                            'wsAcceptProxyProtocol',
                            t('config-generator.field.accept-proxy-protocol')
                        )}
                        {headerRowsEditor('wsHeaders', t('config-generator.field.headers'))}
                    </Stack>
                )
            }

            case 'kcp': {
                return (
                    <Stack gap="sm">
                        {grid(
                            <>
                                {number('kcpMtu', t('config-generator.field.mtu'), 576)}
                                {number('kcpTti', t('config-generator.field.tti'), 10)}
                                {number(
                                    'kcpUplinkCapacity',
                                    t('config-generator.field.uplink-capacity')
                                )}
                                {number(
                                    'kcpDownlinkCapacity',
                                    t('config-generator.field.downlink-capacity')
                                )}
                                {number(
                                    'kcpCwndMultiplier',
                                    t('config-generator.field.cwnd-multiplier'),
                                    1
                                )}
                                {number(
                                    'kcpMaxSendingWindow',
                                    t('config-generator.field.max-sending-window')
                                )}
                            </>
                        )}
                    </Stack>
                )
            }

            case 'grpc': {
                return (
                    <Stack gap="sm">
                        {text('grpcServiceName', t('config-generator.field.service-name'))}
                        {text('grpcAuthority', t('config-generator.field.authority'))}
                        {toggle('grpcMultiMode', t('config-generator.field.multi-mode'))}
                    </Stack>
                )
            }

            case 'httpupgrade': {
                return (
                    <Stack gap="sm">
                        {text('httpupgradePath', t('config-generator.field.path'))}
                        {text('httpupgradeHost', t('config-generator.field.host'))}
                        {toggle(
                            'httpupgradeAcceptProxyProtocol',
                            t('config-generator.field.accept-proxy-protocol')
                        )}
                        {headerRowsEditor(
                            'httpupgradeHeaders',
                            t('config-generator.field.headers')
                        )}
                    </Stack>
                )
            }

            case 'xhttp': {
                return xhttpSettings()
            }

            case 'xdrive': {
                // Набор полей — как в 3x-ui: у Google Drive три обязательных
                // секрета, у custom template — произвольный список секретов,
                // у local секретов нет вообще.
                const isTemplateService = state.xdriveService === 'template'

                return (
                    <Stack gap="sm">
                        <Select
                            data={XDRIVE_SERVICES}
                            description={t('config-generator.hint.xdrive-service')}
                            label={t('config-generator.field.xdrive-service')}
                            onChange={(value) => setField('xdriveService', value ?? 'google-drive')}
                            value={state.xdriveService}
                        />

                        <TextInput
                            label={t('config-generator.field.remote-folder')}
                            onChange={(event) =>
                                setField('xdriveRemoteFolder', event.currentTarget.value)
                            }
                            placeholder={
                                state.xdriveService === 'local' ? '/var/lib/xdrive' : 'xray-tunnel'
                            }
                            value={state.xdriveRemoteFolder}
                            withAsterisk
                        />

                        {state.xdriveService === 'google-drive' && (
                            <Stack gap="sm">
                                {text('xdriveClientId', t('config-generator.field.client-id'), {
                                    description: t('config-generator.hint.xdrive-secrets'),
                                    withAsterisk: true
                                })}
                                <TextInput
                                    description={t('config-generator.hint.xdrive-secrets')}
                                    label={t('config-generator.field.client-secret')}
                                    onChange={(event) =>
                                        setField('xdriveClientSecret', event.currentTarget.value)
                                    }
                                    type="password"
                                    value={state.xdriveClientSecret}
                                    withAsterisk
                                />
                                <TextInput
                                    label={t('config-generator.field.refresh-token')}
                                    onChange={(event) =>
                                        setField('xdriveRefreshToken', event.currentTarget.value)
                                    }
                                    type="password"
                                    value={state.xdriveRefreshToken}
                                    withAsterisk
                                />
                            </Stack>
                        )}

                        {isTemplateService && (
                            <TagsInput
                                clearable
                                description={t('config-generator.hint.tags-enter')}
                                label={t('config-generator.field.secrets')}
                                onChange={(value) => setField('xdriveSecrets', value.join('\n'))}
                                placeholder={t('config-generator.hint.tags-enter')}
                                value={state.xdriveSecrets.split('\n').filter(Boolean)}
                            />
                        )}

                        {isTemplateService && (
                            <Textarea
                                autosize
                                description={t('config-generator.hint.xdrive-template')}
                                label={t('config-generator.field.xdrive-template')}
                                minRows={3}
                                onChange={(event) =>
                                    setField('xdriveTemplate', event.currentTarget.value)
                                }
                                placeholder='{ "service": "google-drive" }'
                                value={state.xdriveTemplate}
                                withAsterisk
                            />
                        )}

                        {state.xdriveService !== 'local' &&
                            grid(
                                <>
                                    {text(
                                        'xdriveAddress',
                                        t('config-generator.field.xdrive-front'),
                                        {
                                            placeholder: 'www.googleapis.com'
                                        }
                                    )}
                                    {number(
                                        'xdrivePort',
                                        t('config-generator.field.xdrive-front-port'),
                                        1,
                                        '443'
                                    )}
                                </>
                            )}

                        {grid(
                            <>
                                {number(
                                    'xdriveSegmentBytes',
                                    t('config-generator.field.segment-bytes'),
                                    0,
                                    '524288'
                                )}
                                {number(
                                    'xdriveFlushIntervalMs',
                                    t('config-generator.field.flush-interval-ms'),
                                    0,
                                    '20'
                                )}
                                {number(
                                    'xdrivePollIntervalMs',
                                    t('config-generator.field.poll-interval-ms'),
                                    0,
                                    '50'
                                )}
                                {number(
                                    'xdriveMaxPollIntervalMs',
                                    t('config-generator.field.max-poll-interval-ms'),
                                    0,
                                    '500'
                                )}
                                {number(
                                    'xdriveSessionTtlSeconds',
                                    t('config-generator.field.session-ttl-seconds'),
                                    0,
                                    '300'
                                )}
                                {number(
                                    'xdriveConcurrency',
                                    t('config-generator.field.concurrency'),
                                    0,
                                    '8'
                                )}
                                {number(
                                    'xdriveEagerWindowMs',
                                    t('config-generator.field.eager-window-ms'),
                                    0,
                                    '2000'
                                )}
                                {number(
                                    'xdriveHoleTimeoutMs',
                                    t('config-generator.field.hole-timeout-ms'),
                                    0,
                                    '30000'
                                )}
                            </>
                        )}

                        <Textarea
                            autosize
                            description={t('config-generator.hint.extra-json')}
                            label={t('config-generator.field.extra-json')}
                            minRows={3}
                            onChange={(event) =>
                                setField('xdriveExtraJson', event.currentTarget.value)
                            }
                            placeholder='{ "xmux": { "maxConcurrency": "8-16" } }'
                            value={state.xdriveExtraJson}
                        />
                    </Stack>
                )
            }

            default: {
                return null
            }
        }
    }

    const transportAdvanced = () => {
        // Набор надстроек повторяет 3x-ui: sockopt есть у любого транспорта,
        // TCP-маски только у TCP-транспортов, UDP-маски на сервере только у mKCP,
        // QUIC-параметры только у XHTTP (и у hysteria, но там своя вкладка).
        const showTcpMask = supportsTcpMasks(state)
        const showUdpMask = supportsUdpMasks(state)
        const showQuic = supportsQuicParams(state)

        return (
            <Accordion chevronPosition="left" multiple variant="separated">
                <Accordion.Item value="sockopt">
                    <Accordion.Control>Sockopt</Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="sm">
                            {grid(
                                <>
                                    {number(
                                        'sockoptTcpKeepAliveInterval',
                                        t('config-generator.field.tcp-keep-alive-interval')
                                    )}
                                    {number(
                                        'sockoptTcpKeepAliveIdle',
                                        t('config-generator.field.tcp-keep-alive-idle')
                                    )}
                                    {text(
                                        'sockoptTcpCongestion',
                                        t('config-generator.field.tcp-congestion'),
                                        { placeholder: 'bbr' }
                                    )}
                                    {text(
                                        'sockoptDomainStrategy',
                                        t('config-generator.field.domain-strategy'),
                                        {
                                            placeholder:
                                                'AsIs / UseIP / UseIPv4 / UseIPv6 / ForceIP'
                                        }
                                    )}
                                    {number(
                                        'sockoptTcpWindowClamp',
                                        t('config-generator.field.tcp-window-clamp')
                                    )}
                                    {number(
                                        'sockoptTcpMaxSeg',
                                        t('config-generator.field.tcp-max-seg')
                                    )}
                                    {number(
                                        'sockoptTcpUserTimeout',
                                        t('config-generator.field.tcp-user-timeout')
                                    )}
                                    {number('sockoptMark', t('config-generator.field.mark'))}
                                    {text(
                                        'sockoptInterface',
                                        t('config-generator.field.interface-name'),
                                        { placeholder: 'eth0' }
                                    )}
                                </>
                            )}
                            {toggle(
                                'sockoptAcceptProxyProtocol',
                                t('config-generator.field.accept-proxy-protocol')
                            )}
                            {toggle(
                                'sockoptTcpFastOpen',
                                t('config-generator.field.tcp-fast-open')
                            )}
                            {toggle('sockoptTcpMptcp', t('config-generator.field.tcp-mptcp'))}
                            {toggle('sockoptV6only', t('config-generator.field.v6only'))}
                            {toggle('sockoptPenetrate', t('config-generator.field.penetrate'))}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>

                {showTcpMask && (
                    <Accordion.Item value="tcp-mask">
                        <Accordion.Control>
                            {t('config-generator.section.tcp-mask')}
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="sm">
                                <Select
                                    data={TCP_MASK_OPTIONS}
                                    label={t('config-generator.field.mask-type')}
                                    onChange={(value) =>
                                        setField(
                                            'finalmaskTcpType',
                                            (value ??
                                                'none') as IInboundFormState['finalmaskTcpType']
                                        )
                                    }
                                    value={state.finalmaskTcpType}
                                />

                                {state.finalmaskTcpType === 'fragment' &&
                                    grid(
                                        <>
                                            {text(
                                                'finalmaskFragmentPackets',
                                                t('config-generator.field.mask-packets'),
                                                { placeholder: 'tlshello' }
                                            )}
                                            {text(
                                                'finalmaskFragmentLength',
                                                t('config-generator.field.mask-length'),
                                                {
                                                    placeholder: '3-5',
                                                    description: t('config-generator.hint.range')
                                                }
                                            )}
                                            {text(
                                                'finalmaskFragmentDelay',
                                                t('config-generator.field.mask-delay'),
                                                {
                                                    placeholder: '10-20',
                                                    description: t('config-generator.hint.range')
                                                }
                                            )}
                                            {text(
                                                'finalmaskFragmentMaxSplit',
                                                t('config-generator.field.mask-max-split'),
                                                {
                                                    placeholder: '3-6',
                                                    description: t('config-generator.hint.range')
                                                }
                                            )}
                                        </>
                                    )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                )}

                {showUdpMask && (
                    <Accordion.Item value="udp-mask">
                        <Accordion.Control>
                            {t('config-generator.section.udp-mask')}
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="sm">
                                <Select
                                    data={UDP_MASK_OPTIONS}
                                    label={t('config-generator.field.mask-type')}
                                    onChange={(value) =>
                                        setField(
                                            'finalmaskUdpType',
                                            (value ??
                                                'none') as IInboundFormState['finalmaskUdpType']
                                        )
                                    }
                                    value={state.finalmaskUdpType}
                                />

                                {state.finalmaskUdpType === 'mkcp-legacy' &&
                                    grid(
                                        <>
                                            {text(
                                                'finalmaskUdpHeader',
                                                t('config-generator.field.mask-udp-header'),
                                                { placeholder: 'srtp / utp / dtls / wechat-video' }
                                            )}
                                            {text(
                                                'finalmaskUdpValue',
                                                t('config-generator.field.mask-udp-value')
                                            )}
                                        </>
                                    )}

                                {state.finalmaskUdpType === 'salamander' &&
                                    text(
                                        'finalmaskUdpPassword',
                                        t('config-generator.field.mask-udp-password')
                                    )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                )}

                {showQuic && (
                    <Accordion.Item value="quic">
                        <Accordion.Control>
                            {t('config-generator.section.quic-params')}
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="sm">
                                {toggle(
                                    'finalmaskQuicEnabled',
                                    t('config-generator.field.enabled')
                                )}

                                {state.finalmaskQuicEnabled && (
                                    <>
                                        {grid(
                                            <>
                                                {text(
                                                    'finalmaskQuicCongestion',
                                                    t('config-generator.field.quic-congestion'),
                                                    { placeholder: 'force-brutal' }
                                                )}
                                                {text(
                                                    'finalmaskQuicBrutalUp',
                                                    t('config-generator.field.quic-brutal-up'),
                                                    { placeholder: '60 mbps' }
                                                )}
                                                {text(
                                                    'finalmaskQuicBrutalDown',
                                                    t('config-generator.field.quic-brutal-down'),
                                                    { placeholder: '60 mbps' }
                                                )}
                                                {number(
                                                    'finalmaskQuicInitStreamReceiveWindow',
                                                    t(
                                                        'config-generator.field.quic-init-stream-window'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicMaxStreamReceiveWindow',
                                                    t(
                                                        'config-generator.field.quic-max-stream-window'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicInitConnectionReceiveWindow',
                                                    t(
                                                        'config-generator.field.quic-init-connection-window'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicMaxConnectionReceiveWindow',
                                                    t(
                                                        'config-generator.field.quic-max-connection-window'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicMaxIdleTimeout',
                                                    t(
                                                        'config-generator.field.quic-max-idle-timeout'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicKeepAlivePeriod',
                                                    t(
                                                        'config-generator.field.quic-keep-alive-period'
                                                    )
                                                )}
                                                {number(
                                                    'finalmaskQuicMaxIncomingStreams',
                                                    t(
                                                        'config-generator.field.quic-max-incoming-streams'
                                                    )
                                                )}
                                            </>
                                        )}
                                        {toggle(
                                            'finalmaskQuicDisablePathMtuDiscovery',
                                            t(
                                                'config-generator.field.quic-disable-path-mtu-discovery'
                                            )
                                        )}
                                    </>
                                )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                )}
            </Accordion>
        )
    }

    const securitySettings = () => {
        if (state.security === 'none') {
            return (
                <Text c="dimmed" size="sm">
                    {t('config-generator.security-none-hint')}
                </Text>
            )
        }

        if (state.security === 'tls') {
            return (
                <Stack gap="sm">
                    {text('tlsServerName', t('config-generator.field.server-name'))}
                    {text('tlsAlpn', 'ALPN', { description: t('config-generator.hint.alpn') })}
                    <Flex gap="sm">
                        <Select
                            data={TLS_VERSION_OPTIONS}
                            label={t('config-generator.field.min-version')}
                            onChange={(value) => setField('tlsMinVersion', value ?? 'none')}
                            value={state.tlsMinVersion}
                        />
                        <Select
                            data={TLS_VERSION_OPTIONS}
                            label={t('config-generator.field.max-version')}
                            onChange={(value) => setField('tlsMaxVersion', value ?? 'none')}
                            value={state.tlsMaxVersion}
                        />
                    </Flex>
                    {text('tlsCipherSuites', t('config-generator.field.cipher-suites'))}
                    {text('tlsCertificateFile', t('config-generator.field.certificate-file'), {
                        placeholder: '/etc/ssl/example.com/fullchain.pem'
                    })}
                    {text('tlsKeyFile', t('config-generator.field.key-file'), {
                        placeholder: '/etc/ssl/example.com/privkey.pem'
                    })}
                    {toggle('tlsRejectUnknownSni', t('config-generator.field.reject-unknown-sni'))}
                    {toggle(
                        'tlsEnableSessionResumption',
                        t('config-generator.field.session-resumption')
                    )}
                </Stack>
            )
        }

        return (
            <Stack gap="sm">
                {text('realityTarget', t('config-generator.field.dest'), {
                    placeholder: 'www.example.com:443'
                })}
                {text('realityServerNames', t('config-generator.field.server-names'), {
                    description: t('config-generator.hint.comma-separated')
                })}
                <Flex align="flex-end" gap="xs">
                    {text('realityPrivateKey', t('config-generator.field.private-key'), {
                        flex: 1
                    })}
                    <Button
                        onClick={() => {
                            const keyPair = generateX25519()
                            setState((prev) => ({
                                ...prev,
                                realityPrivateKey: keyPair.privateKey,
                                security: 'reality'
                            }))
                        }}
                        variant="default"
                    >
                        {t('config-generator.action.generate')}
                    </Button>
                </Flex>
                <Flex align="flex-end" gap="xs">
                    {text('realityShortIds', t('config-generator.field.short-ids'), {
                        description: t('config-generator.hint.comma-separated'),
                        flex: 1
                    })}
                    <Button
                        onClick={() =>
                            setField('realityShortIds', generateShortIds(1, 4).join(', '))
                        }
                        variant="default"
                    >
                        {t('config-generator.action.generate')}
                    </Button>
                </Flex>
                {number('realityXver', t('config-generator.field.xver'))}
                {text('realityMldsa65Seed', t('config-generator.field.mldsa65-seed'))}
                {text('realityFingerprint', t('config-generator.field.fingerprint'))}
                {text('realitySpiderX', t('config-generator.field.spider-x'))}
                <Divider label={t('config-generator.limit-fallback')} labelPosition="left" />
                {number(
                    'realityFallbackAfterBytes',
                    t('config-generator.field.fallback-after-bytes')
                )}
                {number(
                    'realityFallbackBytesPerSec',
                    t('config-generator.field.fallback-bytes-per-sec')
                )}
                {number(
                    'realityFallbackBurstBytesPerSec',
                    t('config-generator.field.fallback-burst-bytes-per-sec')
                )}
            </Stack>
        )
    }

    const isHysteria = state.protocol === 'hysteria'
    const isXdrive = state.network === 'xdrive'
    // XDRIVE не терпит security на инбаунде: ядро читает этот TLS как
    // клиентский TLS хранилища.
    const securityOptions = allowedSecurityFor(state.protocol, state.network)

    return (
        <Stack gap="md">
            <Tabs defaultValue="basics" keepMounted keepMountedMode="display-none">
                <Tabs.List grow mb="md">
                    <Tabs.Tab leftSection={<TbTag size={16} />} value="basics">
                        {t('config-generator.tab.basics')}
                    </Tabs.Tab>
                    <Tabs.Tab leftSection={<TbSettings size={16} />} value="protocol">
                        {t('config-generator.tab.protocol')}
                    </Tabs.Tab>
                    <Tabs.Tab
                        disabled={isHysteria}
                        leftSection={<TbNetwork size={16} />}
                        value="transport"
                    >
                        {t('config-generator.tab.transport')}
                    </Tabs.Tab>
                    <Tabs.Tab leftSection={<TbShieldLock size={16} />} value="security">
                        {t('config-generator.tab.security')}
                    </Tabs.Tab>
                    <Tabs.Tab leftSection={<TbWand size={16} />} value="sniffing">
                        {t('config-generator.tab.sniffing')}
                    </Tabs.Tab>
                    <Tabs.Tab leftSection={<TbBraces size={16} />} value="preview">
                        {t('config-generator.tab.preview')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="basics">
                    <Stack gap="sm">
                        <Select
                            data={PROTOCOLS}
                            label={t('config-generator.field.protocol')}
                            onChange={(value) => {
                                if (!value) return
                                setState((prev) => {
                                    const nextProtocol = value as IInboundFormState['protocol']
                                    const tagIsDefault = prev.tag === `${prev.protocol}-inbound`

                                    const nextNetwork =
                                        prev.network === 'xdrive' && nextProtocol !== 'vless'
                                            ? 'raw'
                                            : prev.network
                                    const nextAllowed = allowedSecurityFor(
                                        nextProtocol,
                                        nextNetwork
                                    )

                                    return {
                                        ...prev,
                                        protocol: nextProtocol,
                                        network: nextNetwork,
                                        security: nextAllowed.includes(prev.security)
                                            ? prev.security
                                            : 'none',
                                        // shadowsocks без пароля ядро не соберёт,
                                        // поэтому подставляем сгенерированный.
                                        shadowsocksPassword:
                                            nextProtocol === 'shadowsocks' &&
                                            !prev.shadowsocksPassword
                                                ? generateShadowsocksPassword(
                                                      prev.shadowsocksMethod
                                                  )
                                                : prev.shadowsocksPassword,
                                        tag: tagIsDefault ? `${nextProtocol}-inbound` : prev.tag
                                    }
                                })
                            }}
                            value={state.protocol}
                        />
                        {text('tag', t('config-generator.field.tag'))}
                        <NumberInput
                            label={t('config-generator.field.port')}
                            max={65535}
                            min={1}
                            onChange={(value) =>
                                setField('port', typeof value === 'number' ? value : 443)
                            }
                            value={state.port}
                        />
                        {text('listen', t('config-generator.field.listen'), {
                            description: t('config-generator.hint.listen')
                        })}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="protocol">
                    <Stack gap="sm">
                        {protocolSettings()}
                        <Text c="dimmed" size="xs">
                            {t('config-generator.hint.no-clients')}
                        </Text>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="transport">
                    <Stack gap="sm">
                        <Select
                            data={allowedNetworksFor(state.protocol)}
                            label={t('config-generator.field.network')}
                            onChange={(value) => {
                                if (!value) return
                                const network = value as IInboundFormState['network']

                                setState((prev) => {
                                    if (network !== 'xdrive') {
                                        // Смена транспорта может отнять TLS/REALITY:
                                        // сбрасываем защиту, если она стала недоступна.
                                        const allowed = allowedSecurityFor(prev.protocol, network)

                                        return {
                                            ...prev,
                                            network,
                                            security: allowed.includes(prev.security)
                                                ? prev.security
                                                : 'none'
                                        }
                                    }

                                    // XDRIVE ядро собирает только с включённым
                                    // VLESS Encryption и без security на инбаунде.
                                    const keys = prev.vlessServerKey ? null : newVlessKeys()

                                    return {
                                        ...prev,
                                        network,
                                        security: 'none',
                                        vlessEncryptionEnabled: true,
                                        ...(keys
                                            ? {
                                                  vlessClientKey: keys.clientKey,
                                                  vlessServerKey: keys.serverKey
                                              }
                                            : {})
                                    }
                                })
                            }}
                            value={state.network}
                        />
                        {transportSettings()}
                        {state.network === 'xdrive' && (
                            <Text c="dimmed" size="xs">
                                {t('config-generator.hint.xdrive-encryption')}
                            </Text>
                        )}
                        {transportAdvanced()}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="security">
                    <Stack gap="sm">
                        <Select
                            data={securityOptions}
                            disabled={isXdrive}
                            label={t('config-generator.field.security')}
                            onChange={(value) => {
                                if (value)
                                    setField('security', value as IInboundFormState['security'])
                            }}
                            value={isXdrive ? 'none' : state.security}
                        />
                        {isXdrive && (
                            <Text c="dimmed" size="xs">
                                {t('config-generator.hint.xdrive-encryption')}
                            </Text>
                        )}
                        {securitySettings()}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="sniffing">
                    <Stack gap="sm">
                        {toggle('sniffingEnabled', t('config-generator.field.enabled'))}
                        <MultiSelect
                            data={DEST_OVERRIDE_OPTIONS}
                            disabled={!state.sniffingEnabled}
                            label={t('config-generator.field.dest-override')}
                            onChange={(value) => setField('sniffingDestOverride', value)}
                            value={state.sniffingDestOverride}
                        />
                        {toggle('sniffingMetadataOnly', t('config-generator.field.metadata-only'))}
                        {toggle('sniffingRouteOnly', t('config-generator.field.route-only'))}
                        <Textarea
                            autosize
                            description={t('config-generator.hint.comma-separated')}
                            label={t('config-generator.field.domains-excluded')}
                            minRows={2}
                            onChange={(event) =>
                                setField('sniffingDomainsExcluded', event.currentTarget.value)
                            }
                            placeholder="domain:example.com, regexp:.*\\.ru$"
                            value={state.sniffingDomainsExcluded}
                        />
                        <Textarea
                            autosize
                            description={t('config-generator.hint.comma-separated')}
                            label={t('config-generator.field.ips-excluded')}
                            minRows={2}
                            onChange={(event) =>
                                setField('sniffingIpsExcluded', event.currentTarget.value)
                            }
                            placeholder="10.0.0.0/8, geoip:ru"
                            value={state.sniffingIpsExcluded}
                        />
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="preview">
                    <Stack gap="xs">
                        <Text c="dimmed" size="sm">
                            {t('config-generator.preview-hint')}
                        </Text>
                        <CodeHighlight
                            background="rgba(22, 27, 35)"
                            code={inboundJson}
                            language="json"
                            radius="md"
                            style={{
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 'var(--mantine-radius-md)',
                                maxHeight: 320,
                                overflow: 'auto'
                            }}
                        />
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            <Divider />

            <Group justify="space-between">
                <Text c="dimmed" size="xs">
                    {t('config-generator.footer-hint')}
                </Text>

                <Group gap="xs">
                    <Button onClick={onClose} variant="subtle">
                        {t('common.action.cancel')}
                    </Button>
                    <Button
                        leftSection={<TbBraces size={16} />}
                        onClick={handleApply}
                        variant="soft"
                    >
                        {t('config-generator.action.apply')}
                    </Button>
                </Group>
            </Group>
        </Stack>
    )
}
