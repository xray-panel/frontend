import { GetInternalSquadsCommand } from '@xpanel/backend-contract'

export interface IProps {
    internalSquad: GetInternalSquadsCommand.Response['response']['internalSquads'][number] | null
}
