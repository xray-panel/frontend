import {
    GetSubscriptionSettingsCommand,
    TSubscriptionTemplateType
} from '@xpanel/backend-contract'

export interface IProps {
    groupedTemplates: Record<TSubscriptionTemplateType, string[]>
    responseRules: GetSubscriptionSettingsCommand.Response['response']['responseRules']
    subscriptionSettingsUuid: string
}
