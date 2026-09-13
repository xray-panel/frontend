import { GetNodesCommand } from '@xlada/backend-contract'

export interface IProps {
    node: GetNodesCommand.Response['response'][number] | undefined
}
