import { v8CssVariablesResolver } from '@mantine/core'

/**
 * Мост тёмной палитры в светлую схему.
 *
 * Интерфейс писался под тёмную тему, и 54 файла используют переменные
 * `--mantine-color-dark-N` как цвета поверхностей, фонов и рамок. На светлой
 * схеме они дают тёмные блоки — визуально это выглядит сломанным.
 *
 * Переписывать эти файлы по одному долго и рискованно. Mantine позволяет
 * задать значения переменных отдельно для каждой схемы, поэтому здесь
 * тёмная палитра переназначается на нейтральные серые оттенки — только для
 * светлой схемы. Тёмная тема при этом не затрагивается.
 *
 * Соответствие подобрано по смыслу: чем темнее был оттенок в тёмной теме,
 * тем он был «глубже» как фон, поэтому в светлой он становится светлее.
 * Исключение — оттенки 3 и ниже: они использовались для приглушённого текста
 * и границ, поэтому им достаются серые, а не почти белые значения.
 */
const DARK_TO_LIGHT: Record<string, string> = {
    '--mantine-color-dark-9': '#ffffff', // самый глубокий фон -> чистый лист
    '--mantine-color-dark-8': '#ffffff', // фон страницы
    '--mantine-color-dark-7': '#ffffff', // фон карточек
    '--mantine-color-dark-6': 'var(--mantine-color-gray-1)', // поверхности, заголовки таблиц
    '--mantine-color-dark-5': 'var(--mantine-color-gray-2)', // наведение, второстепенные фоны
    '--mantine-color-dark-4': 'var(--mantine-color-gray-3)', // границы
    '--mantine-color-dark-3': 'var(--mantine-color-gray-4)', // границы потемнее
    '--mantine-color-dark-2': 'var(--mantine-color-gray-6)', // приглушённый текст
    '--mantine-color-dark-1': 'var(--mantine-color-gray-7)', // текст
    '--mantine-color-dark-0': 'var(--mantine-color-gray-8)' // основной текст
}

export const cssVariablesResolver = (theme: Parameters<typeof v8CssVariablesResolver>[0]) => {
    const base = v8CssVariablesResolver(theme)

    return {
        ...base,
        light: {
            ...base.light,
            ...DARK_TO_LIGHT
        }
    }
}
