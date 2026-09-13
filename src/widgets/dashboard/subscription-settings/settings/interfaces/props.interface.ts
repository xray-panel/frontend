import { GetSubscriptionSettingsCommand } from '@xlada/backend-contract'

export interface IProps {
    subscriptionSettings: GetSubscriptionSettingsCommand.Response['response']
}
