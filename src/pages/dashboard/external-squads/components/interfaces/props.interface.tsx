import { GetExternalSquadsCommand } from '@xlada/backend-contract'

export interface Props {
    externalSquads: GetExternalSquadsCommand.Response['response']['externalSquads']
}
