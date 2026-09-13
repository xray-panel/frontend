import { Anchor } from '@mantine/core'
import { ReactNode } from 'react'

import { buildAsLookupUrl, buildIpLookupUrl } from '@shared/utils/misc/ip-lookup'

import classes from './Trace.module.css'

interface IProps {
    children: ReactNode
    kind: 'as' | 'ip'
    value: number | string
}

/**
 * Ссылка на внешнюю проверку адреса в трассировке.
 *
 * Проверка по умолчанию выключена (см. shared/utils/misc/ip-lookup.ts),
 * поэтому в обычной конфигурации здесь выводится обычный текст: адреса
 * пользователей не должны уходить третьим сторонам по клику.
 */
export const TraceLink = (props: IProps) => {
    const { children, kind, value } = props

    const href = kind === 'as' ? buildAsLookupUrl(value) : buildIpLookupUrl(String(value))

    if (!href) {
        return <span className={classes.link}>{children}</span>
    }

    return (
        <Anchor
            className={classes.link}
            href={href}
            inherit
            rel="noopener noreferrer"
            target="_blank"
            underline="never"
        >
            {children}
        </Anchor>
    )
}
