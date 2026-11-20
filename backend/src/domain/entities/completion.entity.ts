export type CompletionStatus = 'COMPLETED' | 'SKIPPED';

export interface HabitCompletionProps {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: CompletionStatus;
  value: number;
  notes: string | null;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class HabitCompletion {
  constructor(private readonly props: HabitCompletionProps) {}

  public get id(): string { return this.props.id; }
  public get habitId(): string { return this.props.habitId; }
  public get userId(): string { return this.props.userId; }
  public get date(): string { return this.props.date; }
  public get status(): CompletionStatus { return this.props.status; }
  public get value(): number { return this.props.value; }
  public get notes(): string | null { return this.props.notes; }
  public get completedAt(): Date { return this.props.completedAt; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  public toJSON() {
    return {
      id: this.id,
      habitId: this.habitId,
      userId: this.userId,
      date: this.date,
      status: this.status,
      value: this.value,
      notes: this.notes,
      completedAt: this.completedAt.toISOString(),
    };
  }
}
