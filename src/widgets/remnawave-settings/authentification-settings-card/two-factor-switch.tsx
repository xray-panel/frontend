import { Switch } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useTranslation } from 'react-i18next'
import { TbShieldLock } from 'react-icons/tb'

import { useGetTwoFactorStatus } from '@shared/api/hooks'
import { useIsMobile } from '@shared/hooks'
import { BaseOverlayHeader } from '@shared/ui/overlays/base-overlay-header'

import { TwoFactorDisableModal } from './modals/two-factor-disable-modal.widget'
import { TwoFactorSetupModal } from './modals/two-factor-setup-modal.widget'

// Two-factor authentication (TOTP) switch, rendered in the accordion row of
// the authentication methods card next to the section title.
// The switch owns the status query and the setup/disable modals: turning it
// on opens the setup modal (QR code), turning it off opens the disable
// confirmation. `checked` follows the server status only — it flips after
// the modal flow succeeds and the status query is refetched, not on click.
// Reuses the existing `security-page` locale keys.

export const TwoFactorSwitch = () => {
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
        <Switch
            checked={isEnabled}
            color="teal.8"
            onChange={() => (isEnabled ? openDisableModal() : openSetupModal())}
            onClick={(e) => e.stopPropagation()}
            size="md"
        />
    )
}
