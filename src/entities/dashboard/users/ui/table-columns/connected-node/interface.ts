import { GetNodesCommand } from '@xpanel/backend-contract'

export interface IProps {
    node: GetNodesCommand.Response['response'][number] | undefined
}
