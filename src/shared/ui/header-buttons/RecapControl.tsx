import { rem } from '@mantine/core'
import { modals } from '@mantine/modals'
import { RecapContent } from '@widgets/dashboard/recap/recap.content.widget'
import { useTranslation } from 'react-i18next'
import { TbSparkles } from 'react-icons/tb'

import { BaseOverlayHeader } from '../overlays/base-overlay-header'
import { HeaderControl } from './HeaderControl'

export function RecapControl() {
    const { t } = useTranslation()

    const handleClick = () => {
        modals.open({
            title: (
                <BaseOverlayHeader
                    iconColor="indigo"
                    IconComponent={TbSparkles}
                    iconVariant="soft"
                    title={t('header.recap.title')}
                />
            ),
            centered: true,
            size: '980px',
            withCloseButton: true,
            children: <RecapContent />
        })
    }

    return (
        <HeaderControl onClick={handleClick}>
            <TbSparkles style={{ width: rem(22), height: rem(22) }} />
        </HeaderControl>
    )
}
