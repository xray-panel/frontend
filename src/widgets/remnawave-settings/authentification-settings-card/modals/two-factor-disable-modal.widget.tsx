import { Button, Group, PinInput, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDisableTwoFactor } from '@shared/api/hooks'

// Two-factor authentication (TOTP) disable confirmation, shown in a modal
// opened from the authentication settings card. Reuses the existing
// `security-page` locale keys.

interface IProps {
    onDisabled: () => void
}

export const TwoFactorDisableModal = ({ onDisabled }: IProps) => {
    const { t } = useTranslation()
    const [code, setCode] = useState('')

    const disableTwoFactor = useDisableTwoFactor({
        mutationFns: {
            onSuccess: () => {
                onDisabled()
                modals.closeAll()
            }
        }
    })

    const handleDisable = () => {
        disableTwoFactor.mutate({ variables: { code } })
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
            <Text c="dimmed" size="sm">
                {t('security-page.disable-description')}
            </Text>

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
    )
}
