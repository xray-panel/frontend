import { Alert, Badge, Group, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { TbAlertTriangle } from 'react-icons/tb'

import { useGetTwoFactorStatus } from '@shared/api/hooks'

// Two-factor authentication (TOTP) panel body, rendered inside the
// authentication methods card next to Password/Passkey.
// The enable/disable action lives in the accordion row switch
// (two-factor-switch.tsx); this panel only describes the method and shows
// the current status. The status badge reads the same cached query as the
// switch (identical query key), so no extra request is made.
// Reuses the existing `security-page` locale keys.

export const TwoFactorSection = () => {
    const { t } = useTranslation()
    const { data } = useGetTwoFactorStatus({})

    const isEnabled = data?.isEnabled ?? false

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

            <Group justify="flex-start">
                <Badge color={isEnabled ? 'teal' : 'gray'} variant="light">
                    {isEnabled
                        ? t('security-page.status-enabled')
                        : t('security-page.status-disabled')}
                </Badge>
            </Group>
        </Stack>
    )
}
