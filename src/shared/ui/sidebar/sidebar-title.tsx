import { Text } from '@mantine/core'
import { useMemo } from 'react'

import { useGetAuthStatus } from '@shared/api/hooks/auth/auth.query.hooks'
import { parseColoredTextUtil } from '@shared/utils/misc'

import classes from './sidebar.module.css'
import { app } from 'src/config'

export const SidebarTitleShared = () => {
    const { data: authStatus } = useGetAuthStatus()

    const titleParts = useMemo(() => {
        if (authStatus?.branding.title) {
            return parseColoredTextUtil(authStatus.branding.title)
        }

        // Название панели из конфига, а не зашитое имя апстрима.
        // Если администратор задал свой заголовок в настройках брендинга,
        // он имеет приоритет — эта ветка только запасной вариант.
        return [{ text: app.name, color: 'cyan' }]
    }, [authStatus])

    return (
        <Text className={classes.logoTitle}>
            {titleParts.map((part, index) => (
                <Text c={part.color || 'white'} component="span" inherit key={index}>
                    {part.text}
                </Text>
            ))}
        </Text>
    )
}
