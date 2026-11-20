import { IUserRepository } from '../ports/user.repository.port.js';
import { IPasswordHasher } from '../ports/password-hasher.port.js';
import { ITokenService } from '../ports/token.service.port.js';
import { AccountSuspendedError, UnauthorizedError } from '../../domain/errors/domain.error.js';

export interface LoginDTO {
  email: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(dto: LoginDTO) {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive()) {
      throw new AccountSuspendedError('This account has been suspended by an administrator.');
    }

    const isValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

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
