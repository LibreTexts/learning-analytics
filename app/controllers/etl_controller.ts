import { DataCollectorService } from '#services/data_collector_service'
import { DataProcessorService } from '#services/data_processor_service'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class EtlController {
    async processData({ response }: HttpContext) {
        try {
            const adp = new DataProcessorService()
            adp.runProcessors(); // Don't await this, let it run in the background
            return response.status(200).send({ message: 'Data processing initiated. Check the logs for progress.' })
        } catch (error) {
            logger.error(error)
            return response.status(500).send({ error: 'An error occurred while processing data.' })
        }
    }

    async runCollectors({ response }: HttpContext) {
        try {
            const adc = new DataCollectorService()
            adc.runCollectors(); // Don't await this, let it run in the background
            return response.status(200).send({ message: 'Data collection initiated. Check the logs for progress.' })
        } catch (error) {
            logger.error(error)
            return response.status(500).send({ error: 'An error occurred while running collectors.' })
        }
    }
}