import { IUserRepository } from '../ports/user.repository.port.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class GetMeUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  public async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user.toJSON();
  }
}
