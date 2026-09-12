import { GetUsersCommand } from '@xpanel/backend-contract'

export type User = GetUsersCommand.Response['response']['users'][number]
