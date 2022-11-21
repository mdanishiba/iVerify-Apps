import { HttpException, Injectable, Logger, Scope } from '@nestjs/common';
import { CreateCategoryDto } from '@iverify/wp-client/src/lib/interfaces/create-category.dto';
import { CreateTagDto } from '@iverify/wp-client/src/lib/interfaces/create-tag.dto';
import { WpClientService } from '@iverify/wp-client/src/lib/wp-client.service';
import { combineLatest, from, iif, Observable, of, Subject } from 'rxjs';
import {
    catchError,
    concatMap,
    filter,
    map,
    reduce,
    shareReplay,
    switchMap,
    take,
    tap,
    withLatestFrom,
} from 'rxjs/operators';
import { SharedService } from '../shared/shared.service';
import { WpPublisherHelper } from './wp-publisher-helper.service';
import { HttpService } from '@nestjs/axios';
import { WpClientHandler } from '../../app/handlers/wpClientHandler.service';
import { LocationsService } from '../../app/locations/locations.service';

@Injectable()
export class WpPublisherService {
    private logger = new Logger(WpPublisherService.name);

    private reportId$: Observable<string> = this.shared.reportId$;

    private _locationId: Subject<string> = new Subject<string>();

    private report$: Observable<any> = this.shared.report$.pipe(
        tap((report) => this.logger.log('Report: ', JSON.stringify(report)))
    );

    locationId$: Observable<string> = this._locationId
        .asObservable()
        .pipe(take(1), shareReplay(1));

    private meedanReport$: Observable<any> = this.shared.meedanReport$.pipe(
        tap((report) =>
            this.logger.log('Meedan report: ', JSON.stringify(report))
        )
    );

    wpPostId$: Observable<number> = combineLatest([
        this.reportId$,
        this.locationId$,
    ]).pipe(
        map(([reportId, locationId]) => ({ reportId, locationId })),
        switchMap((data: any) =>
            this.wpClient.getPostByCheckId(data.locationId, data.reportId)
        ),
        map((res) => (res && res.length ? res[0].id : null))
    );

    language$: Observable<string> = this.locationId$.pipe(
        switchMap((locationId) => this.locationsService.findById(locationId)),
        map(({ params }) => {
            const getParam: any = (param) =>
                params.find(({ key }) => key === param);

            const language = getParam('LANGUAGE')?.value;

            return language;
        })
    );

    categoriesIds$: Observable<number[]> = combineLatest([
        this.report$,
        this.locationId$,
    ]).pipe(
        map(([report, locationId]) => ({
            ...this.helper.extractFactcheckingStatus(report),
            locationId,
        })),
        switchMap((data) =>
            this.categoriesIds(data.locationId, [data.category])
        ),
        catchError((err) => {
            throw new HttpException(err.message, 500);
        })
    );

    tagsIds$: Observable<number[]> = combineLatest([
        this.report$,
        this.locationId$,
    ]).pipe(
        map(([report, locationId]) => ({
            ...this.helper.extractTags(report),
            locationId,
        })),
        switchMap((data: any) =>
            iif(
                () => !!data.tags && !!data.tags.length,
                this.tagsIds(data.locationId, data.tags),
                of(null)
            )
        ),
        catchError((err) => {
            throw new HttpException(err.message, 500);
        })
    );

    private mediaId$: Observable<number> = this.meedanReport$.pipe(
        map((report) => report.image),
        switchMap((url) => this.http.get(url, { responseType: 'arraybuffer' })),
        map((res) => Buffer.from(res.data, 'binary')),
        withLatestFrom(this.locationId$),
        map(([binary, locationId]) => ({ binary, locationId })),
        switchMap((data) =>
            this.wpClient.createMedia(data.locationId, data.binary)
        ),
        map((res) => res['id']),
        catchError((err) => {
            return of(null);
            // throw new HttpException(err.message, 500);
        })
    );

    private author$: Observable<number> = this.locationId$.pipe(
        switchMap((locationId) => this.wpClient.getAppUser(locationId)),
        map((user) => user.id),
        catchError((err) => {
            throw new HttpException(err.message, 500);
        })
    );

    private visualCard$: Observable<string> = this.meedanReport$.pipe(
        map((report) => report.visual_card_url),
        catchError((err) => {
            return of(null);
            // throw new HttpException(err.message, 500);
        })
    );

    post$: Observable<any> = combineLatest([
        this.report$,
        this.meedanReport$,
        this.author$,
        this.mediaId$,
        this.tagsIds$,
        this.categoriesIds$,
        this.visualCard$,
        this.language$,
    ]).pipe(
        map(
            ([
                report,
                meedanReport,
                author,
                media,
                tags,
                categories,
                visualCard,
                language,
            ]) =>
                this.helper.buildPostFromReport(
                    report,
                    meedanReport,
                    author,
                    media,
                    tags,
                    categories,
                    visualCard,
                    language
                )
        ),
        filter((post) => !!post.title.length),
        take(1),
        tap((postDto) =>
            this.logger.log(
                'sending to WP publication: ',
                JSON.stringify(postDto)
            )
        ),
        withLatestFrom(this.wpPostId$),
        map(([postDto, wpPostId]) => ({ postDto, wpPostId })),
        withLatestFrom(this.locationId$),
        map(([{ postDto, wpPostId }, locationId]) => ({
            postDto,
            wpPostId,
            locationId,
        })),
        switchMap((data) =>
            this.wpClient.publishPost(
                data.locationId,
                data.postDto,
                data.wpPostId
            )
        ),
        withLatestFrom(this.locationId$),
        map(([post, locationId]) => ({ post: { ...post }, locationId })),
        tap(([wpPost, locationId]) =>
            this.shared.updateWpPost(locationId, wpPost)
        ),
        catchError((err) => {
            throw new HttpException(err.message, 500);
        })
    );

    constructor(
        private http: HttpService,
        private shared: SharedService,
        private wpClient: WpClientHandler,
        private helper: WpPublisherHelper,
        private locationsService: LocationsService
    ) {}

    private tagsIds(locationId: string, tags: string[]): Observable<number[]> {
        const tagsIds$: Observable<number[]> = of(tags).pipe(
            switchMap((tags) =>
                iif(
                    () => !!tags.length,
                    this.createManyTags(locationId, tags),
                    of([])
                )
            )
        );

        // const tagsLowCase = tags.map(tag => tag.toLowerCase());
        // console.log('tags: ', tagsLowCase)
        // const wpTags$: Observable<any> = this.wpClient.listTags().pipe(
        //   take(1),
        //   shareReplay(1)
        // );
        // const existingTagsIds$: Observable<number[]> = wpTags$.pipe(
        //   map(wpTags => wpTags.filter(tag => tagsLowCase.indexOf(tag.name.toLowerCase()) > -1).map(tag => {
        //     console.log('existing tag name: ', tag.name.toLowerCase())
        //     return tag.id
        //   })),
        //   );
        // const newTags$: Observable<string[]> = wpTags$.pipe(
        //   map(wpTags => wpTags.map(tag => tag.name.toLowerCase() as string)),
        //   tap(wpTags => console.log('wpTags: ', wpTags)),
        //   map(wpTags => tags.filter(tag => wpTags.indexOf(tag.toLowerCase()) === -1)),
        //   tap(wpTags => console.log('new tags: ', wpTags)),

        // )
        // const newTagsIds$: Observable<number[]> = newTags$.pipe(
        //   switchMap(tags => iif(()=> !!tags.length, this.createManyTags(tags).pipe(map(tag => [tag.id])), of([]))),
        //   reduce((acc, val) => [...acc, ...val], [])
        // )
        // const tagsIds$: Observable<number[]> = combineLatest([existingTagsIds$, newTagsIds$]).pipe(
        //   map(([existingIds, newIds]) => [...existingIds, ...newIds]),
        //   catchError(err => {
        //     throw new HttpException(err.message, 500);
        //   })
        // )

        return tagsIds$;
    }

    private categoriesIds(locationId: string, categories: string[]) {
        categories = categories.map((c) => c.toLowerCase());
        const wpCategories$: Observable<any> =
            this.wpClient.listCategories(locationId);
        const existingCategoriesIds$: Observable<number[]> = wpCategories$.pipe(
            map((wpCategories) =>
                wpCategories
                    .filter(
                        (category) =>
                            categories.indexOf(category.name.toLowerCase()) > -1
                    )
                    .map((category) => category.id)
            )
        );
        // const newCategories$: Observable<string[]> = wpCategories$.pipe(
        //   map(wpCategories => wpCategories.map(category => category.name as string)),
        //   map(wpCategories => categories.filter(category => wpCategories.indexOf(category) === -1))
        // )
        // const newCategoriesIds$: Observable<number[]> = newCategories$.pipe(
        //   switchMap(categories => iif(()=> !!categories.length, this.createManyCategories(categories).pipe(map(category => [category.id])), of([]))),
        //   scan((acc, val) => [...acc, ...val], [])
        // )
        // const categoriesIds$: Observable<number[]> = combineLatest([existingCategoriesIds$, newCategoriesIds$]).pipe(
        //   map(([existingIds, newIds]) => [...existingIds, ...newIds])
        // )

        return existingCategoriesIds$;
    }

    private createManyTags(
        locationId: string,
        tags: string[]
    ): Observable<any> {
        const tagsDtos: CreateTagDto[] = tags.map((tag) => ({ name: tag }));
        return from(tagsDtos).pipe(
            tap((tag) =>
                this.logger.log(
                    'sending tag to creation: ',
                    JSON.stringify(tag)
                )
            ),
            concatMap((tag) => this.createSingleTag(locationId, tag)),
            tap((tag) => this.logger.log('Returning tag from creation: ', tag)),
            reduce((acc, item) => [...acc, item], [])
        );
    }

    private createSingleTag(
        locationId: string,
        tag: CreateTagDto
    ): Observable<any> {
        return this.wpClient.createTag(locationId, tag);
    }

    private createManyCategories(
        locationId: string,
        categories: string[]
    ): Observable<any> {
        const categoriesDtos: CreateCategoryDto[] = categories.map(
            (category) => ({ name: category })
        );
        return from(categoriesDtos).pipe(
            concatMap((category) =>
                this.createSingleCategory(locationId, category)
            )
        );
    }

    private createSingleCategory(
        locationId: string,
        category: CreateCategoryDto
    ): Observable<any> {
        return this.wpClient.createCategory(locationId, category);
    }
}