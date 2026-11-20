import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IAuditLogRepository } from '../ports/audit-log.repository.port.js';
import { User, UserStatus } from '../../domain/entities/user.entity.js';
import { AuditLog } from '../../domain/entities/audit-log.entity.js';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.error.js';

export interface UpdateUserStatusDTO {
  targetUserId: string;
  adminId: string;
  adminEmail?: string;
  status: UserStatus;
  reason: string;
  ipAddress?: string | null;
}

export class UpdateUserStatusUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  public async execute(dto: UpdateUserStatusDTO) {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new ValidationError('A mandatory reason of at least 5 characters is required for status changes.');
    }

    const user = await this.userRepo.findById(dto.targetUserId);
    if (!user) {
      throw new NotFoundError('Target user not found.');
    }

    const previousStatus = user.status;

    const updatedUser = new User({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      role: user.role,
      status: dto.status,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    });

    await this.userRepo.update(updatedUser);

    // Capture audit log
    const auditLog = new AuditLog({
      id: uuidv4(),
      actorId: dto.adminId,
      actorEmail: dto.adminEmail,
      action: dto.status === 'SUSPENDED' ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
      entityType: 'user',
      entityId: user.id,
      details: {
        previousStatus,
        newStatus: dto.status,
        reason: dto.reason,
      },
      ipAddress: dto.ipAddress || null,
      createdAt: new Date(),
    });

    await this.auditLogRepo.save(auditLog);

    return updatedUser.toJSON();
  }
}
