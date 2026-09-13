import { renderSVG } from 'uqr'

/**
 * Рендерит QR-код в SVG с явными размерами.
 *
 * renderSVG из uqr возвращает корневой тег только с viewBox, без width/height.
 * Такой SVG не имеет собственного размера и внутри flex-контейнера с
 * font-size: 0; line-height: 0 схлопывается в нулевую область, поэтому QR
 * не виден. Подставляем width и height в корневой тег явно.
 */
export const renderQrSvg = (value: string, size: number = 220): string => {
    const svg = renderSVG(value, { whiteColor: '#ffffff', blackColor: '#000000' })

    return svg.replace(/^<svg(?![^>]*\swidth=)/, `<svg width="${size}" height="${size}"`)
}
