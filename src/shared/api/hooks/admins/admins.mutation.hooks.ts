import { notifications } from '@mantine/notifications'
import {
    CreateAdminCommand,
    DeleteAdminCommand,
    UpdateAdminCommand
} from '@xlada/backend-contract'

import { createMutationHook } from '../../tsq-helpers'

// Уведомления здесь, а обновление списка — в компоненте через refetch():
// так же устроены остальные разделы панели.
export const useCreateAdmin = createMutationHook({
    endpoint: CreateAdminCommand.TSQ_url,
    bodySchema: CreateAdminCommand.RequestBodySchema,
    responseSchema: CreateAdminCommand.ResponseSchema,
    requestMethod: CreateAdminCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: () => {
            notifications.show({
                title: 'Success',
                message: 'Administrator created successfully',
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: 'Create Administrator',
                message:
                    error instanceof Error ? error.message : 'Request failed with unknown error.',
                color: 'red'
            })
        }
    }
})

export const useUpdateAdmin = createMutationHook({
    endpoint: UpdateAdminCommand.TSQ_url,
    routeParamsSchema: UpdateAdminCommand.RequestParamSchema,
    bodySchema: UpdateAdminCommand.RequestBodySchema,
    responseSchema: UpdateAdminCommand.ResponseSchema,
    requestMethod: UpdateAdminCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: () => {
            notifications.show({
                title: 'Success',
                message: 'Password changed successfully',
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: 'Change Password',
                message:
                    error instanceof Error ? error.message : 'Request failed with unknown error.',
                color: 'red'
            })
        }
    }
})

export const useDeleteAdmin = createMutationHook({
    endpoint: DeleteAdminCommand.TSQ_url,
    routeParamsSchema: DeleteAdminCommand.RequestParamSchema,
    responseSchema: DeleteAdminCommand.ResponseSchema,
    requestMethod: DeleteAdminCommand.endpointDetails.REQUEST_METHOD,
    rMutationParams: {
        onSuccess: () => {
            notifications.show({
                title: 'Success',
                message: 'Administrator deleted successfully',
                color: 'teal'
            })
        },
        onError: (error) => {
            notifications.show({
                title: 'Delete Administrator',
                message:
                    error instanceof Error ? error.message : 'Request failed with unknown error.',
                color: 'red'
            })
        }
    }
})
