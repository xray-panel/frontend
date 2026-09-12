import { createQueryKeys } from '@lukemorales/query-key-factory'
import { GetLogsStatsCommand } from '@xpanel/backend-contract'

import { sToMs } from '@shared/utils/time-utils'

import { createGetQueryHook, errorHandler } from '../../tsq-helpers'

export const logsQueryKeys = createQueryKeys('logs', {
    getStats: {
        queryKey: null
    }
})

export const useGetLogsStats = createGetQueryHook({
    endpoint: GetLogsStatsCommand.TSQ_url,
    responseSchema: GetLogsStatsCommand.ResponseSchema,
    getQueryKey: () => logsQueryKeys.getStats.queryKey,
    rQueryParams: {
        refetchOnMount: true,
        staleTime: sToMs(10)
    },
    errorHandler: (error) => errorHandler(error, 'Get Logs Stats')
})
