import { TSubscriptionTemplateType } from '@xpanel/backend-contract'

export interface IDownloadableSubscriptionTemplate {
    author: string
    name: string
    type: 'SRR' | 'SUBPAGE_CONFIG' | TSubscriptionTemplateType
    url: string
}

export interface IDownloadableSubscriptionTemplateList {
    templates: IDownloadableSubscriptionTemplate[]
}
