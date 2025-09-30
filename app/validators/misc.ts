import vine from "@vinejs/vine"

export const IDWithTextValidator = vine.object({
    id: vine.string(),
    text: vine.string()
})

export const IDWithNameValidator = vine.object({
    id: vine.string(),
    name: vine.string()
})