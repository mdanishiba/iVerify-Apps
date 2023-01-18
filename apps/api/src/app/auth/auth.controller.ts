/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    Controller,
    UseGuards,
    Post,
    Body,
    BadRequestException,
    NotFoundException,
    BadGatewayException,
    Inject,
    forwardRef,
    Logger,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/loginUser.dto';
import { AuthService } from './auth.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

import { TokenGenerationDto } from './dto/TokenGeneration.dto';
import { RefreshTokenAuthGuard } from '../guards/RefreshToken-auth.guard';
import { LocalAuthGuard } from '../guards/Local-auth.guard';
import { userMessages } from '../../constant/messages';
import { isEmpty } from 'radash';
import { catchError } from 'rxjs/operators';

import { lastValueFrom } from 'rxjs';
import { WpConfigHandler } from '../handlers/wpConfigHandler.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    private logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,

        private readonly wpConfigHandler: WpConfigHandler
    ) {}

    @Post('login')
    public async login(@Body() login: LoginUserDto, @Req() request: Request) {
        try {
            // @ts-ignore
            const locationId = request?.headers['location'];

            const userData = await this.authService.validate(
                locationId,
                login.email,
                login.password
            );

            const token = await this.authService.createToken(
                locationId,
                userData
            );

            if (isEmpty(token)) {
                throw new BadGatewayException();
            }

            this.logger.log('Token Generated');
            return { token, userData };
        } catch (err) {
            this.logger.error(err);
            throw new UnauthorizedException();
        }
    }

    @Post('callback')
    async callback(@Body() query: any, @Req() request: Request) {
        // @ts-ignore
        const { id: locationId } = request.location;

        if (!isEmpty(query.code)) {
            const result = await lastValueFrom(
                this.authService.createTokenByCode(locationId, query.code).pipe(
                    catchError((error) => {
                        this.logger.log(error);
                        throw new error();
                    })
                )
            );
            if (result.access_token && result.refresh_token) {
                /* Find and create */
                const wpUserData = await lastValueFrom(
                    this.authService.getUserByData(
                        locationId,
                        result.access_token
                    )
                );

                if (wpUserData) {
                    const wpConfig =
                        await this.wpConfigHandler.getConfigByLocation(
                            locationId
                        );

                    const userPostBody = {
                        firstName: wpUserData.user_nicename,
                        lastName: wpUserData.display_name,
                        email: wpUserData.user_email,
                        password: wpConfig.SSOWPPassword,
                        roles: [{ name: 'admin' }],
                        phone: '',
                        address: '',
                    };
                    const userData = await this.usersService.findOrRegister(
                        { ...userPostBody, locationId },
                        null
                    );
                    const token = await this.authService.createToken(
                        locationId,
                        userData
                    );

                    if (!token)
                        throw new BadGatewayException({
                            message: 'Token not present...',
                        });
                    this.logger.log('Token Generated by auth code');
                    return { token, userData };
                }
            } else {
                throw new BadGatewayException({
                    message: 'Access token not present...',
                });
            }
        }
    }

    @Post('generateToken')
    @ApiBearerAuth()
    @UseGuards(RefreshTokenAuthGuard)
    public async generateToken(
        @Body() userData: TokenGenerationDto,
        @Req() request: Request
    ) {
        // @ts-ignore
        const { id: locationId } = request.location;
        return await this.usersService.findOne(userData.email).then((user) => {
            if (!user) {
                this.logger.error(userMessages.userNotFound);
                throw new BadRequestException(userMessages.userNotFound);
            } else {
                const token = this.authService.createToken(locationId, user);
                if (!token) throw new BadGatewayException();
                this.logger.log('Token Generated');
                return token;
            }
        });
    }
}
