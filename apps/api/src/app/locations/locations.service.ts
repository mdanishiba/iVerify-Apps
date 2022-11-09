import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'radash';
import {
    DeleteResult,
    FindManyOptions,
    Repository,
    UpdateResult,
} from 'typeorm';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { CreateLocationDto } from './dto/createLocation.dto';
import { LocationDto } from './dto/location.dto';
import { Locations } from './models/locations.model';

@Injectable()
export class LocationsService {
    private logger = new Logger(LocationsService.name);

    constructor(
        @InjectRepository(Locations)
        private locationsRepository: Repository<Locations>
    ) {}

    public async getConfig(locationId: string, key: string): Promise<string> {
        try {
            const location = await this.findById(locationId);

            let filteredResult = location.params[key];

            if (isEmpty(filteredResult)) {
                filteredResult = process.env[key];
            }

            return filteredResult as unknown as string;
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    public async create(
        locationParam: CreateLocationDto
    ): Promise<LocationDto> {
        try {
            const location = await this.locationsRepository.create(
                new Locations(locationParam)
            );

            const result = await this.locationsRepository.save(location);

            return result.toDto();
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    public async update(
        locationId: string,
        locationParam: Partial<LocationDto>
    ): Promise<UpdateResult> {
        try {
            const result = await this.locationsRepository.update(locationId, {
                ...locationParam,
            });

            return result;
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async find(
        criteria: FindManyOptions<Locations>
    ): Promise<Array<LocationDto>> {
        try {
            const locations = await this.locationsRepository.find(criteria);

            return locations.map((location) => location.toDto());
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async findAll(
        paginationDto: PaginationQueryDto
    ): Promise<Array<LocationDto>> {
        const { limit, offset } = paginationDto;
        try {
            const criteria = {
                take: limit,
                skp: offset,
            };

            const queryResult = await this.find(criteria);

            return queryResult;
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async findById(locationId: string): Promise<Locations> {
        try {
            const location = await this.locationsRepository.findOne({
                where: {
                    id: locationId,
                },
            });

            return location;
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    public async delete(locationId: string): Promise<DeleteResult> {
        return this.locationsRepository.update(locationId, { deleted: true });
        // remove users, stats, roles
    }
}