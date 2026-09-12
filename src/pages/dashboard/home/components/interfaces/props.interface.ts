import {
    GetBandwidthStatsCommand,
    GetRemnawaveHealthCommand,
    GetStatsCommand
} from '@xpanel/backend-contract'

export interface IProps {
    bandwidthStats: GetBandwidthStatsCommand.Response['response']
    remnawaveHealth: GetRemnawaveHealthCommand.Response['response']
    systemInfo: GetStatsCommand.Response['response']
}
