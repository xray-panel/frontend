import {
    GetSubscriptionTemplatesCommand,
    TSubscriptionTemplateType
} from '@xpanel/backend-contract'

export interface IProps {
    templates: GetSubscriptionTemplatesCommand.Response['response']['templates']
    type: TSubscriptionTemplateType
}
