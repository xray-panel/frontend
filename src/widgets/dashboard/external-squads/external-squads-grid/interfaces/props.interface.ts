import { GetExternalSquadsCommand } from '@xlada/backend-contract'

export interface IProps {
    externalSquads: GetExternalSquadsCommand.Response['response']['externalSquads']
}
