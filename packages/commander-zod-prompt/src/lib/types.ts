import {
  CommandDefinition as BaseCommandDefinition,
  ParameterDefinition as BaseParameterDefinition,
} from 'commander-zod';
import { prompt } from 'inquirer';

prompt([]).then();

export interface CommandDefinition extends BaseCommandDefinition {
  /** Enables interactive prompts for all command-line parameters
   *
   * When true, this will add a prompt for all required arguments and options,
   * if one is not already provided.
   */
  useInteractivePrompt: boolean;
}

export type ParameterDefinition = BaseParameterDefinition & {
  /** Configure the prompt to be used for the parameter
   *
   * - If a string is supplied, this will automatically be used as the display prompt.
   *
   * - If a function is supplied, it will be called with an optional value if one
   * is passed, and is expected to return a Promise with a key/value hash of answers
   * [see Inquirer docs]{@link (https://www.npmjs.com/package/inquirer)}
   */
  prompt?: string | ((value?: unknown) => Promise<unknown>);
};
