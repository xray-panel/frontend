import { createQueryKeys } from '@lukemorales/query-key-factory'
import { GetAdminsCommand } from '@xpanel/backend-contract'

import { sToMs } from '@shared/utils/time-utils'

import { createGetQueryHook, errorHandler } from '../../tsq-helpers'

export const adminsQueryKeys = createQueryKeys('admins', {
    get: {
        queryKey: null
    }
})

export const useGetAdmins = createGetQueryHook({
    endpoint: GetAdminsCommand.TSQ_url,
    responseSchema: GetAdminsCommand.ResponseSchema,
    getQueryKey: () => adminsQueryKeys.get.queryKey,
    rQueryParams: {
        refetchOnMount: true,
        staleTime: sToMs(10)
    },
    errorHandler: (error) => errorHandler(error, 'Get Administrators')
})
