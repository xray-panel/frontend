import { Badge, Card, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { useState } from 'react'
import { TbHistory } from 'react-icons/tb'

import { useGetAuditLog } from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'

const PAGE_SIZE = 25

export const AuditLogPageComponent = () => {
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
        <Page title="Audit Log">
            <PageHeaderShared icon={<TbHistory size={24} />} title="Audit Log" />

            <Stack gap="md">
                <Card padding="md" radius="md" withBorder>
                    <Group gap="sm" wrap="wrap">
                        <TextInput
                            label="Administrator"
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
                                { label: 'Success', value: 'success' },
                                { label: 'Failure', value: 'failure' }
                            ]}
                            label="Result"
                            onChange={(value) => {
                                setStatus(value)
                                setPage(1)
                            }}
                            placeholder="any"
                            value={status}
                            w={180}
                        />
                        <Text c="dimmed" mt={24} size="sm">
                            {total} records
                        </Text>
                        {pages > 1 && (
                            <Group gap="xs" mt={24}>
                                <Text
                                    c={page > 1 ? 'cyan' : 'dimmed'}
                                    onClick={() => page > 1 && setPage(page - 1)}
                                    size="sm"
                                    style={{ cursor: page > 1 ? 'pointer' : 'default' }}
                                >
                                    ← prev
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
                                    next →
                                </Text>
                            </Group>
                        )}
                    </Group>
                </Card>

                <Table.ScrollContainer minWidth={900}>
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Time</Table.Th>
                                <Table.Th>Administrator</Table.Th>
                                <Table.Th>Action</Table.Th>
                                <Table.Th>Resource</Table.Th>
                                <Table.Th>Result</Table.Th>
                                <Table.Th>IP</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {isLoading && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text c="dimmed" size="sm">
                                            Loading…
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {!isLoading && (data?.entries.length ?? 0) === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={6}>
                                        <Text c="dimmed" size="sm">
                                            Nothing recorded yet.
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
