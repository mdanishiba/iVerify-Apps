import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { environment } from '../../../environments/environment'


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refreshToken') {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: environment.JWTSecretRefreshToken,
        });
    }

    // tslint:disable-next-line:ban-types
    async validate(req: Request, payload: JwtPayload, done: Function) {
        const user = await this.authService.validateUser(payload);
        if (!user) {
            return { status: false, message: "auth fail" }
        }
        return { status: true, message: user }
    }
}