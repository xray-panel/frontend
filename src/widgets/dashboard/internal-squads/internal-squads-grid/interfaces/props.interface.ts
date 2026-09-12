import { GetInternalSquadsCommand } from '@xpanel/backend-contract'

export interface IProps {
    internalSquads: GetInternalSquadsCommand.Response['response']['internalSquads']
}
