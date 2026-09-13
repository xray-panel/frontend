import { Button, Container, Paper, PasswordInput, PinInput, Text, TextInput } from '@mantine/core'
import { useForm, schemaResolver } from '@mantine/form'
import { LoginCommand } from '@xlada/backend-contract'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PiSignInDuotone } from 'react-icons/pi'
import { TbShieldLock } from 'react-icons/tb'

import { useLogin, useTwoFactorLogin } from '@shared/api/hooks'
import { useAuth } from '@shared/hooks/use-auth'
import { handleFormErrors } from '@shared/utils/misc'

// Strings of the second (two-factor) sign-in step live in the `login-page`
// locale namespace.
export const LoginFormFeature = () => {
    const { t } = useTranslation()

    const { setIsAuthenticated } = useAuth()

    const [twoFactorTicket, setTwoFactorTicket] = useState<null | string>(null)
    const [twoFactorCode, setTwoFactorCode] = useState('')

    const form = useForm({
        mode: 'uncontrolled',
        validate: schemaResolver(LoginCommand.RequestBodySchema),
        initialValues: { username: '', password: '' }
    })

    const { mutate: login, isPending: isLoading } = useLogin()

    const { mutate: loginTwoFactor, isPending: isTwoFactorLoading } = useTwoFactorLogin({
        mutationFns: {
            onSuccess: () => {
                setIsAuthenticated(true)
            }
        }
    })

    const handleSubmit = form.onSubmit((variables) => {
        login(
            {
                variables: {
                    username: variables.username,
                    password: variables.password
                }
            },
            {
                onSuccess: (data) => {
                    if (data.twoFactorRequired && data.twoFactorTicket) {
                        setTwoFactorTicket(data.twoFactorTicket)
                        setTwoFactorCode('')
                        return
                    }
                    setIsAuthenticated(true)
                },
                onError: (error) => handleFormErrors(form, error)
            }
        )
    })

    const handleTwoFactorSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!twoFactorTicket || twoFactorCode.length !== 6) return

        loginTwoFactor({
            variables: {
                ticket: twoFactorTicket,
                code: twoFactorCode
            }
        })
    }

    if (twoFactorTicket) {
        return (
            <form onSubmit={handleTwoFactorSubmit}>
                <Container size="100%">
                    <Paper>
                        <Text c="dimmed" size="sm">
                            {t('login-page.two-factor-title')}
                        </Text>
                        <PinInput
                            aria-label={t('login-page.two-factor-code-label')}
                            length={6}
                            mt="md"
                            onChange={setTwoFactorCode}
                            onComplete={setTwoFactorCode}
                            type="number"
                            value={twoFactorCode}
                        />
                        <Button
                            fullWidth
                            leftSection={<TbShieldLock size="16px" />}
                            loading={isTwoFactorLoading}
                            mt="xl"
                            type="submit"
                            variant="default"
                        >
                            {t('login-page.two-factor-submit')}
                        </Button>
                        <Button
                            fullWidth
                            mt="xs"
                            onClick={() => {
                                setTwoFactorTicket(null)
                                setTwoFactorCode('')
                            }}
                            variant="subtle"
                        >
                            {t('login-page.two-factor-back')}
                        </Button>
                    </Paper>
                </Container>
            </form>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <Container size="100%">
                <Paper>
                    <TextInput
                        label={t('common.field.username')}
                        name="username"
                        placeholder={t('common.field.username')}
                        required
                        {...form.getInputProps('username')}
                    />
                    <PasswordInput
                        label={t('common.field.password')}
                        mt="md"
                        name="password"
                        placeholder={t('login-form.feature.your-password')}
                        required
                        {...form.getInputProps('password')}
                    />
                    <Button
                        fullWidth
                        leftSection={<PiSignInDuotone size="16px" />}
                        loading={isLoading}
                        mt="xl"
                        type="submit"
                        variant="default"
                    >
                        {t('login-form.feature.sign-in')}
                    </Button>
                </Paper>
            </Container>
        </form>
    )
}
