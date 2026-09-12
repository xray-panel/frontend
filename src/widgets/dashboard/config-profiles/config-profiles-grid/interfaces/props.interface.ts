import { GetConfigProfilesCommand } from '@xpanel/backend-contract'

export interface IProps {
    configProfiles: GetConfigProfilesCommand.Response['response']['configProfiles']
}
