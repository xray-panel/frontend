import { createQueryKeys } from '@lukemorales/query-key-factory'
import { GetAuditLogCommand } from '@xlada/backend-contract'

import { sToMs } from '@shared/utils/time-utils'

import { createGetQueryHook, errorHandler } from '../../tsq-helpers'

export const auditLogQueryKeys = createQueryKeys('auditLog', {
    get: {
        queryKey: null
    }
})

export const useGetAuditLog = createGetQueryHook({
    endpoint: GetAuditLogCommand.TSQ_url,
    responseSchema: GetAuditLogCommand.ResponseSchema,
    requestQuerySchema: GetAuditLogCommand.RequestQuerySchema,
    getQueryKey: () => auditLogQueryKeys.get.queryKey,
    rQueryParams: {
        refetchOnMount: true,
        staleTime: sToMs(10)
    },
    errorHandler: (error) => errorHandler(error, 'Get Audit Log')
})
