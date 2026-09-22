import { ActionIcon, Tooltip } from '@mantine/core'
import { getRequiredNodeVersion, GetNodeCommand, isGeocheckSupported } from '@xlada/backend-contract'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TbMapSearch } from 'react-icons/tb'

import { showModal } from '@shared/_modals/show-modal'

interface IProps {
    node: GetNodeCommand.Response['response']
}

const GetNodeGeocheckFeatureComponent = (props: IProps) => {
    const { node } = props
    const { t } = useTranslation()

    const nodeVersion = node.versions?.node

    const isSupported = useMemo(() => isGeocheckSupported(nodeVersion), [nodeVersion])

    return (
        <Tooltip
            label={
                isSupported
                    ? t('node-geocheck.title')
                    : t('node-geocheck.requires-node-version', {
                          version: getRequiredNodeVersion(nodeVersion, true)
                      })
            }
        >
            <ActionIcon
                disabled={!isSupported}
                color="indigo"
                onClick={() => {
                    showModal('nodes_nodeGeocheckModal', { node })
                }}
                size="lg"
                variant="soft"
            >
                <TbMapSearch size="22px" />
            </ActionIcon>
        </Tooltip>
    )
}

export const GetNodeGeocheckFeature = memo(GetNodeGeocheckFeatureComponent)
