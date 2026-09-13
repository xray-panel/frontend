import { TSubscriptionTemplateType } from '@xlada/backend-contract'

import {
    IDownloadableSubscriptionTemplate,
    IDownloadableSubscriptionTemplateList
} from '@shared/constants/templates'

export interface TemplateSelectorProps {
    editorType: 'NODE_PLUGIN' | 'SRR' | 'SUBPAGE_CONFIG' | 'SUBSCRIPTION' | 'XRAY_CORE'
    onSelect: (template: IDownloadableSubscriptionTemplate) => void
    selectedTemplate?: IDownloadableSubscriptionTemplate
    templates: IDownloadableSubscriptionTemplateList['templates']
    templateType: 'NODE_PLUGIN' | 'SRR' | 'SUBPAGE_CONFIG' | TSubscriptionTemplateType
}
