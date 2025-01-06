export type Subscriber = {
  id: number;
  firstName: string;
  nickname: string;
  createdAt: number;
  configName: string;
};

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  NOT_FOUND = 'not_found',
  SHOULD_CHECK = 'should_check',
}

export enum SubscriptionPlan {
  TRIAL = 'trial',
  MONTH = 'month',
  NOT_FOUND = 'not_found',
}
