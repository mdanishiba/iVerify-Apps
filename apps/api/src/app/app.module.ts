import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { User } from './users/user.model';
import { Roles } from './roles/roles.model';
import { StatsModule } from './stats/stats.module';
import { StatsService } from './stats/stats.service';
import { Stats } from './stats/models/stats.model';
import { StatsFormatService } from './stats/stats-format.service';
import { MeedanCheckClientModule } from '@iverify/meedan-check-client';
import { StatsController } from './stats/stats-controller';
import { ScheduleModule } from '@nestjs/schedule';
import { StatsCronService } from './stats/cron.service';
import { Article } from '@iverify/iverify-common';
import { ArticlesController } from './articles/articles.controller';
import { ArticlesModule } from './articles/articles.module';
import { ArticlesService } from './articles/articles.service';
import { LocationsModule } from './locations/locations.module';
import { LocationsInteceptor } from '../interceptors/locations.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TriageModule } from './triage/triage.module';
import { CheckClientHandlerService } from './checkStatsClientHandler.service';

@Module({
    imports: [
        LocationsModule,
        UsersModule,
        AuthModule,
        RolesModule,
        StatsModule,
        ArticlesModule,
        MeedanCheckClientModule,
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            insecureAuth: true,
            autoLoadEntities: true,
            synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Roles, Stats, Article]),
        TriageModule,
        CacheModule.register({
            isGlobal: true,
        }),
    ],
    controllers: [
        AppController,
        UsersController,
        StatsController,
        ArticlesController,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: LocationsInteceptor,
        },
        AppService,
        UsersService,
        StatsService,
        StatsFormatService,
        StatsCronService,
        ArticlesService,
        CheckClientHandlerService,
    ],
    exports: [CheckClientHandlerService],
})
export class AppModule {}
