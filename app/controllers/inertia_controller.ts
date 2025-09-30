import type { HttpContext } from '@adonisjs/core/http'

export default class InertiaController {
    public async home({ inertia }: HttpContext) {
        return inertia.render('home')
    }

    public async login({ inertia }: HttpContext) {
        return inertia.render('login')
    }

    public async courseSettings({ inertia }: HttpContext) {
        return inertia.render('course-settings')
    }

    public async earlyWarning({ inertia }: HttpContext) {
        return inertia.render('early-warning')
    }

    public async learningObjectives({ inertia }: HttpContext) {
        return inertia.render('learning-objectives')
    }

    public async learningCurves({ inertia }: HttpContext) {
        return inertia.render('learning-curves')
    }

    public async rawData({ inertia }: HttpContext) {
        return inertia.render('raw-data')
    }
}
