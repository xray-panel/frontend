import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Code,
    CopyButton,
    Group,
    PinInput,
    Stack,
    Text,
    Tooltip
} from '@mantine/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbCopy, TbShieldLock } from 'react-icons/tb'
import { renderSVG } from 'uqr'

import {
    useDisableTwoFactor,
    useGetTwoFactorStatus,
    useSetupTwoFactor,
    useVerifyTwoFactor
} from '@shared/api/hooks'
import { Page, PageHeaderShared } from '@shared/ui'

// Two-factor authentication (TOTP) settings page.
// All user-visible strings live in the `security-page` locale namespace.

interface ISetupData {
    otpauthUrl: string
    secret: string
}

const SecretValue = ({ value }: { value: string }) => {
    const { t } = useTranslation()

    return (
        <Group gap="xs" wrap="nowrap">
            <Code style={{ wordBreak: 'break-all' }}>{value}</Code>
            <CopyButton value={value}>
                {({ copied, copy }) => (
                    <Tooltip label={copied ? t('security-page.copied') : t('security-page.copy')}>
                        <ActionIcon
                            color={copied ? 'teal' : 'gray'}
                            onClick={copy}
                            variant="subtle"
                        >
                            {copied ? <TbCheck size={16} /> : <TbCopy size={16} />}
                        </ActionIcon>
                    </Tooltip>
                )}
            </CopyButton>
        </Group>
    )
}

export const SecurityPageComponent = () => {
    const { t } = useTranslation()
    const { data, refetch } = useGetTwoFactorStatus({})

    const [setupData, setSetupData] = useState<ISetupData | null>(null)
    const [code, setCode] = useState('')

    const isEnabled = data?.isEnabled ?? false

    const setupTwoFactor = useSetupTwoFactor({
        mutationFns: {
            onSuccess: (result) => {
                setSetupData({ secret: result.secret, otpauthUrl: result.otpauthUrl })
                setCode('')
            }
        }
    })

    const verifyTwoFactor = useVerifyTwoFactor({
        mutationFns: {
            onSuccess: async () => {
                setSetupData(null)
                setCode('')
                await refetch()
            }
        }
    })

    const disableTwoFactor = useDisableTwoFactor({
        mutationFns: {
            onSuccess: async () => {
                setCode('')
                await refetch()
            }
        }
    })

    const handleVerify = () => {
        verifyTwoFactor.mutate({ variables: { code } })
    }

    const handleDisable = () => {
        disableTwoFactor.mutate({ variables: { code } })
    }

    return (
        <Page title={t('security-page.title')}>
            <PageHeaderShared
                icon={<TbShieldLock size={24} />}
                title={t('security-page.title')}
            />

            <Stack gap="md" maw={720}>
                <Card padding="md" radius="md" withBorder>
                    <Group justify="space-between" wrap="wrap">
                        <Stack gap={4}>
                            <Group gap="sm">
                                <Text fw={600}>{t('security-page.two-factor-title')}</Text>
                                <Badge color={isEnabled ? 'teal' : 'gray'} variant="light">
                                    {isEnabled
                                        ? t('security-page.status-enabled')
                                        : t('security-page.status-disabled')}
                                </Badge>
                            </Group>
                            <Text c="dimmed" maw={560} size="sm">
                                {t('security-page.two-factor-description')}
                            </Text>
                        </Stack>
                        {!isEnabled && !setupData && (
                            <Button
                                loading={setupTwoFactor.isPending}
                                onClick={() => setupTwoFactor.mutate({})}
                                variant="light"
                            >
                                {t('security-page.setup-button')}
                            </Button>
                        )}
                    </Group>
                </Card>

                {!isEnabled && setupData && (
                    <Card padding="md" radius="md" withBorder>
                        <Stack gap="md">
                            <Text fw={600}>{t('security-page.step-1-title')}</Text>
                            <Text c="dimmed" size="sm">
                                {t('security-page.step-1-description')}
                            </Text>

                            <Group align="flex-start" gap="lg" wrap="wrap">
                                <Card padding="sm" radius="md" withBorder>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: renderSVG(setupData.otpauthUrl, {
                                                whiteColor: '#ffffff',
                                                blackColor: '#000000'
                                            })
                                        }}
                                        style={{ lineHeight: 0, fontSize: 0 }}
                                    />
                                </Card>
                                <Stack gap="xs" style={{ flex: 1, minWidth: 260 }}>
                                    <Text fw={500} size="sm">
                                        {t('security-page.secret-key')}
                                    </Text>
                                    <SecretValue value={setupData.secret} />
                                    <Text fw={500} mt="xs" size="sm">
                                        {t('security-page.setup-url')}
                                    </Text>
                                    <SecretValue value={setupData.otpauthUrl} />
                                </Stack>
                            </Group>

                            <Text fw={600}>{t('security-page.step-2-title')}</Text>
                            <Group gap="md">
                                <PinInput
                                    aria-label={t('security-page.code-input-label')}
                                    length={6}
                                    onChange={setCode}
                                    onComplete={setCode}
                                    type="number"
                                    value={code}
                                />
                                <Button
                                    disabled={code.length !== 6}
                                    loading={verifyTwoFactor.isPending}
                                    onClick={handleVerify}
                                >
                                    {t('security-page.confirm-enable-button')}
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                )}

                {isEnabled && (
                    <Card padding="md" radius="md" withBorder>
                        <Stack gap="md">
                            <Text fw={600}>{t('security-page.disable-title')}</Text>
                            <Text c="dimmed" size="sm">
                                {t('security-page.disable-description')}
                            </Text>
                            <Group gap="md">
                                <PinInput
                                    aria-label={t('security-page.code-input-label')}
                                    length={6}
                                    onChange={setCode}
                                    onComplete={setCode}
                                    type="number"
                                    value={code}
                                />
                                <Button
                                    color="red"
                                    disabled={code.length !== 6}
                                    loading={disableTwoFactor.isPending}
                                    onClick={handleDisable}
                                    variant="light"
                                >
                                    {t('security-page.disable-button')}
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                )}
            </Stack>
        </Page>
    )
}
