import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

export interface IRemnawaveInfo {
    latestVersion: string
    starsCount: number
}

interface IState {
    isLoading: boolean
    lastUpdateTimestamp: number
    remnawaveInfo: IRemnawaveInfo
}

interface IActions {
    actions: {
        getRemnawaveInfo: () => Promise<void>
        resetState: () => void
        setRemnawaveInfo: (info: IRemnawaveInfo) => void
    }
}

const initialState: IState = {
    isLoading: false,
    lastUpdateTimestamp: 0,
    remnawaveInfo: {
        // Пустая версия трактуется потребителями как «обновлений нет»
        // (VersionControl подставляет '0.0.0'), а starsCount = 0 превращается
        // в undefined и не отображается.
        latestVersion: '',
        starsCount: 0
    }
}

/**
 * XLADA: внешняя проверка обновлений удалена.
 *
 * Раньше это хранилище при каждом входе администратора обращалось к
 * https://ungh.cc за числом звёзд и последним релизом апстрима. Это
 * отправляло данные о вашей панели третьей стороне, не связанной с XLADA.
 *
 * Экшен сохранён, чтобы не менять точки вызова, но теперь ничего не делает.
 * Если понадобится проверка обновлений, её следует направлять на собственный
 * репозиторий XLADA, а не на инфраструктуру вендора.
 */
export const useUpdatesStore = create<IActions & IState>()(
    persist(
        devtools(
            (set, get) => ({
                ...initialState,
                actions: {
                    getRemnawaveInfo: async () => {
                        // Намеренно пусто: внешних запросов нет.
                        void get()
                        return
                    },

                    setRemnawaveInfo: (info: IRemnawaveInfo) => {
                        set({ remnawaveInfo: info, lastUpdateTimestamp: Date.now() })
                    },
                    resetState: () => {
                        set({ ...initialState })
                    }
                }
            }),
            { name: 'updatesStore', anonymousActionType: 'updatesStore' }
        ),
        {
            name: 'updatesStore',
            storage: createJSONStorage(() => localStorage),
            version: 2,
            partialize: (state) => ({
                lastUpdateTimestamp: state.lastUpdateTimestamp,
                remnawaveInfo: state.remnawaveInfo
            })
        }
    )
)

export const useRemnawaveInfo = () => useUpdatesStore((state) => state.remnawaveInfo)
export const useLastUpdateTimestamp = () => useUpdatesStore((state) => state.lastUpdateTimestamp)
export const useIsLoadingRemnawaveUpdates = () => useUpdatesStore((state) => state.isLoading)
export const useUpdatesStoreActions = () => useUpdatesStore((state) => state.actions)
