import * as jwt from 'jsonwebtoken';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  async createSubmitStoryToken() {
    const payload = {
      timestamp: Date.now(),
    };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  async validateSubmitStoryToken(token: string): Promise<any> {
    try {
      // Decode and verify the token
      const decoded:any = this.jwtService.verify(token);

      // Optional: Check timestamp for specific requirements
      const currentTime = Date.now();
      const tokenTime = decoded.timestamp;
      const timeDifference = currentTime - tokenTime;

      if (timeDifference > 30 * 60 * 1000) {
        // 30 minutes in milliseconds
        return false
      }

      // Process form data here as token is valid
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
