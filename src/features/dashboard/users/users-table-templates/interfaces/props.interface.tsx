/* eslint-disable camelcase */
import { MRT_TableInstance } from '@kastov/mantine-react-table-open'
import { GetUsersCommand } from '@xlada/backend-contract'

export interface IProps {
    table: MRT_TableInstance<GetUsersCommand.Response['response']['users'][0]>
}
