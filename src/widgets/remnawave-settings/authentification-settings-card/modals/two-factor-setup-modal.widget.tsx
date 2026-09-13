import {
    ActionIcon,
    Alert,
    Button,
    Card,
    Center,
    Code,
    CopyButton,
    Group,
    Loader,
    PinInput,
    Stack,
    Text,
    Tooltip
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbAlertTriangle, TbCheck, TbCopy } from 'react-icons/tb'

import { useSetupTwoFactor, useVerifyTwoFactor } from '@shared/api/hooks'
import { renderQrSvg } from '@shared/utils/render-qr-svg.util'

// Two-factor authentication (TOTP) setup, shown in a modal opened from the
// authentication settings card. The secret is requested only when the modal
// opens, not in advance. Reuses the existing `security-page` locale keys.

interface IProps {
    onEnabled: () => void
}

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

export const TwoFactorSetupModal = ({ onEnabled }: IProps) => {
    const { t } = useTranslation()

    const [step, setStep] = useState<1 | 2>(1)
    const [setupData, setSetupData] = useState<ISetupData | null>(null)
    const [code, setCode] = useState('')
    const isSetupRequestedRef = useRef(false)

    const {
        mutate: requestSetup,
        error: setupError,
        isPending: isSetupPending
    } = useSetupTwoFactor({
        mutationFns: {
            onSuccess: (result) => {
                setSetupData({ otpauthUrl: result.otpauthUrl, secret: result.secret })
            }
        }
    })

    // Request the secret on modal open. The mutation function identity is
    // stable, and the ref keeps the request from firing twice.
    useEffect(() => {
        if (isSetupRequestedRef.current) {
            return
        }

        isSetupRequestedRef.current = true
        requestSetup({})
    }, [requestSetup])

    const verifyTwoFactor = useVerifyTwoFactor({
        mutationFns: {
            onSuccess: () => {
                onEnabled()
                modals.closeAll()
            }
        }
    })

    const handleVerify = () => {
        verifyTwoFactor.mutate({ variables: { code } })
    }

    return (
        <Stack
            gap="md"
            onKeyDown={(event) => {
                // The modal is portaled, but Enter inside the PIN input must
                // never reach the settings card <form> and submit it.
                if (event.key === 'Enter') {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }}
        >
            {!setupData && !setupError && (
                <Center mih={140}>
                    <Stack align="center" gap="xs">
                        <Loader />
                        <Text c="dimmed" size="sm">
                            {t('common.message.loading')}
                        </Text>
                    </Stack>
                </Center>
            )}

            {!setupData && setupError && (
                <Alert color="red" icon={<TbAlertTriangle size={18} />} variant="light">
                    <Stack gap="sm">
                        <Text size="sm">
                            {setupError.message || t('security-page.notification-error-unknown')}
                        </Text>
                        <Button
                            color="red"
                            loading={isSetupPending}
                            onClick={() => requestSetup({})}
                            variant="light"
                        >
                            {t('common.action.try-again')}
                        </Button>
                    </Stack>
                </Alert>
            )}

            {setupData && step === 1 && (
                <Stack gap="md">
                    <Stack gap={4}>
                        <Text fw={600}>{t('security-page.step-1-title')}</Text>
                        <Text c="dimmed" size="sm">
                            {t('security-page.step-1-description')}
                        </Text>
                    </Stack>

                    <Group align="flex-start" gap="lg" wrap="wrap">
                        {/* Белый фон нужен, чтобы QR читался в тёмной теме. */}
                        <Card
                            padding="sm"
                            radius="md"
                            style={{ backgroundColor: '#ffffff' }}
                            withBorder
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: renderQrSvg(setupData.otpauthUrl, 220)
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

                    <Group justify="flex-end">
                        <Button onClick={() => setStep(2)} variant="light">
                            {t('common.action.next')}
                        </Button>
                    </Group>
                </Stack>
            )}

            {setupData && step === 2 && (
                <Stack gap="md">
                    <Text fw={600}>{t('security-page.step-2-title')}</Text>

                    <Group gap="md" wrap="wrap">
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
            )}
        </Stack>
    )
}
