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
import { useTranslation } from 'react-i18next'
import { TbEye, TbEyeOff, TbKey, TbPlus, TbTrash, TbUserShield, TbWand } from 'react-icons/tb'

import {
    useCreateAdmin,
    useDeleteAdmin,
    useGetAdmins,
    useUpdateAdmin
} from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'
import { generatePassword } from '@shared/utils/misc'

interface IPasswordFieldProps {
    description: string
    generateLabel: string
    hideLabel: string
    label: string
    onChange: (value: string) => void
    onGenerate: () => void
    showLabel: string
    value: string
    visible: boolean
    onVisibleChange: (visible: boolean) => void
}

// Поле пароля с кнопками генерации и показа: сгенерированный пароль сразу
// подставляется открытым текстом, чтобы администратор успел его сохранить.
function PasswordField(props: IPasswordFieldProps) {
    const {
        description,
        generateLabel,
        hideLabel,
        label,
        onChange,
        onGenerate,
        showLabel,
        value,
        visible,
        onVisibleChange
    } = props

    return (
        <PasswordInput
            description={description}
            label={label}
            onChange={(event) => onChange(event.currentTarget.value)}
            rightSection={
                <Group gap={4} wrap="nowrap">
                    <ActionIcon
                        aria-label={generateLabel}
                        onClick={onGenerate}
                        size="sm"
                        title={generateLabel}
                        variant="subtle"
                    >
                        <TbWand size={16} />
                    </ActionIcon>
                    <ActionIcon
                        aria-label={visible ? hideLabel : showLabel}
                        onClick={() => onVisibleChange(!visible)}
                        size="sm"
                        title={visible ? hideLabel : showLabel}
                        variant="subtle"
                    >
                        {visible ? <TbEyeOff size={16} /> : <TbEye size={16} />}
                    </ActionIcon>
                </Group>
            }
            rightSectionWidth={68}
            value={value}
            visible={visible}
        />
    )
}

export const AdminsPageComponent = () => {
    const { t } = useTranslation()
    const { data, isLoading, refetch } = useGetAdmins({})

    const [createOpened, createHandlers] = useDisclosure(false)
    const [passwordOpened, passwordHandlers] = useDisclosure(false)
    const [deleteOpened, deleteHandlers] = useDisclosure(false)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [target, setTarget] = useState<null | { username: string; uuid: string }>(null)

    const createAdmin = useCreateAdmin({
        mutationFns: {
            onSuccess: async () => {
                createHandlers.close()
                setUsername('')
                setPassword('')
                setPasswordVisible(false)
                await refetch()
            }
        }
    })

    const updateAdmin = useUpdateAdmin({
        mutationFns: {
            onSuccess: async () => {
                passwordHandlers.close()
                setPassword('')
                setPasswordVisible(false)
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

    const generateAndShowPassword = () => {
        setPassword(generatePassword())
        setPasswordVisible(true)
    }

    const openCreateModal = () => {
        setUsername('')
        setPassword('')
        setPasswordVisible(false)
        createHandlers.open()
    }

    const openPasswordModal = (uuid: string, name: string) => {
        setTarget({ uuid, username: name })
        setPassword('')
        setPasswordVisible(false)
        passwordHandlers.open()
    }

    const openDeleteModal = (uuid: string, name: string) => {
        setTarget({ uuid, username: name })
        deleteHandlers.open()
    }

    return (
        <Page title={t('admins-page.title')}>
            <PageHeaderShared
                icon={<TbUserShield size={24} />}
                title={t('admins-page.title')}
            />

            <Stack gap="md">
                <Card padding="md" radius="md" withBorder>
                    <Group justify="space-between" wrap="wrap">
                        <Text c="dimmed" maw={620} size="sm">
                            {t('admins-page.description')}
                        </Text>
                        <Button
                            leftSection={<TbPlus size={16} />}
                            onClick={openCreateModal}
                            variant="light"
                        >
                            {t('admins-page.add-admin')}
                        </Button>
                    </Group>
                </Card>

                <Table.ScrollContainer minWidth={760}>
                    <Table highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('admins-page.table-username')}</Table.Th>
                                <Table.Th>{t('admins-page.table-role')}</Table.Th>
                                <Table.Th>{t('admins-page.table-2fa')}</Table.Th>
                                <Table.Th>{t('admins-page.table-created')}</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {isLoading && (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text c="dimmed" size="sm">
                                            {t('admins-page.loading')}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                            {!isLoading && admins.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text c="dimmed" size="sm">
                                            {t('admins-page.empty')}
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
                                            {admin.totpEnabled
                                                ? t('admins-page.totp-enabled')
                                                : t('admins-page.totp-disabled')}
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
                                                aria-label={t('admins-page.change-password')}
                                                onClick={() =>
                                                    openPasswordModal(admin.uuid, admin.username)
                                                }
                                                variant="subtle"
                                            >
                                                <TbKey size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                aria-label={t('admins-page.delete')}
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
                title={t('admins-page.create-title')}
            >
                <Stack gap="sm">
                    <TextInput
                        label={t('admins-page.username-label')}
                        onChange={(event) => setUsername(event.currentTarget.value)}
                        value={username}
                    />
                    <PasswordField
                        description={t('admins-page.password-hint')}
                        generateLabel={t('admins-page.generate-password')}
                        hideLabel={t('admins-page.hide-password')}
                        label={t('admins-page.password-label')}
                        onChange={setPassword}
                        onGenerate={generateAndShowPassword}
                        onVisibleChange={setPasswordVisible}
                        showLabel={t('admins-page.show-password')}
                        value={password}
                        visible={passwordVisible}
                    />
                    <Button
                        loading={createAdmin.isPending}
                        onClick={() => createAdmin.mutate({ variables: { username, password } })}
                    >
                        {t('admins-page.create')}
                    </Button>
                </Stack>
            </Modal>

            <Modal
                onClose={passwordHandlers.close}
                opened={passwordOpened}
                title={t('admins-page.change-title', { username: target?.username ?? '' })}
            >
                <Stack gap="sm">
                    <PasswordField
                        description={t('admins-page.password-hint')}
                        generateLabel={t('admins-page.generate-password')}
                        hideLabel={t('admins-page.hide-password')}
                        label={t('admins-page.new-password-label')}
                        onChange={setPassword}
                        onGenerate={generateAndShowPassword}
                        onVisibleChange={setPasswordVisible}
                        showLabel={t('admins-page.show-password')}
                        value={password}
                        visible={passwordVisible}
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
                        {t('admins-page.save')}
                    </Button>
                </Stack>
            </Modal>

            <Modal
                onClose={deleteHandlers.close}
                opened={deleteOpened}
                title={t('admins-page.delete-title')}
            >
                <Stack gap="sm">
                    <Text size="sm">
                        {t('admins-page.delete-body', { username: target?.username ?? '' })}
                    </Text>
                    <Group justify="flex-end">
                        <Button onClick={deleteHandlers.close} variant="default">
                            {t('admins-page.cancel')}
                        </Button>
                        <Button
                            color="red"
                            loading={deleteAdmin.isPending}
                            onClick={() =>
                                target && deleteAdmin.mutate({ route: { uuid: target.uuid } })
                            }
                        >
                            {t('admins-page.delete')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Page>
    )
}
