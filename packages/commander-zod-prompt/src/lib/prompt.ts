/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command, EventBus } from 'commander-zod';
import { CommandDefinition } from './types';

type CommandConstructor = new (...args: any[]) => Command;
interface PromptableCommandConstructor {
  new <TDefinition extends CommandDefinition>(
    config: TDefinition,
    eventBus?: EventBus
  ): Command<TDefinition>;
}

export function withPrompt<T extends CommandConstructor>(CommandClass: T) {
  return class extends CommandClass {
    constructor(...args: any[]) {
      super(...args);
    }
  } as PromptableCommandConstructor;
}
