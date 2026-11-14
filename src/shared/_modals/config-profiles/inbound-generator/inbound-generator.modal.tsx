import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'

import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Modal } from '@mantine/core'
import { InboundGeneratorWidget } from '@widgets/dashboard/config-profiles/config-generator'
import { useTranslation } from 'react-i18next'
import { TbWand } from 'react-icons/tb'

import { useNiceMantineModal } from '@shared/_modals/use-nice-modal'
import { BaseOverlayHeader } from '@shared/ui/overlays/base-overlay-header'

interface IProps {
    editorRef: RefObject<editor.IStandaloneCodeEditor | null>
}

export const InboundGeneratorModal = NiceModal.create((props: IProps) => {
    const { t } = useTranslation()

    const modal = useModal()
    const { modalProps } = useNiceMantineModal({ modal })

    return (
        <Modal
            {...modalProps}
            size="xl"
            title={
                <BaseOverlayHeader
                    iconColor="teal"
                    IconComponent={TbWand}
                    iconVariant="soft"
                    title={t('config-generator.title')}
                />
            }
        >
            <InboundGeneratorWidget editorRef={props.editorRef} onClose={() => modal.hide()} />
        </Modal>
    )
})
