import {
  CommandDefinition as BaseCommandDefinition,
  ParameterDefinition as BaseParameterDefinition,
} from 'commander-zod';

export interface CommandDefinition extends BaseCommandDefinition {
  /** Enables interactive prompts for all command-line parameters
   *
   * When true, this will add a default prompt for all required arguments and options,
   * if one is not already provided.
   */
  useDefaultInteractivePrompt?: boolean;

  /** When true, an additional option will be added that can be used to disable
   * the interactive prompt.
   *
   * The flag `--no-interactive` will be added as an option when enabled.
   */
  addDisableInteractivePromptFlag?: boolean;
  parameters: Record<string, ParameterDefinition>;
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

  /** When true, this will always execute the prompt regardless of whether a value
   * has already been provided.
   */
  alwaysPrompt?: boolean;
};
