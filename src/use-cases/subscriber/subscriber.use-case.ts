import { Injectable } from '@nestjs/common';
import { SubscriberEntity } from '@core/entities/subscriber';
import { SubscriberRepository } from '@core/repositories/subscriber.repository';

@Injectable()
export class SubscriberUseCase {
  constructor(private subscriberRepository: SubscriberRepository) {}

  public getSubscribers(): SubscriberEntity[] {
    return this.subscriberRepository.getSubscribers();
  }

  public getSubscriberByNickname(
    nickname: string,
  ): SubscriberEntity | undefined {
    return this.subscriberRepository.getSubscriberByNickname(nickname);
  }

  public addSubscriber(subscriber: SubscriberEntity): void {
    this.subscriberRepository.addSubscriber(subscriber);
  }

  public removeSubscriber(subscriber: SubscriberEntity): void {
    this.subscriberRepository.removeSubscriber(subscriber);
  }

  public updateSubscriber(subscriber: SubscriberEntity): void {
    this.subscriberRepository.updateSubscriber(subscriber);
  }
}
