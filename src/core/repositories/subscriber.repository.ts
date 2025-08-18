import { SubscriberEntity } from '../entities/subscriber';

export abstract class SubscriberRepository {
  abstract getSubscribers(): SubscriberEntity[];
  abstract getSubscriberByNickname(
    nickname: string,
  ): SubscriberEntity | undefined;
  abstract hasUsedTrial(subscriber: SubscriberEntity): boolean;
  abstract addSubscriber(subscriber: SubscriberEntity): void;
  abstract removeSubscriber(subscriber: SubscriberEntity): void;
  abstract updateSubscriber(subscriber: SubscriberEntity): void;
}
