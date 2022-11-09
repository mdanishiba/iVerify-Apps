import { Module } from '@nestjs/common';

import { CrowdtangleClientModule } from '@iverify/crowdtangle-client';
import { MlServiceClientModule } from '@iverify/ml-service-client';
import { MeedanCheckClientModule } from '@iverify/meedan-check-client';
import { HttpModule } from '@nestjs/axios';

import { PerspectiveClientModule } from '@iverify/perspective-client/src';

import { ApiClientModule, ApiClientService } from '@iverify/api-client/src';
import { ScheduleModule } from '@nestjs/schedule';
import { TriageConfig } from './config';
import { TriageCronService } from './triage.cron.service';
import { TriageController } from './triage.controller';
import { TriageService } from './triage.service';

@Module({
    imports: [
        HttpModule,
        CrowdtangleClientModule,
        MlServiceClientModule,
        PerspectiveClientModule,
        MeedanCheckClientModule,
        ApiClientModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [TriageController],
    providers: [
        TriageConfig,
        TriageCronService,
        TriageService,
        // TranslateService
    ],
    exports: [TriageService],
})
export class TriageModule {}
