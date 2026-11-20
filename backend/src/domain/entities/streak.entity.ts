export interface StreakRecordProps {
  id: string;
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  freezeCountRemaining: number;
  updatedAt: Date;
}

export class StreakRecord {
  constructor(private readonly props: StreakRecordProps) {}

  public get id(): string { return this.props.id; }
  public get habitId(): string { return this.props.habitId; }
  public get currentStreak(): number { return this.props.currentStreak; }
  public get longestStreak(): number { return this.props.longestStreak; }
  public get lastCompletedDate(): string | null { return this.props.lastCompletedDate; }
  public get freezeCountRemaining(): number { return this.props.freezeCountRemaining; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public toJSON() {
    return {
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastCompletedDate: this.lastCompletedDate,
      freezeCountRemaining: this.freezeCountRemaining,
    };
  }
}
