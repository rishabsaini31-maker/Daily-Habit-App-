export interface AuditLogProps {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export class AuditLog {
  constructor(private readonly props: AuditLogProps) {}

  public get id(): string { return this.props.id; }
  public get actorId(): string { return this.props.actorId; }
  public get actorEmail(): string | undefined { return this.props.actorEmail; }
  public get action(): string { return this.props.action; }
  public get entityType(): string { return this.props.entityType; }
  public get entityId(): string { return this.props.entityId; }
  public get details(): Record<string, unknown> | null { return this.props.details; }
  public get ipAddress(): string | null { return this.props.ipAddress; }
  public get createdAt(): Date { return this.props.createdAt; }

  public toJSON() {
    return {
      id: this.id,
      actorId: this.actorId,
      actorEmail: this.actorEmail,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      details: this.details,
      ipAddress: this.ipAddress,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
