import { GetInternalSquadsCommand } from '@xlada/backend-contract'

export interface Props {
    internalSquads: GetInternalSquadsCommand.Response['response']['internalSquads']
}
