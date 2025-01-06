import { readFileSync, writeFileSync } from 'fs';
import { SubscriberEntity } from '../entities/subscriber';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriberRepository {
  public getSubscribers(): SubscriberEntity[] {
    const subscribersJSON = readFileSync('db/subscribers.json', {
      encoding: 'utf8',
    });
    return JSON.parse(subscribersJSON);
  }

  public getSubscriberByNickname(
    nickname: string,
  ): SubscriberEntity | undefined {
    const subscribers = this.getSubscribers();
    return subscribers.find((subscriber) => subscriber.nickname === nickname);
  }

  public addSubscriber(subscriber: SubscriberEntity): void {
    const subscribers = this.getSubscribers();
    writeFileSync(
      'db/subscribers.json',
      JSON.stringify([...subscribers, subscriber]),
    );
  }

  public removeSubscriber(subscriber: SubscriberEntity): void {
    const subscribers = this.getSubscribers();
    const newSubscribers = subscribers.filter(
      (s) => s.nickname !== subscriber.nickname,
    );
    writeFileSync('db/subscribers.json', JSON.stringify(newSubscribers));
  }
}
