/* eslint-disable @typescript-eslint/no-explicit-any */
import { ParseOptions, ParseOptionsResult } from 'commander';
import { Command, EventBus, mergeArgumentsFromConfig } from 'commander-zod';
import * as defaultInquirer from 'inquirer';
import { getPrompt } from './helpers';
import { CommandDefinition, ParameterDefinition } from './types';

type CommandConstructor = new (...args: any[]) => Command;
interface PromptableCommandConstructor {
  new <TDefinition extends CommandDefinition>(
    config: TDefinition,
    eventBus?: EventBus
  ): Command<TDefinition>;
}

export function withPrompt<T extends CommandConstructor>(
  CommandClass: T,
  inquirer = defaultInquirer
) {
  return class extends CommandClass {
    private _parseOptionsResult?: ParseOptionsResult;
    private _inquirer = inquirer;

    constructor(...args: any[]) {
      super(...args);
      this._configurePrompts();
    }

    private _configurePrompts() {
      const definition = this.definition as CommandDefinition;
      const parameters = definition.parameters;

      if (definition.addDisableInteractivePromptFlag) {
        this.configureOption('interactive', {
          type: 'option',
          negate: true,
          description: 'Disable use of interactive prompt',
        });
      }

      for (const [name, parameter] of Object.entries(parameters)) {
        parameter.prompt = getPrompt(
          name,
          parameter,
          definition.useDefaultInteractivePrompt ?? false,
          this._inquirer
        );
      }
    }

    private async _executePromptsForUnresolvedArguments() {
      const definition = this.definition as CommandDefinition;
      if (
        definition.addDisableInteractivePromptFlag &&
        this.context.options.interactive.value == false
      ) {
        return;
      }
      for (const parameter of Object.values(this.context.parameters)) {
        const definition = parameter.definition as ParameterDefinition;
        if (definition.prompt) {
          const prompt = definition.prompt as (
            value?: unknown
          ) => Promise<unknown>;
          parameter.value =
            !parameter.value || (parameter.value && definition.alwaysPrompt)
              ? await prompt(parameter.value)
              : parameter.value;
          if (parameter.type == 'option') {
            this.setOptionValue(parameter.name, parameter.value);
          }
        }
      }
    }

    private async _parseOptionsAsync(argv: string[]) {
      const { operands, unknown } = super.parseOptions(argv);
      await this._executePromptsForUnresolvedArguments();
      const finalResolvedOperands = mergeArgumentsFromConfig(
        operands,
        this.context.arguments
      );
      this._parseOptionsResult = {
        operands: finalResolvedOperands,
        unknown,
      };
    }

    override parseOptions(argv: string[]): ParseOptionsResult {
      if (this._parseOptionsResult) {
        return this._parseOptionsResult;
      }
      return super.parseOptions(argv);
    }

    override async parseAsync(
      argv?: readonly string[],
      options?: ParseOptions
    ): Promise<this> {
      // major hack!
      // Here we want to explicitly use promises since inquirer requires this for prompts.
      // The problem is the Commander API doesn't allow you to use promises during the
      // option parsing phase. In order to skirt around this, we call our internal
      // `parseOptionsAsync` and then cache the result. Then when Commander calls the
      // synchronous version `parseOptions` we can just return the cached result
      // we already processed.
      //
      // Now for the really major hack (above design works with the public Command interface).
      // In the `parse*` methods Commander calls a private method to do some argument processing
      // to support other environments, and we want to ensure our `parseOptionsAsync` call behaves
      // similarly even though we're adding our own customizations. For now, this calls the private
      // method directly to align behavior with the currrent Commander implementation.
      // TODO: Open a ticket to inquire on a better approach or feature request.
      const prepareUserArgs = (this as any)['_prepareUserArgs'](
        argv,
        options
      ) as string[];
      await this._parseOptionsAsync(prepareUserArgs);
      return super.parseAsync(argv, options);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override parse(argv?: readonly string[], options?: ParseOptions): this {
      this.error('Synchronous parse method is not allowed when using prompts');
    }
  } as PromptableCommandConstructor;
}
