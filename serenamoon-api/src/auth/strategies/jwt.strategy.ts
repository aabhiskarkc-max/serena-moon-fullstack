import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { db } from '../../db/drizzle';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!
    });
  }

  async validate(payload: JwtPayload) {
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub));
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      role: user?.role ?? 'user',
    };
  }
}
