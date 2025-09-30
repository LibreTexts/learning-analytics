import vine from '@vinejs/vine'

export const traditionalLoginValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().minLength(6).maxLength(255),
    })
)

export const adaptLoginValidator = vine.compile(
    vine.object({
        token: vine.string(),
    })
)