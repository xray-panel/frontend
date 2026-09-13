import { Badge, Card, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbHistory } from 'react-icons/tb'

import { useGetAuditLog } from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'

const PAGE_SIZE = 25

export const AuditLogPageComponent = () => {
    const { t } = useTranslation()
    const [page, setPage] = useState(1)
    const [adminUsername, setAdminUsername] = useState('')
    const [status, setStatus] = useState<null | string>(null)

    const { data, isLoading } = useGetAuditLog({
        query: {
            page,
            size: PAGE_SIZE,
            ...(adminUsername ? { adminUsername } : {}),
            ...(status ? { status: status as 'failure' | 'success' } : {})
        }
    })

    const total = data?.total ?? 0
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return (
        <Page title={t('audit-log-page.title')}>
            <PageHeaderShared icon={<TbHistory size={24} />} title={t('audit-log-page.title')} />

            <Stack gap="md">
                <Card padding="md" radius="md" withBorder>
                    <Group gap="sm" wrap="wrap">
                        <TextInput
                            label={t('audit-log-page.filter-administrator')}
                            onChange={(event) => {
                                setAdminUsername(event.currentTarget.value)
                                setPage(1)
                            }}
                            placeholder="superadmin"
                            value={adminUsername}
                            w={220}
                        />
                        <Select
                            clearable
                            data={[
                                { label: t('audit-log-page.status-success'), value: 'success' },
                                { label: t('audit-log-page.status-failure'), value: 'failure' }
                            ]}
                            label={t('audit-log-page.filter-result')}
                            onChange={(value) => {
                                setStatus(value)
                                setPage(1)
                            }}
                            placeholder={t('audit-log-page.filter-any')}
                            value={status}
                            w={180}
                        />
                        <Text c="dimmed" mt={24} size="sm">
                            {t('audit-log-page.records', { count: total })}
                        </Text>
                        {pages > 1 && (
                            <Group gap="xs" mt={24}>
                                <Text
                                    c={page > 1 ? 'cyan' : 'dimmed'}
                                    onClick={() => page > 1 && setPage(page - 1)}
                                    size="sm"
                                    style={{ cursor: page > 1 ? 'pointer' : 'default' }}
                                >
                                    {t('audit-log-page.pagination-prev')}
                                </Text>
                                <Text size="sm">
                                    {page} / {pages}
                                </Text>
                                <Text
                                    c={page < pages ? 'cyan' : 'dimmed'}
                                    onClick={() => page < pages && setPage(page + 1)}
                                    size="sm"
                                    style={{ cursor: page < pages ? 'pointer' : 'default' }}
                                >
                                    {t('audit-log-page.pagination-next')}
                                </Text>
                            </Group>
                        )}
                    </Group>
                </Card>

                <Table.ScrollContainer minWidth={900}>
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('audit-log-page.table-time')}</Table.Th>
                                <Table.Th>{t('audit-log-page.table-administrator')}</Table.Th>
                                <Table.Th>{t('audit-log-page.table-action')}</Table.Th>
                                <Table.Th>{t('audit-log-page.table-resource')}</Table.Th>
                                <Table.Th>{t('audit-log-page.table-result')}</Table.Th>
                                <Table.Th>{t('audit-log-page.table-ip')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {isLoading && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text c="dimmed" size="sm">
                                            {t('audit-log-page.loading')}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {!isLoading && (data?.entries.length ?? 0) === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text c="dimmed" size="sm">
                                            {t('audit-log-page.empty')}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {data?.entries.map((entry) => (
                                <Table.Tr key={entry.id}>
                                    <Table.Td>
                                        <Text size="sm">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={500} size="sm">
                                            {entry.adminUsername}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{entry.action}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text ff="monospace" size="xs">
                                            {entry.resource}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={entry.status === 'success' ? 'teal' : 'red'}
                                            variant="light"
                                        >
                                            {entry.statusCode}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text c="dimmed" size="xs">
                                            {entry.requestIp ?? '—'}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Stack>
        </Page>
    )
}
