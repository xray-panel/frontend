import { GetSubpageConfigsCommand } from '@xpanel/backend-contract'

export interface IProps {
    configs: GetSubpageConfigsCommand.Response['response']['configs']
}
