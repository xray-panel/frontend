import { GetInternalSquadsCommand } from '@xlada/backend-contract'

export interface IProps {
    internalSquads: GetInternalSquadsCommand.Response['response']['internalSquads']
}
