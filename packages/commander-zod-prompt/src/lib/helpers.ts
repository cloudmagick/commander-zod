import * as defaultInquirer from 'inquirer';
import { ParameterDefinition } from './types';

export function getPrompt(
  name: string,
  parameter: ParameterDefinition,
  useDefaultInteractivePrompt = false,
  inquirer = defaultInquirer
) {
  if (!parameter.prompt && !useDefaultInteractivePrompt) {
    return undefined;
  }

  if (typeof parameter.prompt == 'function') {
    return parameter.prompt;
  }

  const displayPrompt = parameter.prompt ?? `Please enter a value for ${name}:`;

  return () =>
    inquirer
      .prompt([
        {
          type: parameter.choices ? 'list' : 'input',
          name,
          message: displayPrompt,
          choices: parameter.choices,
        },
      ])
      .then((res) => res[name]);
}
