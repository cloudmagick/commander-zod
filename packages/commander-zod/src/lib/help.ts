import { Argument, Help as BaseHelp, Option } from 'commander';
import { CommandDefinition } from './types';

export class Help extends BaseHelp {
  protected definition: CommandDefinition;

  constructor(definition: CommandDefinition) {
    super();
    this.definition = definition;
  }

  override optionDescription(option: Option): string {
    const description = super.optionDescription(option);
    if (this.definition.includeConfigNameInParameterDescriptions) {
      const optionDefinition =
        this.definition.parameters?.[option.attributeName()];
      if (optionDefinition && optionDefinition.names?.config) {
        if (description.slice(-1) == ')') {
          return (
            description.slice(0, -1) +
            `, config: ${optionDefinition.names.config})`
          );
        } else {
          return description + ` (config: ${optionDefinition.names.config})`;
        }
      }
    }
    return description;
  }

  override argumentDescription(argument: Argument): string {
    const description = super.argumentDescription(argument);
    const argumentDefinition = this.definition.parameters?.[argument.name()];
    if (argumentDefinition) {
      const extras = [] as string[];
      if (
        this.definition.useEnvironment &&
        argumentDefinition.names?.env &&
        argumentDefinition.environment != false
      ) {
        extras.push(`env: ${argumentDefinition.names.env}`);
      }
      if (
        this.definition.includeConfigNameInParameterDescriptions &&
        argumentDefinition.names?.config &&
        argumentDefinition.useConfig != false
      ) {
        extras.push(`config: ${argumentDefinition.names.config}`);
      }
      if (extras.length) {
        if (description.slice(-1) == ')') {
          return description.slice(0, -1) + `, ${extras.join(', ')})`;
        }
        return description + ` (${extras.join(', ')})`;
      }
    }
    return description;
  }
}
