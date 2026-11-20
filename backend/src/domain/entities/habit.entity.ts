import { FrequencyType } from '../value-objects/frequency-type.vo.js';
import { TargetType } from '../value-objects/target-type.vo.js';

export interface HabitProps {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  frequencyType: FrequencyType;
  frequencyPayload: number[] | null;
  targetType: TargetType;
  targetValue: number | null;
  unit: string | null;
  reminderTime: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Habit {
  constructor(private readonly props: HabitProps) {}

  public get id(): string { return this.props.id; }
  public get userId(): string { return this.props.userId; }
  public get categoryId(): string { return this.props.categoryId; }
  public get title(): string { return this.props.title; }
  public get description(): string | null { return this.props.description; }
  public get frequencyType(): FrequencyType { return this.props.frequencyType; }
  public get frequencyPayload(): number[] | null { return this.props.frequencyPayload; }
  public get targetType(): TargetType { return this.props.targetType; }
  public get targetValue(): number | null { return this.props.targetValue; }
  public get unit(): string | null { return this.props.unit; }
  public get reminderTime(): string | null { return this.props.reminderTime; }
  public get color(): string { return this.props.color; }
  public get icon(): string { return this.props.icon; }
  public get isArchived(): boolean { return this.props.isArchived; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      title: this.title,
      description: this.description,
      frequencyType: this.frequencyType,
      frequencyPayload: this.frequencyPayload,
      targetType: this.targetType,
      targetValue: this.targetValue,
      unit: this.unit,
      reminderTime: this.reminderTime,
      color: this.color,
      icon: this.icon,
      isArchived: this.isArchived,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
