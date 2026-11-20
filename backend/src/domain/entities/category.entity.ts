export interface CategoryProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt: Date;
}

export class Category {
  constructor(private readonly props: CategoryProps) {}

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get icon(): string { return this.props.icon; }
  public get color(): string { return this.props.color; }
  public get isSystem(): boolean { return this.props.isSystem; }
  public get createdAt(): Date { return this.props.createdAt; }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      color: this.color,
      isSystem: this.isSystem,
    };
  }
}
