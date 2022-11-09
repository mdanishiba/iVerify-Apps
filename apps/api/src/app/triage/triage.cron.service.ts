import { ApiClientService } from '@iverify/api-client/src';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';
import { TriageService } from './triage.service';
// import { AppService } from './app.service';

@Injectable()
export class TriageCronService {
    private readonly logger = new Logger(TriageCronService.name);

    constructor(
        // private appService: AppService,
        private triageService: TriageService,
        private apiClient: ApiClientService
    ) {}

    // @Timeout(5000)
    // async handleTimeout(){
    //     const endDate = new Date().toISOString();
    //     const start = new Date();
    //     start.setHours(new Date().getHours() -1);
    //     const startDate = start.toISOString();
    //     this.logger.log(`Running initial job with startDate ${startDate} and endDate ${endDate}`)
    //     return await this.analyze(startDate, endDate);
    // }

    @Cron(CronExpression.EVERY_2_HOURS)
    async handleCron() {
        const endDate = new Date().toISOString();
        const start = new Date();
        start.setHours(new Date().getHours() - 2);
        const startDate = start.toISOString();
        this.logger.log(
            `Running cron job with startDate ${startDate} and endDate ${endDate}`
        );
        return await this.analyze(startDate, endDate);
    }

    async analyze(startDate, endDate) {
        try {
            const created: number = await this.triageService.analyze(
                startDate,
                endDate
            );
            this.logger.log('Items created: ', created);
            return await lastValueFrom(this.apiClient.postToxicStats(created));
        } catch (e) {
            this.logger.error('Cron job error: ', e.message);
            throw new HttpException(e.message, 500);
        }
    }
}
