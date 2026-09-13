import { GetUsersCommand } from '@xlada/backend-contract'

export type User = GetUsersCommand.Response['response']['users'][number]
