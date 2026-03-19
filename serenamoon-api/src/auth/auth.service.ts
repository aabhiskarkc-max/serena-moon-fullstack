import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { RegisterDto } from './dto/register.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, registerDto.email));

    if (existing.length > 0) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await hash(registerDto.password, 10);
    const created = await db
      .insert(users)
      .values({
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
      })
      .returning();

    return {
      message: 'User created successfully',
      user: { id: created[0].id, email: created[0].email, username: created[0].username },
    };
  }

  async validateUser(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: { id: string; email: string; username?: string }) {
    const payload = { sub: user.id, email: user.email, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
    };
  }
}
