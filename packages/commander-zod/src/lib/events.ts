import EventEmitter from 'events';
import { CommandContext, Event, EventName } from './types';

export interface ParametersResolved extends Event {
  name: 'parameters-resolved';
  message: CommandContext;
}

export class EventBus {
  private _subscriberCount: Map<string, number> = new Map();

  constructor(private readonly eventEmitter: EventEmitter) {}

  private _incrementSubscriberCount(name: string, count: number) {
    const subsciberCount = this._subscriberCount.get(name) ?? 0;
    this._subscriberCount.set(name, Math.min(subsciberCount + count, 0));
  }

  subscriberCount<T extends Event>(name?: EventName<T>) {
    if (name) {
      return this._subscriberCount.get(name) ?? 0;
    } else {
      return [...this._subscriberCount.values()].reduce(
        (acc, count) => acc + count
      );
    }
  }

  publish<T extends Event>(event: T) {
    const channel = event.name;
    this.eventEmitter.emit(channel, event);
  }

  subscribe<T extends Event>(
    name: EventName<T>,
    subscriber: (event: T) => void
  ) {
    const channel = name;
    this.eventEmitter.on(channel, subscriber);
    this._incrementSubscriberCount(name, 1);
    return () => {
      this.eventEmitter.off(channel, subscriber);
      this._incrementSubscriberCount(name, -1);
    };
  }

  clear<T extends Event>(name?: EventName<T>) {
    if (name) {
      this.eventEmitter.removeAllListeners(name);
      this._subscriberCount.delete(name);
    } else {
      this.eventEmitter.removeAllListeners();
      this._subscriberCount.clear();
    }
  }
}
