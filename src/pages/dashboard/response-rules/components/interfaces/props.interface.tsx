import { GetConfigProfilesCommand } from '@xpanel/backend-contract'

export interface Props {
    configProfiles: GetConfigProfilesCommand.Response['response']['configProfiles']
}
