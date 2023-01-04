import { ApiClientModule } from '@iverify/api-client';
import { Article } from '@iverify/iverify-common/src';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesModule } from '../../app/articles/articles.module';
import { ArticlesService } from '../../app/articles/articles.service';
import { SharedModule } from '../shared/shared.module';
import { ApiPublisherService } from './api-publisher.service';
import { ApiPublisherHelper } from './helper';

@Module({
    imports: [
        TypeOrmModule.forFeature([Article]),
        HttpModule,
        SharedModule,
        ApiClientModule,
        ArticlesModule,
    ],
    providers: [ApiPublisherService, ApiPublisherHelper, ArticlesService],
    exports: [ApiPublisherService],
})
export class ApiPublisherModule {}
