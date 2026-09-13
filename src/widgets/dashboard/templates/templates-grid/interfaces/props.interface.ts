import {
    GetSubscriptionTemplatesCommand,
    TSubscriptionTemplateType
} from '@xlada/backend-contract'

export interface IProps {
    templates: GetSubscriptionTemplatesCommand.Response['response']['templates']
    type: TSubscriptionTemplateType
}
