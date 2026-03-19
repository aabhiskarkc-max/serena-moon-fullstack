import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { db } from '../../db/drizzle';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    const options: StrategyOptions = {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/redirect',
      scope: ['email', 'profile'],
    };
    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || profile.name?.givenName || 'User';

      if (!email) {
        return done(null, false);
      }

      const [existing] = await db.select().from(users).where(eq(users.email, email));

      let user = existing;

      if (!user) {
        const created = await db
          .insert(users)
          .values({
            email,
            username: name,
            password: null,
          })
          .returning();
        user = created[0];
      }

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}

