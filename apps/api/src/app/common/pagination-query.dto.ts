import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsPositive()
    limit: number;

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsPositive()
    offset: number;
}
