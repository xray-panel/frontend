import { GetNodeCommand } from '@xlada/backend-contract'

export interface IProps {
    node: GetNodeCommand.Response['response']
}
