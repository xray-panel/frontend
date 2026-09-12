import { GetNodeCommand } from '@xpanel/backend-contract'

export interface IProps {
    node: GetNodeCommand.Response['response']
}
