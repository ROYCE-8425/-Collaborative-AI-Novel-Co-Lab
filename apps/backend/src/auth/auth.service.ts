import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string, role: string) {
    const existing = await this.userModel.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      username,
      email,
      passwordHash,
      role,
    });

    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, username: user.username, role: user.role },
    };
  }

  async login(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, username: user.username, role: user.role },
    };
  }

  async createGuest(displayName: string) {
    const rawName = typeof displayName === 'string' ? displayName : '';
    const cleanName = rawName.trim().slice(0, 32) || 'Guest Writer';
    const usernameBase =
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'guest-writer';

    let user: UserDocument | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 8);
      try {
        user = await this.userModel.create({
          username: `${usernameBase}-${suffix}`,
          email: `guest-${suffix}@local.invalid`,
          passwordHash: 'guest-session',
          role: 'creator',
        });
        break;
      } catch (err: any) {
        if (err?.code !== 11000 || attempt === 4) {
          throw err;
        }
      }
    }

    if (!user) {
      throw new ConflictException('Could not create guest user');
    }

    return {
      user: {
        id: user._id,
        username: cleanName,
        role: user.role,
        isGuest: true,
      },
    };
  }
}
