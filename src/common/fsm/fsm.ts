interface State {
  initialValue: string;
  transitions: {
    [key: string]: string | string[];
  };
}

export class FSM {
  private state!: State;
  private currentValue!: string;

  constructor(private _state: State) {
    this.state = _state;
    this.currentValue = this.state.initialValue;
  }

  public getValue(): string {
    return this.currentValue;
  }

  public canTransitionTo(currentValue: string): boolean {
    return this.state.transitions[this.currentValue].includes(currentValue);
  }

  public transitionTo(currentValue: string): void {
    if (this.canTransitionTo(currentValue)) {
      console.log(`Переход: ${this.currentValue} -> ${currentValue}`);
      this.currentValue = currentValue;
    } else {
      throw new Error(
        `Невозможный переход: ${this.currentValue} -> ${currentValue}`,
      );
    }
  }

  public reset(): void {
    this.currentValue = this.state.initialValue;
  }
}
