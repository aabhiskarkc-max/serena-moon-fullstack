import { Injectable } from '@nestjs/common';
import { db } from './db/drizzle';
import { users } from './db/schema';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  async getUser() {
    const allUsers = await db.select().from(users);
    return allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}
