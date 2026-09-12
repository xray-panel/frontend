import { useGetLogsStats } from '@shared/api/hooks'
import { LoadingScreen } from '@shared/ui'

import { LogsPageComponent } from '../components/logs.page.component'

export function LogsPageConnector() {
    const { data: stats, isLoading } = useGetLogsStats()

    if (isLoading || !stats) {
        return <LoadingScreen text="Loading logs..." />
    }

    return <LogsPageComponent stats={stats} />
}
