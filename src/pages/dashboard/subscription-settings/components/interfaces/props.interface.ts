import { GetSubscriptionSettingsCommand } from '@xpanel/backend-contract'

export interface IProps {
    subscriptionSettings: GetSubscriptionSettingsCommand.Response['response']
}
