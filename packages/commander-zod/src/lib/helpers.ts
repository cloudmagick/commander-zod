import { z } from 'zod';
import {
  ArgumentDefinition,
  ArgumentDefinitions,
  CommandDefinition,
  OptionDefinition,
  OptionDefinitions,
  ParameterContext,
  ParameterDefinition,
  ParameterNameDefinitions,
} from './types';

export function splitParametersByType(
  parameters: Exclude<CommandDefinition['parameters'], undefined>
): [ArgumentDefinitions, OptionDefinitions] {
  return Object.keys(parameters ?? {}).reduce(
    (acc, key) => {
      const [args, options] = acc;
      const definition = parameters[key];
      if (definition.type == 'argument') {
        args[key] = definition as ArgumentDefinition;
      } else if (definition.type == 'option') {
        options[key] = definition as OptionDefinition;
      }
      return acc;
    },
    [{}, {}] as [ArgumentDefinitions, OptionDefinitions]
  );
}

export function getParameterNames(
  name: string,
  definition: ParameterDefinition,
  envPrefix?: string
) {
  const names = definition.names;
  return {
    param: dashifyName(name),
    alias: (names as ParameterNameDefinitions)?.alias,
    config: names?.config ?? name,
    env:
      (typeof definition.environment == 'string'
        ? definition.environment
        : null) ??
      names?.env ??
      environmentName(name, envPrefix),
  } as Required<ParameterNameDefinitions>;
}

export function environmentName(name: string, prefix?: string) {
  const envName = name
    .split('')
    .reduce((acc, char, index) => {
      const lastChar = name[index - 1];
      if (char == '-' || char == '_') {
        acc.push('_');
      } else if (lastChar && isLowerCase(lastChar) && !isLowerCase(char)) {
        acc.push(...['_', char.toUpperCase()]);
      } else {
        acc.push(char.toUpperCase());
      }
      return acc;
    }, [] as string[])
    .join('');
  return prefix ? prefix + envName : envName;
}

export function dashifyName(name: string) {
  return name
    .split('')
    .reduce((acc, char, index) => {
      const lastChar = name[index - 1];
      if (char == '-' || char == '_') {
        acc.push('-');
      } else if (lastChar && isLowerCase(lastChar) && !isLowerCase(char)) {
        acc.push(...['-', char.toLowerCase()]);
      } else {
        acc.push(char.toLowerCase());
      }
      return acc;
    }, [] as string[])
    .join('');
}

export function sortArguments<T>(
  args: Record<string, T>,
  selector: (arg: T) => ParameterDefinition
) {
  return Object.values(args)
    .sort((a, b) =>
      selector(a).variadic == selector(b).variadic
        ? 0
        : selector(a).variadic
        ? 1
        : -1
    )
    .sort((a, b) =>
      selector(a).required == selector(b).required
        ? 0
        : selector(a).required
        ? -1
        : 1
    );
}

export function mergeArgumentsFromConfig(
  src: string[],
  args: Record<string, ParameterContext>
) {
  const resolvedArgumentValues = sortArguments(
    args,
    (arg) => arg.definition
  ).flatMap((arg) => arg.value as string | string[]);
  const result = [];
  const maxLength =
    src.length < resolvedArgumentValues.length
      ? resolvedArgumentValues.length
      : src.length;
  for (let index = 0; index < maxLength; index++) {
    const argValue = src[index] ? src[index] : resolvedArgumentValues[index];
    if (!argValue) continue;
    result.push(argValue);
  }
  return result;
}

function isLowerCase(str: string) {
  // ensures non-alphanumeric characters like _-!@ are treated as upper case
  // by default node treats these characters as both lower and upper case
  return str == str.toLowerCase() && str != str.toUpperCase();
}

export function createValidationSchema(definition: CommandDefinition) {
  const schema = Object.entries(definition.parameters ?? {}).reduce(
    (acc, [key, parameter]) => {
      if (parameter.schema) {
        acc[key] = parameter.schema;
      }
      return acc;
    },
    {} as Record<string, z.ZodFirstPartySchemaTypes>
  );
  return Object.keys(schema).length ? z.object(schema) : null;
}

export function createOptionFlags(
  name: string,
  definition: ParameterDefinition
) {
  const optionDefinition = definition as OptionDefinition;
  const names = getParameterNames(name, definition);
  const optionTerm = definition.variadic ? `${name}...` : name;
  const optionTermConstraint = definition.required
    ? `<${optionTerm}>`
    : `[${optionTerm}]`;
  const optionFlags = [
    names.alias ? `-${names.alias}` : null,
    optionDefinition.negate ? `--no-${names.param}` : `--${names.param}`,
    optionTermConstraint,
  ]
    .filter((opt) => !!opt)
    .join(' ');
  return optionFlags;
}
