import { createQueryKeys } from '@lukemorales/query-key-factory'
import { GetTwoFactorStatusCommand } from '@xlada/backend-contract'

import { sToMs } from '@shared/utils/time-utils'

import { createGetQueryHook, errorHandler } from '../../tsq-helpers'

export const twoFactorQueryKeys = createQueryKeys('two-factor', {
    status: {
        queryKey: null
    }
})

export const useGetTwoFactorStatus = createGetQueryHook({
    endpoint: GetTwoFactorStatusCommand.TSQ_url,
    responseSchema: GetTwoFactorStatusCommand.ResponseSchema,
    getQueryKey: () => twoFactorQueryKeys.status.queryKey,
    rQueryParams: {
        refetchOnMount: true,
        staleTime: sToMs(10)
    },
    errorHandler: (error) => errorHandler(error, 'Get Two-Factor Status')
})
