import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.['access_token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.getUserById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check company status for company-level users (not super_admin)
    if (user.companyId && user.company) {
      if (user.company.status === 'suspended') {
        throw new UnauthorizedException('Your company account has been suspended. Please contact support.');
      }
      if (user.company.status === 'archived') {
        throw new UnauthorizedException('Your company account has been archived.');
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
