import { Badge, Button, Card, Checkbox, Group, Stack, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { GetLogsStatsCommand } from '@xpanel/backend-contract'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbDatabase, TbTrash } from 'react-icons/tb'

import { useCleanLogs, useClearNodeLogs, useGetLogsStats, useGetNodes } from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'

type TLogSource = GetLogsStatsCommand.Response['response']['sources'][number]['source']

interface Props {
    stats: GetLogsStatsCommand.Response['response']
}

export const LogsPageComponent = (props: Props) => {
    const { stats } = props
    const { t } = useTranslation()
    const [selected, setSelected] = useState<TLogSource[]>([])

    // Названия и пояснения источников. Строки берутся из локалей: для fa и zh
    // отсутствующие ключи подставляет английский через fallback i18next.
    const sourceLabels: Record<TLogSource, string> = {
        usageHistory: t('logs-page.source-usage-history'),
        nodesUsageHistory: t('logs-page.source-nodes-usage-history'),
        hwidDevices: t('logs-page.source-hwid-devices'),
        subscriptionRequestHistory: t('logs-page.source-subscription-request-history'),
        torrentBlockerReports: t('logs-page.source-torrent-blocker-reports'),
        adminAuditLog: t('logs-page.source-admin-audit-log')
    }

    const sourceHints: Record<TLogSource, string> = {
        usageHistory: t('logs-page.hint-usage-history'),
        nodesUsageHistory: t('logs-page.hint-nodes-usage-history'),
        hwidDevices: t('logs-page.hint-hwid-devices'),
        subscriptionRequestHistory: t('logs-page.hint-subscription-request-history'),
        torrentBlockerReports: t('logs-page.hint-torrent-blocker-reports'),
        adminAuditLog: t('logs-page.hint-admin-audit-log')
    }

    const { mutate: cleanLogs, isPending } = useCleanLogs({
        mutationFns: {
            onSuccess: () => {
                setSelected([])
            }
        }
    })

    const { refetch, isFetching } = useGetLogsStats()

    const { data: nodesData } = useGetNodes()
    const { mutate: clearNodeLogs, isPending: isClearingNode } = useClearNodeLogs()

    const openNodeConfirm = (uuid: string, name: string) => {
        modals.openConfirmModal({
            title: t('logs-page.nodes-confirm-title'),
            centered: true,
            children: (
                <Stack gap="xs">
                    <Text size="sm">{t('logs-page.nodes-confirm-body')}</Text>
                    <Text fw={600} size="sm">
                        {name}
                    </Text>
                </Stack>
            ),
            labels: { confirm: t('logs-page.nodes-confirm-clear'), cancel: t('logs-page.confirm-cancel') },
            confirmProps: { color: 'red', variant: 'soft' },
            cancelProps: { variant: 'subtle' },
            onConfirm: () => clearNodeLogs({ route: { uuid } })
        })
    }

    const retention = stats.retention

    const handleConfirm = () => {
        cleanLogs({
            variables: {
                confirm: true,
                sources: selected
            }
        })
    }

    const openConfirm = () => {
        const total = stats.sources
            .filter((source) => selected.includes(source.source))
            .reduce((sum, source) => sum + source.rows, 0)

        modals.openConfirmModal({
            title: t('logs-page.confirm-title'),
            centered: true,
            children: (
                <Stack gap="xs">
                    <Text size="sm">{t('logs-page.confirm-body')}</Text>
                    <Text fw={600} size="sm">
                        {t('logs-page.confirm-count', { count: total })}
                    </Text>
                    <Text size="xs">
                        {selected.map((source) => sourceLabels[source]).join(', ')}
                    </Text>
                </Stack>
            ),
            labels: { confirm: t('logs-page.confirm-delete'), cancel: t('logs-page.confirm-cancel') },
            confirmProps: { color: 'red', variant: 'soft' },
            cancelProps: { variant: 'subtle' },
            onConfirm: handleConfirm
        })
    }

    return (
        <Page title={t('logs-page.title')}>
            <PageHeaderShared
                actions={
                    <Group gap="xs">
                        <Button
                            loading={isFetching}
                            onClick={() => refetch()}
                            variant="light"
                        >
                            {t('logs-page.refresh')}
                        </Button>
                        <Button
                            color="red"
                            disabled={selected.length === 0}
                            leftSection={<TbTrash size={18} />}
                            loading={isPending}
                            onClick={openConfirm}
                            variant="light"
                        >
                            {t('logs-page.delete-selected')}
                        </Button>
                    </Group>
                }
                icon={<TbDatabase size={24} />}
                title={t('logs-page.title')}
            />

            <Stack gap="md">
                <Card padding="md" radius="md" withBorder>
                    <Stack gap={4}>
                        <Text fw={600} size="sm">
                            {t('logs-page.retention-title')}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {retention.usageHistory.enabled
                                ? t('logs-page.retention-traffic-enabled', {
                                      days: retention.usageHistory.days
                                  })
                                : t('logs-page.retention-traffic-disabled')}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {retention.oldLogs.enabled
                                ? t('logs-page.retention-personal-enabled')
                                : t('logs-page.retention-personal-disabled')}{' '}
                            {t('logs-page.retention-personal-details', {
                                nodesDays: retention.nodesUsageHistoryDays,
                                hwidDays: retention.hwidDevicesDays,
                                srhDays: retention.subscriptionRequestHistoryDays
                            })}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {t('logs-page.retention-audit-days', { days: retention.auditLogDays })}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {t('logs-page.retention-hint')}
                        </Text>
                    </Stack>
                </Card>

                <Table.ScrollContainer minWidth={720}>
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={40} />
                                <Table.Th>{t('logs-page.table-source')}</Table.Th>
                                <Table.Th>{t('logs-page.table-records')}</Table.Th>
                                <Table.Th>{t('logs-page.table-oldest')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {stats.sources.map((source) => (
                                <Table.Tr key={source.source}>
                                    <Table.Td>
                                        <Checkbox
                                            checked={selected.includes(source.source)}
                                            onChange={(event) => {
                                                // Значение читается СРАЗУ: React очищает
                                                // currentTarget после обработчика, а
                                                // обновитель состояния выполняется
                                                // отложенно и увидел бы null.
                                                const isChecked = event.currentTarget.checked

                                                setSelected((current) =>
                                                    isChecked
                                                        ? [...current, source.source]
                                                        : current.filter(
                                                              (item) => item !== source.source
                                                          )
                                                )
                                            }}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Text fw={500} size="sm">
                                                {sourceLabels[source.source]}
                                            </Text>
                                            <Text c="dimmed" size="xs">
                                                {sourceHints[source.source]}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{source.rows}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">
                                            {source.oldest
                                                ? new Date(source.oldest).toLocaleString()
                                                : '—'}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>

                <Card padding="md" radius="md" withBorder>
                    <Stack gap="sm">
                        <Text fw={600} size="sm">
                            {t('logs-page.nodes-title')}
                        </Text>
                        <Text c="dimmed" size="xs">
                            {t('logs-page.nodes-description')}
                        </Text>

                        <Table verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('logs-page.nodes-column')}</Table.Th>
                                    <Table.Th w={180} />
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(nodesData ?? []).map((node) => (
                                    <Table.Tr key={node.uuid}>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                <Text fw={500} size="sm">
                                                    {node.name}
                                                </Text>
                                                <Text c="dimmed" size="xs">
                                                    {node.address}:{node.port}
                                                </Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Button
                                                fullWidth
                                                leftSection={<TbTrash size={18} />}
                                                loading={isClearingNode}
                                                onClick={() =>
                                                    openNodeConfirm(node.uuid, node.name)
                                                }
                                                variant="light"
                                            >
                                                {t('logs-page.nodes-clear')}
                                            </Button>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Stack>
                </Card>
            </Stack>
        </Page>
    )
}
