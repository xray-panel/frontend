import { GetSubpageConfigsCommand } from '@xlada/backend-contract'

export interface IProps {
    configs: GetSubpageConfigsCommand.Response['response']['configs']
}
