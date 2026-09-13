import { TFunction } from 'i18next'

export const SWATCHES = [
    'rgb(21, 170, 191)',
    'rgb(167, 139, 250)',
    'rgb(56, 189, 248)',
    'rgb(251, 146, 60)',
    'rgb(52, 211, 153)',
    'rgb(244, 114, 182)',
    'rgb(250, 204, 21)',
    'rgb(239, 68, 68)',
    'rgb(45, 212, 191)',
    'rgb(192, 132, 252)',
    'rgb(251, 191, 36)',
    'rgb(74, 222, 128)',
    'rgb(249, 115, 22)',
    'rgb(236, 72, 153)',
    'rgb(99, 102, 241)',
    'rgb(14, 165, 233)'
]

export type CardSection = 'infra' | 'month' | 'stats'

export const getCardSections = (t: TFunction): { label: string; value: CardSection }[] => [
    { label: t('header.recap.section-nodes-traffic'), value: 'stats' },
    { label: t('header.recap.section-this-month'), value: 'month' },
    { label: t('header.recap.infrastructure'), value: 'infra' }
]

export const DEFAULT_SECTIONS: CardSection[] = ['stats', 'month', 'infra']

export type BgStyle = 'dots' | 'gradient' | 'grid' | 'solid'

export const getBgStyles = (t: TFunction): { label: string; value: BgStyle }[] => [
    { label: t('header.recap.bg-solid'), value: 'solid' },
    { label: t('header.recap.bg-gradient'), value: 'gradient' },
    { label: t('header.recap.bg-dots'), value: 'dots' },
    { label: t('header.recap.bg-grid'), value: 'grid' }
]

export type MaskableField =
    | 'countries'
    | 'cpuCores'
    | 'monthTraffic'
    | 'monthUsers'
    | 'nodes'
    | 'ram'
    | 'totalTraffic'
    | 'totalUsers'

export const getMaskableFields = (t: TFunction): { label: string; value: MaskableField }[] => [
    { label: t('header.recap.field-users'), value: 'totalUsers' },
    { label: t('header.recap.field-nodes'), value: 'nodes' },
    { label: t('header.recap.field-traffic'), value: 'totalTraffic' },
    { label: t('header.recap.field-new-users'), value: 'monthUsers' },
    { label: t('header.recap.field-month-traffic'), value: 'monthTraffic' },
    { label: t('header.recap.field-countries'), value: 'countries' },
    { label: t('header.recap.field-cpu-cores'), value: 'cpuCores' },
    // Аббревиатура RAM — технический термин, не переводится.
    { label: 'RAM', value: 'ram' }
]
