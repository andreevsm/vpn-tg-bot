import { SubscriptionPlan, SubscriptionStatus } from 'src/common/types/types';

export interface SubscriberEntity {
  id: number;
  firstName: string;
  nickname: string;
  createdAt: number;
  exparedAt: number;
  configName: string;
  subscription: {
    status: SubscriptionStatus;
    plan: SubscriptionPlan;
  };
}
