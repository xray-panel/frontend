import { GetNodeCommand } from '@xlada/backend-contract'

export interface IProps {
    handleClose: () => void
    node: GetNodeCommand.Response['response']
}
