import {
    GetSubscriptionSettingsCommand,
    TSubscriptionTemplateType
} from '@xlada/backend-contract'

export interface IProps {
    groupedTemplates: Record<TSubscriptionTemplateType, string[]>
    responseRules: GetSubscriptionSettingsCommand.Response['response']['responseRules']
    subscriptionSettingsUuid: string
}
