import { IUserRepository, UserFilterOptions } from '../ports/user.repository.port.js';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';

export class ListAdminUsersUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  public async execute(options: UserFilterOptions) {
    const { users, total } = await this.userRepo.findAll(options);

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const habits = await this.habitRepo.findByUserId(u.id);
        const activeStreaks = await this.streakRepo.countActiveStreaks(u.id);
        return {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          status: u.status,
          timezone: u.timezone,
          totalHabits: habits.length,
          activeStreaks,
          createdAt: u.createdAt.toISOString(),
        };
      })
    );

    return {
      users: enrichedUsers,
      meta: {
        page: options.page,
        limit: options.limit,
        total,
      },
    };
  }
}
