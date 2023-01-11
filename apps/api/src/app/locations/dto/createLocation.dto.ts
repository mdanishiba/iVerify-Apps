import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LocationsParam } from '../interfaces/location.params';
import { LocationClients } from './locations.clients.dto';

export class CreateLocationDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsOptional()
    @IsArray()
    params: Array<LocationsParam>;

    @ApiProperty()
    @IsOptional()
    clients?: Array<Partial<LocationClients>>;

    constructor(params?: Partial<CreateLocationDto>) {
        Object.apply(this, params);
    }
}