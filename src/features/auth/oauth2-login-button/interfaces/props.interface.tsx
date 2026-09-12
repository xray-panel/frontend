import { GetStatusCommand } from '@xpanel/backend-contract'

export interface IProps {
    authentication: NonNullable<GetStatusCommand.Response['response']['authentication']>
}
