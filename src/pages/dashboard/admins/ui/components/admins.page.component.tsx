import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Modal,
    PasswordInput,
    Stack,
    Table,
    Text,
    TextInput
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { TbKey, TbPlus, TbTrash, TbUserShield } from 'react-icons/tb'

import {
    useCreateAdmin,
    useDeleteAdmin,
    useGetAdmins,
    useUpdateAdmin
} from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'

// Та же политика, что и на сервере: минимум 24 символа, заглавные, строчные
// и цифры. Подсказка здесь только для удобства — источник истины в контракте,
// который применяется на бэкенде.
const PASSWORD_HINT = 'Минимум 24 символа, заглавные и строчные буквы, а также цифры.'

export const AdminsPageComponent = () => {
    const { data, isLoading, refetch } = useGetAdmins({})

    const [createOpened, createHandlers] = useDisclosure(false)
    const [passwordOpened, passwordHandlers] = useDisclosure(false)
    const [deleteOpened, deleteHandlers] = useDisclosure(false)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [target, setTarget] = useState<null | { username: string; uuid: string }>(null)

    const createAdmin = useCreateAdmin({
        mutationFns: {
            onSuccess: async () => {
                createHandlers.close()
                setUsername('')
                setPassword('')
                await refetch()
            }
        }
    })

    const updateAdmin = useUpdateAdmin({
        mutationFns: {
            onSuccess: async () => {
                passwordHandlers.close()
                setPassword('')
                setTarget(null)
                await refetch()
            }
        }
    })

    const deleteAdmin = useDeleteAdmin({
        mutationFns: {
            onSuccess: async () => {
                deleteHandlers.close()
                setTarget(null)
                await refetch()
            }
        }
    })

    const admins = data?.admins ?? []

    const openPasswordModal = (uuid: string, name: string) => {
        setTarget({ uuid, username: name })
        setPassword('')
        passwordHandlers.open()
    }

    const openDeleteModal = (uuid: string, name: string) => {
        setTarget({ uuid, username: name })
        deleteHandlers.open()
    }

    return (
        <Page title="Administrators">
            <PageHeaderShared icon={<TbUserShield size={24} />} title="Administrators" />

            <Stack gap="md">
                <Card padding="md" radius="md" withBorder>
                    <Group justify="space-between" wrap="wrap">
                        <Text c="dimmed" maw={620} size="sm">
                            Учётные записи с полным доступом к панели. Пароль можно сменить, но
                            посмотреть нельзя: в базе хранится только его хеш.
                        </Text>
                        <Button
                            leftSection={<TbPlus size={16} />}
                            onClick={createHandlers.open}
                            variant="light"
                        >
                            Добавить администратора
                        </Button>
                    </Group>
                </Card>

                <Table.ScrollContainer minWidth={760}>
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Логин</Table.Th>
                                <Table.Th>Роль</Table.Th>
                                <Table.Th>2FA</Table.Th>
                                <Table.Th>Создан</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {isLoading && (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text c="dimmed" size="sm">
                                            Загрузка…
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {!isLoading && admins.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text c="dimmed" size="sm">
                                            Администраторов не найдено.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {admins.map((admin) => (
                                <Table.Tr key={admin.uuid}>
                                    <Table.Td>
                                        <Text fw={500} size="sm">
                                            {admin.username}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{admin.role}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={admin.totpEnabled ? 'teal' : 'gray'}
                                            variant="light"
                                        >
                                            {admin.totpEnabled ? 'включена' : 'выключена'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text c="dimmed" size="sm">
                                            {new Date(admin.createdAt).toLocaleString()}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs" justify="flex-end">
                                            <ActionIcon
                                                aria-label="Сменить пароль"
                                                onClick={() =>
                                                    openPasswordModal(admin.uuid, admin.username)
                                                }
                                                variant="subtle"
                                            >
                                                <TbKey size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                aria-label="Удалить"
                                                color="red"
                                                onClick={() =>
                                                    openDeleteModal(admin.uuid, admin.username)
                                                }
                                                variant="subtle"
                                            >
                                                <TbTrash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Stack>

            <Modal
                onClose={createHandlers.close}
                opened={createOpened}
                title="Новый администратор"
            >
                <Stack gap="sm">
                    <TextInput
                        label="Логин"
                        onChange={(event) => setUsername(event.currentTarget.value)}
                        value={username}
                    />
                    <PasswordInput
                        description={PASSWORD_HINT}
                        label="Пароль"
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        value={password}
                    />
                    <Button
                        loading={createAdmin.isPending}
                        onClick={() => createAdmin.mutate({ variables: { username, password } })}
                    >
                        Создать
                    </Button>
                </Stack>
            </Modal>

            <Modal
                onClose={passwordHandlers.close}
                opened={passwordOpened}
                title={`Смена пароля — ${target?.username ?? ''}`}
            >
                <Stack gap="sm">
                    <PasswordInput
                        description={PASSWORD_HINT}
                        label="Новый пароль"
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        value={password}
                    />
                    <Button
                        loading={updateAdmin.isPending}
                        onClick={() =>
                            target &&
                            updateAdmin.mutate({
                                route: { uuid: target.uuid },
                                variables: { password }
                            })
                        }
                    >
                        Сохранить
                    </Button>
                </Stack>
            </Modal>

            <Modal
                onClose={deleteHandlers.close}
                opened={deleteOpened}
                title="Удаление администратора"
            >
                <Stack gap="sm">
                    <Text size="sm">
                        Учётная запись <b>{target?.username ?? ''}</b> будет удалена вместе с её
                        ключами доступа. Действие необратимо.
                    </Text>
                    <Group justify="flex-end">
                        <Button onClick={deleteHandlers.close} variant="default">
                            Отмена
                        </Button>
                        <Button
                            color="red"
                            loading={deleteAdmin.isPending}
                            onClick={() =>
                                target && deleteAdmin.mutate({ route: { uuid: target.uuid } })
                            }
                        >
                            Удалить
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Page>
    )
}
