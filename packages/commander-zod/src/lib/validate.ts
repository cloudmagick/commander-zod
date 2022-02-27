import { ParameterDefinition } from './types';

export function validateSingleVariadicArgument(
  parameters: Record<string, ParameterDefinition>
) {
  const variadicArgs: [string, ParameterDefinition][] = [];
  for (const [name, definition] of Object.entries(parameters)) {
    if (definition.type == 'argument' && definition.variadic) {
      variadicArgs.push([name, definition]);
    }
  }
  if (variadicArgs.length > 0) {
    const variadicNames = variadicArgs.map((arg) => arg[0]);
    throw new Error(
      `Only one variadic argument can be defined. Found ${variadicNames}`
    );
  }
}

export function validateParameterName(name: string) {
  if (!name.match(/^[a-zA-Z0-9]+([_-]*[a-zA-Z0-9])*$/)) {
    throw new Error(
      `Paramter [${name}] is invalid. Must begin and end with alphanumeric characters and may include _- in between.`
    );
  }
}
