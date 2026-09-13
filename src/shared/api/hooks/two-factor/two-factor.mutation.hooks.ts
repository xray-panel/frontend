import { notifications } from '@mantine/notifications'
import { t } from 'i18next'
import {
    DisableTwoFactorCommand,
    SetupTwoFactorCommand,
    TwoFactorLoginCommand,
    VerifyTwoFactorCommand
} from '@xpanel/backend-contract'

import { setToken } from '@entities/auth/session-store'

import { createMutationHook } from '../../tsq-helpers'

// Two-factor authentication (TOTP) hooks. Notification strings are resolved
// through i18next: management actions use the `security-page` namespace, the
// sign-in second step uses `login-page`.
export const useSetupTwoFactor = createMutationHook({
    endpoint: SetupTwoFactorCommand.TSQ_url,
    responseSchema: SetupTwoFactorCommand.ResponseSchema,
    requestMethod: SetupTwoFactorCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onError: (error) => {
            notifications.show({
                title: t('security-page.notification-title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('security-page.notification-error-unknown'),
                color: 'red'
            })
        }
    }
})

export const useVerifyTwoFactor = createMutationHook({
    endpoint: VerifyTwoFactorCommand.TSQ_url,
    bodySchema: VerifyTwoFactorCommand.RequestBodySchema,
    responseSchema: VerifyTwoFactorCommand.ResponseSchema,
    requestMethod: VerifyTwoFactorCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: () => {
            notifications.show({
                title: t('security-page.notification-title'),
                message: t('security-page.notification-enabled'),
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: t('security-page.notification-title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('security-page.notification-error-unknown'),
                color: 'red'
            })
        }
    }
})

export const useDisableTwoFactor = createMutationHook({
    endpoint: DisableTwoFactorCommand.TSQ_url,
    bodySchema: DisableTwoFactorCommand.RequestBodySchema,
    responseSchema: DisableTwoFactorCommand.ResponseSchema,
    requestMethod: DisableTwoFactorCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: () => {
            notifications.show({
                title: t('security-page.notification-title'),
                message: t('security-page.notification-disabled'),
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: t('security-page.notification-title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('security-page.notification-error-unknown'),
                color: 'red'
            })
        }
    }
})

export const useTwoFactorLogin = createMutationHook({
    endpoint: TwoFactorLoginCommand.TSQ_url,
    bodySchema: TwoFactorLoginCommand.RequestBodySchema,
    responseSchema: TwoFactorLoginCommand.ResponseSchema,
    requestMethod: TwoFactorLoginCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: (data) => {
            setToken({ token: data.accessToken })
        },
        onError: (error) => {
            notifications.show({
                title: t('login-page.notification-title'),
                message:
                    error instanceof Error ? error.message : t('login-page.two-factor-error'),
                color: 'red'
            })
        }
    }
})
