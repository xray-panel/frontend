import { GetNodeCommand } from '@xpanel/backend-contract'

export interface IProps {
    handleClose: () => void
    node: GetNodeCommand.Response['response']
}
