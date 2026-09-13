import { GetConfigProfilesCommand } from '@xlada/backend-contract'

export interface IProps {
    configProfiles: GetConfigProfilesCommand.Response['response']['configProfiles']
}
