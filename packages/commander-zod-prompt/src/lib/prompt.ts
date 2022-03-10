/* eslint-disable @typescript-eslint/no-explicit-any */
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
    private _inquirer = inquirer;
    private _promptsEnabled = true;

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
          environment: true,
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
        this._promptsEnabled &&
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

    override async parseOptionsAsync(argv: string[]) {
      const { operands, unknown } = await super.parseOptionsAsync(argv);
      await this._executePromptsForUnresolvedArguments();
      const finalResolvedOperands = mergeArgumentsFromConfig(
        operands,
        this.context.arguments
      );
      return { operands: finalResolvedOperands, unknown };
    }

    protected override isSynchronousParseValid(): boolean {
      return false;
    }

    disablePrompts() {
      this._promptsEnabled = false;
      return this;
    }

    enablePrompts() {
      this._promptsEnabled = true;
      return this;
    }
  } as PromptableCommandConstructor;
}
