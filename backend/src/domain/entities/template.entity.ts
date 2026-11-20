import { FrequencyType } from '../value-objects/frequency-type.vo.js';
import { TargetType } from '../value-objects/target-type.vo.js';

export interface HabitTemplateProps {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  frequencyType: FrequencyType;
  frequencyPayload: number[] | null;
  targetType: TargetType;
  targetValue: number | null;
  unit: string | null;
  icon: string;
  color: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class HabitTemplate {
  constructor(private readonly props: HabitTemplateProps) {}

  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get description(): string { return this.props.description; }
  public get categoryId(): string { return this.props.categoryId; }
  public get frequencyType(): FrequencyType { return this.props.frequencyType; }
  public get frequencyPayload(): number[] | null { return this.props.frequencyPayload; }
  public get targetType(): TargetType { return this.props.targetType; }
  public get targetValue(): number | null { return this.props.targetValue; }
  public get unit(): string | null { return this.props.unit; }
  public get icon(): string { return this.props.icon; }
  public get color(): string { return this.props.color; }
  public get isPublished(): boolean { return this.props.isPublished; }
  public get createdBy(): string { return this.props.createdBy; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      categoryId: this.categoryId,
      frequencyType: this.frequencyType,
      frequencyPayload: this.frequencyPayload,
      targetType: this.targetType,
      targetValue: this.targetValue,
      unit: this.unit,
      icon: this.icon,
      color: this.color,
      isPublished: this.isPublished,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
