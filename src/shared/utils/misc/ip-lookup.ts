/**
 * Внешняя проверка IP-адреса и автономной системы (AS).
 *
 * XLADA по умолчанию НЕ отправляет адреса пользователей третьим сторонам:
 * шаблоны пусты, поэтому ссылки проверки не отображаются.
 *
 * Раньше адрес `https://ipinfo.io/<ip>` был зашит в двенадцати местах
 * интерфейса. Клик по такой ссылке уводил IP-адрес пользователя (в том числе
 * из журналов подключений и HWID-устройств) на сторонний сервис, не связанный
 * с XLADA.
 *
 * Если администратор сознательно хочет проверку, он задаёт шаблоны, например
 * 'https://ipinfo.io/{ip}' и 'https://ipinfo.io/AS{as}'. Тогда адреса будут
 * уходить на указанный сервис — это осознанный выбор, а не поведение по
 * умолчанию.
 */
const IP_LOOKUP_TEMPLATE = ''
const AS_LOOKUP_TEMPLATE = ''

export const isIpLookupEnabled = IP_LOOKUP_TEMPLATE.length > 0
export const isAsLookupEnabled = AS_LOOKUP_TEMPLATE.length > 0

/**
 * Возвращает адрес проверки IP или null, если проверка отключена либо адрес
 * не задан. Все места интерфейса должны трактовать null как «ссылки нет».
 */
export const buildIpLookupUrl = (ip: null | string | undefined): null | string => {
    if (!isIpLookupEnabled || !ip) {
        return null
    }

    return IP_LOOKUP_TEMPLATE.replace('{ip}', encodeURIComponent(ip.trim()))
}

/**
 * То же для номера автономной системы. Номер приходит числом либо строкой
 * вида 'AS12345' — приводим к цифрам, чтобы шаблон не сломался.
 */
export const buildAsLookupUrl = (asn: null | number | string | undefined): null | string => {
    if (!isAsLookupEnabled || asn === null || asn === undefined) {
        return null
    }

    const digits = String(asn).replace(/\D/g, '')

    if (digits.length === 0) {
        return null
    }

    return AS_LOOKUP_TEMPLATE.replace('{as}', digits)
}
