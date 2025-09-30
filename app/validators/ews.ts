import vine from "@vinejs/vine";

export const getCourseEWSResultsValidator = vine.compile(
    vine.object({
        params: vine.object({
            course_id: vine.string(),
        }),
        privacy_mode: vine.boolean().optional()
    })
)


export const ewsWebhookValidator = vine.compile(
    vine.object({
        state: vine.enum(['error', 'success']),
        course_id: vine.string(),
        predictions: vine.record(vine.number()).optional()
    })
)
