import { GetSnippetsCommand } from '@xlada/backend-contract'

export type TSnippet = GetSnippetsCommand.Response['response']['snippets'][number]
