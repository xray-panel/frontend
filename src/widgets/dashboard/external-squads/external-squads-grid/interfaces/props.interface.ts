import { GetExternalSquadsCommand } from '@xpanel/backend-contract'

export interface IProps {
    externalSquads: GetExternalSquadsCommand.Response['response']['externalSquads']
}
