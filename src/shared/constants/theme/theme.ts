import { createTheme } from '@mantine/core'

import { variantColorResolver } from './colors-resolver'
import components from './overrides'

export const theme = createTheme({
    variantColorResolver,
    components,
    cursorType: 'pointer',
    fontFamily:
        'Montserrat, Vazirmatn, Apple Color Emoji, Noto Sans SC, Twemoji Country Flags, sans-serif',
    fontFamilyMonospace: 'Fira Mono, monospace',
    breakpoints: {
        xs: '30em',
        sm: '40em',
        md: '48em',
        lg: '64em',
        xl: '80em',
        '2xl': '96em',
        '3xl': '120em',
        '4xl': '160em'
    },

    scale: 1,
    fontSmoothing: true,
    focusRing: 'never',
    white: '#ffffff',
    black: '#24292f',
    colors: {
        // Основной акцент XPANEL. Спокойный синий вместо яркого cyan:
        // на светлом фоне он читается как рабочий инструмент, а не как
        // рекламный баннер, и не утомляет при долгой работе.
        brand: [
            '#eef1ff',
            '#dbe0ff',
            '#b9c2ff',
            '#94a1ff',
            '#7485fb',
            '#6072f8',
            '#4154f1',
            '#3243d6',
            '#2434b0',
            '#15228a'
        ],
        dark: [
            '#c9d1d9',
            '#b1bac4',
            '#8b949e',
            '#6e7681',
            '#484f58',
            '#30363d',
            '#21262d',
            '#161b22',
            '#0d1117',
            '#010409'
        ],
        'shaded-gray': [
            '#f5f5f5',
            '#e8e8e8',
            '#d4d4d4',
            '#c0c0c0',
            '#a8a8a8',
            '#a0a0a0',
            '#808080',
            '#686868',
            '#505050',
            '#383838'
        ]
    },
    // Разные оттенки для схем: на светлом фоне акцент должен быть темнее,
    // иначе текст на нём не даёт нужного контраста.
    primaryShade: { light: 6, dark: 5 },
    primaryColor: 'brand',
    autoContrast: true,
    luminanceThreshold: 0.3,
    headings: {
        fontWeight: '600'
    },
    defaultRadius: 'md',
    // Тени мягче и незаметнее: на светлом фоне резкие тени выглядят грязно.
    shadows: {
        xs: '0 1px 2px rgba(16, 24, 40, 0.04)',
        sm: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        md: '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        lg: '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
        xl: '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)'
    }
})
