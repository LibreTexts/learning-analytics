import { AnalyticsService } from '#services/analytics_service'
import { getCourseRawDataValidator, getCourseValidator, getStudentsValidator, updateCourseAnalyticsSettingsValidator } from '#validators/course'
import type { HttpContext } from '@adonisjs/core/http'

export default class CoursesController {
    async getCourse({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const finalGradesReleased = await analytics.checkFinalGradesReleased()

        return response.status(200).send({
            id: payload.params.id,
            final_grades_released: finalGradesReleased
        })
    }

    async getCourseFrameworkData({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.getCourseFrameworkData()

        return response.status(200).send({ data })
    }

    async getCourseAnalyticsSettings({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.getCourseAnalyticsSettings()
        return response.status(200).send({ data })
    }

    async updateCourseAnalyticsSettings({ request, response }: HttpContext) {
        const payload = await request.validateUsing(updateCourseAnalyticsSettingsValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.updateCourseAnalyticsSettings(payload)
        return response.status(200).send({ data })
    }

    async getCourseAssignments({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.getAssignments()
        return response.status(200).send({ data })
    }

    async getCourseRawData({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseRawDataValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.getRawData(payload.privacy_mode || false)
        return response.status(200).send({ data })
    }

    async getHasData({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const hasData = await analytics.checkHasData()
        return response.status(200).send({ hasData })
    }

    async getStudents({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getStudentsValidator)

        const analytics = new AnalyticsService(payload.params.id)
        const data = await analytics.getStudents(payload.page, payload.limit, payload.privacy_mode)
        return response.status(200).send({ data })
    }
}