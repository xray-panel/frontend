import { Alert, Badge, Button, Group, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useTranslation } from 'react-i18next'
import { TbAlertTriangle, TbShieldLock } from 'react-icons/tb'

import { useGetTwoFactorStatus } from '@shared/api/hooks'
import { useIsMobile } from '@shared/hooks'
import { BaseOverlayHeader } from '@shared/ui/overlays/base-overlay-header'

import { TwoFactorDisableModal } from './modals/two-factor-disable-modal.widget'
import { TwoFactorSetupModal } from './modals/two-factor-setup-modal.widget'

// Two-factor authentication (TOTP) section, rendered inside the authentication
// methods card next to Password/Passkey.
// Reuses the existing `security-page` locale keys.

export const TwoFactorSection = () => {
    const { t } = useTranslation()
    const isMobile = useIsMobile()
    const { data, refetch } = useGetTwoFactorStatus({})

    const isEnabled = data?.isEnabled ?? false

    const handleStatusChange = () => {
        refetch()
    }

    const openSetupModal = () => {
        modals.open({
            centered: true,
            children: <TwoFactorSetupModal onEnabled={handleStatusChange} />,
            fullScreen: isMobile,
            size: 'min(620px, 95vw)',
            title: (
                <BaseOverlayHeader
                    iconColor="teal"
                    IconComponent={TbShieldLock}
                    iconVariant="soft"
                    title={t('security-page.two-factor-title')}
                />
            )
        })
    }

    const openDisableModal = () => {
        modals.open({
            centered: true,
            children: <TwoFactorDisableModal onDisabled={handleStatusChange} />,
            fullScreen: isMobile,
            size: 'min(520px, 95vw)',
            title: (
                <BaseOverlayHeader
                    iconColor="red"
                    IconComponent={TbShieldLock}
                    iconVariant="soft"
                    title={t('security-page.disable-title')}
                />
            )
        })
    }

    return (
        <Stack gap="md">
            <Text c="dimmed" size="sm">
                {t('security-page.two-factor-description')}
            </Text>

            {/* Честная оговорка: второй фактор защищает только вход по
                паролю. Так решено сознательно — passkey и OAuth2
                считаются полноценным вторым фактором, но администратор
                должен об этом знать, а не догадываться. */}
            <Alert color="yellow" icon={<TbAlertTriangle size={18} />} variant="light">
                <Text size="sm">{t('security-page.passkey-oauth-note')}</Text>
            </Alert>

            <Group justify="space-between" wrap="wrap">
                <Badge color={isEnabled ? 'teal' : 'gray'} variant="light">
                    {isEnabled
                        ? t('security-page.status-enabled')
                        : t('security-page.status-disabled')}
                </Badge>

                <Button
                    color={isEnabled ? 'red' : undefined}
                    onClick={isEnabled ? openDisableModal : openSetupModal}
                    variant="light"
                >
                    {isEnabled
                        ? t('security-page.disable-button')
                        : t('security-page.setup-button')}
                </Button>
            </Group>
        </Stack>
    )
}
