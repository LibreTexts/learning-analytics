import { EarlyWarningSystemService } from '#services/early_warning_system_service';
import { ewsWebhookValidator, getCourseEWSResultsValidator } from '#validators/ews'
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger';

@inject()
export default class EarlyWarningSystemsController {
    constructor(private ewsService: EarlyWarningSystemService) { }

    public async results({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getCourseEWSResultsValidator);

        const results = await this.ewsService.getEWSResults(
            payload.params.course_id,
            payload.privacy_mode ?? false
        );

        return response.json({ data: results });
    }

    public async update({ response }: HttpContext) {
        this.ewsService.updateEWSData(); // Run in background

        return response.status(200).send({ message: 'EWS update initiated. Check the logs for progress.' });
    }

    public async webhook({ request, response }: HttpContext) {
        const payload = await request.validateUsing(ewsWebhookValidator);

        if (payload.state === 'error') {
            logger.error(`[EWS Webhook] Error reported for course ${payload.course_id}`);
            return response.status(200).send({ message: 'Error state received. Logged.' });
        }

        const predictions = payload.predictions || {};

        await this.ewsService.updateEWSPredictions(payload.course_id, predictions);

        return response.status(200).send({ success: true, message: 'EWS predictions updated successfully.' });
    }
}