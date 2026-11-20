import { User } from '../../domain/entities/user.entity.js';

export interface UserFilterOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  findAll(options: UserFilterOptions): Promise<{ users: User[]; total: number }>;
  countAll(): Promise<number>;
  countActive(): Promise<number>;
}
