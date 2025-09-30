import vine from '@vinejs/vine'
import { IDWithNameValidator, IDWithTextValidator } from './misc.js'

export const getCourseValidator = vine.compile(
    vine.object({
        params: vine.object({
            id: vine.string(),
        })
    })
)

export const getCourseRawDataValidator = vine.compile(
    vine.object({
        params: vine.object({
            id: vine.string(),
        }),
        privacy_mode: vine.boolean().optional()
    })
)

export const updateCourseAnalyticsSettingsValidator = vine.compile(
    vine.object({
        params: vine.object({
            id: vine.string(),
        }),
        shareGradeDistribution: vine.boolean(),
        frameworkExclusions: vine.array(IDWithTextValidator).optional(),
        assignmentExclusions: vine.array(IDWithNameValidator).optional(),
    })
)

export const getStudentsValidator = vine.compile(
    vine.object({
        params: vine.object({
            id: vine.string(),
        }),
        page: vine.number().optional(),
        limit: vine.number().optional(),
        privacy_mode: vine.boolean().optional(),
    })
)