import { GetSnippetsCommand } from '@xpanel/backend-contract'

export type TSnippet = GetSnippetsCommand.Response['response']['snippets'][number]
