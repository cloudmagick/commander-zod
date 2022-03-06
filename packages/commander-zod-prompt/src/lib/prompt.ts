/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command, EventBus } from 'commander-zod';
import { CommandDefinition } from './types';

type CommandConstructor = new (...args: any[]) => Command;

export type CommandPromptInterface<T extends CommandConstructor> =
  T extends new (...args: any[]) => infer Class
    ? Class
    : never &
        CommandConstructor & {
          new (config: CommandDefinition, eventBus?: EventBus): Command;
        };

export function withPrompt<T extends CommandConstructor>(Command: T) {
  return class extends Command {
    constructor(...args: any[]) {
      super(args[0], args[1]);
    }
  } as CommandPromptInterface<T>;
}
