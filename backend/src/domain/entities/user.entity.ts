export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  public get id(): string { return this.props.id; }
  public get email(): string { return this.props.email; }
  public get passwordHash(): string { return this.props.passwordHash; }
  public get displayName(): string { return this.props.displayName; }
  public get role(): UserRole { return this.props.role; }
  public get status(): UserStatus { return this.props.status; }
  public get timezone(): string { return this.props.timezone; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  public isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      role: this.role,
      status: this.status,
      timezone: this.timezone,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
