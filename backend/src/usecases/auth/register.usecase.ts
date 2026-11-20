import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IPasswordHasher } from '../ports/password-hasher.port.js';
import { ITokenService } from '../ports/token.service.port.js';
import { User } from '../../domain/entities/user.entity.js';
import { ConflictError, ValidationError } from '../../domain/errors/domain.error.js';

export interface RegisterDTO {
  email: string;
  password: string;
  displayName: string;
  timezone?: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(dto: RegisterDTO) {
    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase().trim());
    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    if (!dto.password || dto.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const timezone = dto.timezone || 'UTC';

    const user = new User({
      id: uuidv4(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      displayName: dto.displayName.trim(),
      role: 'USER',
      status: 'ACTIVE',
      timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepo.save(user);

    const token = this.tokenService.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
    });

    return {
      user: user.toJSON(),
      token,
      expiresIn: 3600,
    };
  }
}
