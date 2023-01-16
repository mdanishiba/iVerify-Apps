import {
    Body,
    Controller,
    Get,
    HttpException,
    Logger,
    Post,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { StatsService } from '../stats/stats.service';
import { ArticlesService } from './articles.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
    private readonly logger = new Logger('ArticlesController');

    constructor(
        private readonly articlesService: ArticlesService,
        private statsService: StatsService
    ) {}

    @Post('save-article')
    async saveArticle(@Body() body) {
        try {
            const locationId = null;

            const article = body.article;
            this.logger.log('Received request on save article endpoint');
            await this.articlesService.saveOne(article);
            if (article && article.dToxicScore) {
                this.logger.log(
                    'Article has a toxic score; updating detoxify indicators...'
                );
                await this.statsService.addToxicPublishedStats(
                    locationId,
                    article
                );
            }
            return 'ok';
        } catch (e) {
            this.logger.log('Error while saving article...', e.message);
            throw new HttpException(e.message, 500);
        }
    }

    @Get('')
    async getArticles() {
        try {
            return await this.articlesService.getArticles();
        } catch (e) {
            this.logger.log('Error while getting articles...');
            throw new HttpException(e.message, 500);
        }
    }
}
