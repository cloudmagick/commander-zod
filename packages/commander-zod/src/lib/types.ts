import { Argument, Command as BaseCommand, Option } from 'commander';
import { z } from 'zod';

/**
 * Defines command properties
 */
export type CommandDefinition = {
  /**
   * This is the name of the command.
   *
   * Same as `new Command('name')` used in Commander
   */
  name: string;

  /** Description of the command to be displayed with help */
  description?: string;

  /** Adds this command to the parent as a nested command */
  parentCommand?: BaseCommand;

  /** The command's arguments and optional parameters will be merged with configuration returned from this function
   *
   * Only command-line arguments have a higher priority
   */
  fromConfig?: () => Record<string, unknown>;

  /** Will create environment vars for all configured arguments and properties
   *
   * * Configuring environment variables individually is still possible by
   * using `configure` under the `Command` argument and/or option directly
   *
   * * This will generate an environment variable name automtically, but
   * can be overriden in the `names` property on the {@link ParameterDefinition}
   *
   */
  useEnvironment?: boolean;

  /** Add a common prefix for all environment variables when `useEnvironments` is enabled
   *
   * Environment names can still be overriden by each {@link ParameterDefinition} via `names`
   */
  environmentPrefix?: string;

  /** When true, help descriptions will also include the config key for all parameters */
  includeConfigNameInParameterDescriptions?: boolean;

  /** Parameter definitions
   *
   * - The `key` given for the parameter will be used as the variable
   * name for the resolved value. All resolved parameters will then
   * be passed as a `props` object into an `action` and/or `hook` callback.
   * The types will be statically resolved and inferred based on the
   * zod schema defined. If no zod schema is defined a string is assumed.
   */
  parameters?: {
    [key: string]: ParameterDefinition;
  };
};

export type ParameterDefinition = ArgumentDefinition | OptionDefinition;

export interface BaseDefinition {
  /** Zod Schema to use for validation and type inference */
  schema?: z.ZodFirstPartySchemaTypes;

  /** Parameter description to be displayed with help message */
  description?: string;

  /** Sets whether the parameter allows multiple values
   *
   * For arguments, there can only be one, and
   * it will always be placed last.
   */
  variadic?: boolean;

  /** Provide a default value for the parameter */
  defaultValue?: unknown;

  /** List of valid choices for the parameter */
  choices?: string[];

  /** Individual parameter environment flag
   *
   * - When false, this disables the environment variable for this parameter
   * (true by default)
   *
   * - This can be a boolean to use the default environment name translation
   * or a string to use as the environment name. The latter is a convenience
   * over having to also override the parameter in the `names` property
   */
  environment?: boolean | string;

  /** When false, it will disable populating this value from a config (true by default) */
  useConfig?: boolean;

  /** Parameter names for different sources.
   *
   * When this program attempts to parse parameters it will use the
   * names parameter to override the key it uses for a lookup based
   * on the source.
   *
   * As an example let's use `directedAcyclicGraph` with a basic config:
   *
   * ```
   * directedAcyclicGraph : {
   *   names: {
   *     param: 'dag',
   *     config: 'dag',
   *     env: 'DAG',
   *   }
   * }
   * ```
   *
   * This will translate and lookup the name as follows:
   *
   * 1) It will check to see if the argument was passed in from the command line as `--dag`
   * 2) If the `config` property is set. It will check to see if the name `dag` exists there
   * 3) If the `env` property is set, it will check to see if `DAG` exists there
   *
   * **NOTE**: The first truthy value is taken in priority of command line, config file, and/or environment.
   */
  names?: ParameterNameDefinitions;

  /** Argument and option values can be resolved from a configuration file that will be
   * passed in as the first parameter.
   *
   * This will decorate the parameter's `parseArg` function and will receive the value
   * parsed from the command-line or environment. The results will be added as a resolved
   * value _if_ one doesn't already exist for arguments, and will be set as a 'config'
   * value for options (this means it will have the lowest priority of cli and env)
   *
   * **Note**: Extraneous values are added as options and will be passed along to the action handler.
   */
  fromConfig?: (value?: string) => Record<string, unknown>;

  /** Is the parameter required
   *
   * by default it is true for arguments, and false for options
   */
  required?: boolean;
}

export interface ArgumentDefinition extends BaseDefinition {
  /** Configures command with an `Argument` */
  type: 'argument';

  names?: Omit<ParameterNameDefinitions, 'alias' | 'param'>;

  /** A function that can be used to add/update `Argument` configuration */
  configure?: (argument: Argument) => void;
}

export interface OptionDefinition extends BaseDefinition {
  /** Configures command as an `Option` */
  type: 'option';

  /** Should the option be negated (i.e. `--no-sauce`)*/
  negate?: boolean;

  names?: ParameterNameDefinitions;

  /** A function that can be used to add/update `Option` configuration */
  configure?: (option: Option) => void;
}

export type ParameterNameDefinitions = {
  /** A long-name for optional cli parameters */
  param?: string;

  /** A short-name alias for optional cli parameters */
  alias?: string;

  /** Name to use for environment lookups */
  env?: string;

  /** Name to use for config file lookups */
  config?: string;
};

export type ExtraProps = {
  extras: {
    args: string[];
    props: Record<string, unknown>;
  };
};
export type CommandProps<T extends CommandDefinition = CommandDefinition> =
  T extends {
    parameters: infer Def;
  }
    ? {
        props: {
          [key in keyof Def]: Def[key] extends { schema: infer Schema }
            ? Schema extends z.ZodType<unknown>
              ? Schema['_output']
              : string
            : string;
        };
      } & ExtraProps
    : { props: Record<string, unknown> } & ExtraProps;

export type ArgumentDefinitions = {
  [key: string]: ArgumentDefinition;
};
export type OptionDefinitions = {
  [key: string]: OptionDefinition;
};

export type ParameterDefinitions = {
  [key: string]: ParameterDefinition;
};

export type ParameterConfigValues = {
  args: unknown[];
  options: Record<string, unknown>;
};

export type CommandContext = {
  arguments: Record<string, ArgumentContext>;
  options: Record<string, OptionContext>;
  parameters: Record<string, ParameterContext>;
};

export type ParameterContext = {
  type: 'option' | 'argument';
  name: string;
  definition: ParameterDefinition;
  parameter: Argument | Option;
  value: unknown;
};

export type ArgumentContext = ParameterContext & {
  type: 'argument';
  parameter: Argument;
};

export type OptionContext = ParameterContext & {
  type: 'option';
  parameter: Option;
};

export interface Event {
  readonly name: string;
  message: unknown;
}

export type EventName<T extends Event> = T extends { name: infer EventName }
  ? EventName
  : never;
