import { GetConfigProfilesCommand } from '@xlada/backend-contract'

export interface Props {
    configProfiles: GetConfigProfilesCommand.Response['response']['configProfiles']
}
