import { GetExternalSquadsCommand } from '@xpanel/backend-contract'

export interface Props {
    externalSquads: GetExternalSquadsCommand.Response['response']['externalSquads']
}
