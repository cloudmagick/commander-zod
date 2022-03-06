import {
  CommandDefinition as BaseCommandDefinition,
  ParameterDefinition as BaseParameterDefinition,
} from 'commander-zod';

export interface CommandDefinition extends BaseCommandDefinition {
  useInteractivePrompt: boolean;
}

export type ParameterDefinition = BaseParameterDefinition & {
  prompt: string;
};
