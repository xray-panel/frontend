import { GetInternalSquadsCommand } from '@xpanel/backend-contract'

export interface Props {
    internalSquads: GetInternalSquadsCommand.Response['response']['internalSquads']
}
