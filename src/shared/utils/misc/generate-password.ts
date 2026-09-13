// Генератор стойкого пароля для форм администратора.
//
// Требования серверной политики: не короче 24 символов, обязательно хотя бы одна
// заглавная буква, одна строчная и одна цифра. Поэтому берём длину 32–40, явно
// добавляем по одному символу каждого класса, добираем остаток из общего
// алфавита и перемешиваем. Алфавит — латиница, цифры и безопасные символы: без
// кавычек и обратного слэша, чтобы пароль легко копировался и вставлялся.

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/'

const ALL_CHARACTERS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS

const MIN_LENGTH = 32
const MAX_LENGTH = 40

// Криптографически стойкое целое в диапазоне [0, max) без модульного смещения:
// часть значений отбрасываем, чтобы все остатки были равновероятны.
function randomInt(max: number): number {
    const limit = Math.floor(0x100000000 / max) * max
    const buffer = new Uint32Array(1)

    let value = limit
    while (value >= limit) {
        crypto.getRandomValues(buffer)
        value = buffer[0] ?? 0
    }

    return value % max
}

function randomCharacter(alphabet: string): string {
    return alphabet.charAt(randomInt(alphabet.length))
}

export function generatePassword(): string {
    const length = MIN_LENGTH + randomInt(MAX_LENGTH - MIN_LENGTH + 1)

    // Гарантированный состав: по одному символу каждого обязательного класса.
    const characters = [
        randomCharacter(UPPERCASE),
        randomCharacter(LOWERCASE),
        randomCharacter(DIGITS)
    ]

    while (characters.length < length) {
        characters.push(randomCharacter(ALL_CHARACTERS))
    }

    // Перемешивание Фишера—Йетса, чтобы обязательные символы не стояли в начале.
    for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(index + 1)
        const current = characters[index]
        characters[index] = characters[swapIndex]
        characters[swapIndex] = current
    }

    return characters.join('')
}
