import { GetInternalSquadsCommand } from '@xpanel/backend-contract'

export interface IProps {
    filteredInternalSquads: GetInternalSquadsCommand.Response['response']['internalSquads']
}
