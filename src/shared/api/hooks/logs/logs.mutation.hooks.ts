import { notifications } from '@mantine/notifications'
import { CleanLogsCommand, ClearNodeLogsCommand } from '@xpanel/backend-contract'

import { createMutationHook } from '../../tsq-helpers'

export const useCleanLogs = createMutationHook({
    endpoint: CleanLogsCommand.url,
    bodySchema: CleanLogsCommand.RequestBodySchema,
    responseSchema: CleanLogsCommand.ResponseSchema,
    requestMethod: CleanLogsCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: (data) => {
            const total = data.deleted.reduce(
                (sum: number, item: { deleted: number }) => sum + item.deleted,
                0
            )

            notifications.show({
                title: 'Logs',
                message: `Deleted ${total} records`,
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: 'Clean Logs',
                message:
                    error instanceof Error ? error.message : `Request failed with unknown error.`,
                color: 'red'
            })
        }
    }
})

export const useClearNodeLogs = createMutationHook({
    endpoint: ClearNodeLogsCommand.TSQ_url,
    routeParamsSchema: ClearNodeLogsCommand.RequestParamSchema,
    responseSchema: ClearNodeLogsCommand.ResponseSchema,
    requestMethod: ClearNodeLogsCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: (data, variables) => {
            notifications.show({
                title: 'Node logs',
                message: `Freed ${data.bytesFreed} bytes, removed ${data.removedArchives} archives`,
                color: 'teal'
            })
            void variables
        },
        onError: (error) => {
            notifications.show({
                title: 'Clear node logs',
                message:
                    error instanceof Error ? error.message : `Request failed with unknown error.`,
                color: 'red'
            })
        }
    }
})
