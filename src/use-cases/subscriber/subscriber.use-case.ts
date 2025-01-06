import { Injectable } from '@nestjs/common';
import { SubscriberEntity } from 'src/core/entities/subscriber';
import { SubscriberRepository } from 'src/core/repositories/subscriber.repository';

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
}
