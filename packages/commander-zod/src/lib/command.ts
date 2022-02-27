/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Argument,
  Command as BaseCommand,
  HookEvent,
  Option,
  ParseOptions,
  ParseOptionsResult,
} from 'commander';
import {
  createOptionFlags,
  createValidationSchema,
  getParameterNames,
  mergeArgumentsFromConfig,
  sortArguments,
} from './helpers';
import {
  ArgumentDefinition,
  CommandContext,
  CommandDefinition,
  CommandProps,
  ExtraProps,
  OptionDefinition,
  ParameterDefinition,
} from './types';
import {
  validateParameterName,
  validateSingleVariadicArgument,
} from './validate';

export class Command extends BaseCommand {
  private _definition: CommandDefinition;
  context: CommandContext = {
    arguments: {},
    options: {},
    parameters: {},
  };
  private _usePromise = false;
  private _shouldUsePromise = false;

  constructor(config: CommandDefinition) {
    super(config.name);
    if (config.description) {
      this.description(config.description);
    }
    this._definition = config;
    this.validateDefinition();
    this._configureCommand();
  }

  validateDefinition() {
    const parameters = this._definition.parameters ?? {};
    for (const [name] of Object.entries(parameters)) {
      validateParameterName(name);
    }
    validateSingleVariadicArgument(parameters);
  }

  private _configureCommand() {
    if (this._definition.parentCommand) {
      if (this._definition.parentCommand) {
        this._definition.parentCommand.addCommand(this);
        this.copyInheritedSettings(this._definition.parentCommand);
      }
    }
    const parameters = this._definition.parameters ?? {};

    for (const [name, parameter] of Object.entries(parameters)) {
      if (parameter.type == 'argument') {
        this._configureArgument(name, parameter);
      } else if (parameter.type == 'option') {
        this._configureOption(name, parameter);
      }
    }
  }

  private _configureArgument(name: string, definition: ParameterDefinition) {
    const argument = new Argument(name, definition.description);
    argument.required = definition.required ?? true;
    argument.variadic = definition.variadic ?? false;
    definition.names =
      definition.environment && typeof definition.environment == 'string'
        ? {
            env: definition.environment,
          }
        : undefined;
    definition.names = getParameterNames(
      name,
      definition,
      this._definition.environmentPrefix
    );
    if (definition.defaultValue) {
      argument.default(definition.defaultValue);
    }
    const argumentDefinition = definition as ArgumentDefinition;
    if (argumentDefinition.configure) {
      argumentDefinition.configure(argument);
    }
    this.addArgument(argument);
    this.context.arguments[name] = this.context.parameters[name] = {
      name,
      type: 'argument',
      parameter: argument,
      definition: argumentDefinition,
      value: null,
    };
  }

  private _configureOption(name: string, definition: ParameterDefinition) {
    const optionDefinition = definition as OptionDefinition;
    const optionFlags = createOptionFlags(name, definition);
    const option = new Option(optionFlags, definition.description);
    definition.names =
      definition.environment && typeof definition.environment == 'string'
        ? {
            env: definition.environment,
          }
        : undefined;
    definition.names = getParameterNames(
      name,
      definition,
      this._definition.environmentPrefix
    );
    if (this._definition.useEnvironment || definition.environment) {
      option.env(definition.names?.env ?? '');
    }
    if (definition.defaultValue) {
      option.default(definition.defaultValue);
    }
    definition.names = getParameterNames(name, definition);
    if (optionDefinition.configure) {
      optionDefinition.configure(option);
    }
    this.addOption(option);
    this.context.options[name] = this.context.parameters[name] = {
      name,
      type: 'option',
      parameter: option,
      definition: optionDefinition,
      value: null,
    };
  }

  private _addSourceHandlers() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, context] of Object.entries(this.context.parameters)) {
      if (context.type == 'option' && context.definition.fromConfig) {
        this.on(`option:${context.name}`, (value: string) => {
          if (context.definition.fromConfig) {
            const results = context.definition.fromConfig(value);
            context.value = results;
            this._resolveParametersFromSource(results);
          }
        });
      }
    }
  }

  private _handleFromConfigArguments(args: string[]) {
    const sortedArguments = sortArguments(
      this.context.arguments,
      (arg) => arg.definition
    );
    for (const [index, arg] of sortedArguments.entries()) {
      const argValue = args[index];
      if (arg.definition.fromConfig) {
        arg.value = argValue;
        const result = arg.definition.fromConfig(argValue);
        this._resolveParametersFromSource(result);
      }

      if (
        !arg.value &&
        (this._definition.useEnvironment || arg.definition.environment)
      ) {
        arg.value = process.env[arg.definition.names?.env ?? ''];
      }
    }
  }

  private _resolveParametersFromSource(
    config: Record<string, unknown>,
    source: 'config' | 'env' = 'config'
  ) {
    for (const [name, value] of Object.entries(config)) {
      // find parameters matching the config name override or name
      const context = Object.values(this.context.parameters).find(
        (param) => name == param.definition.names?.config ?? param.name
      );
      if (context) {
        context.value = value;
        if (context.type == 'option') {
          this.setOptionValueWithSource(name, value, source);
        }
      } else {
        this.setOptionValueWithSource(name, value, 'config');
      }
    }
  }

  private _mapValuesToProps() {
    const resolvedArgumentValues = this.processedArgs ?? [];
    const resolvedOptionValues = this.opts() ?? {};
    const sortedArguments = sortArguments(
      this.context.arguments,
      (arg) => arg.definition
    );
    const props: { props: Record<string, unknown> } & ExtraProps = {
      props: {},
      extras: { args: [], props: {} },
    };
    for (const [index, value] of resolvedArgumentValues.entries()) {
      const argument = sortedArguments[index];
      if (argument) {
        argument.value = value;
        props.props[argument.name] = value;
      } else {
        props.extras.args.push(value);
      }
    }

    for (const [key, value] of Object.entries(resolvedOptionValues)) {
      const option = this.context.options[key];
      if (option) {
        option.value = value;
        props.props[option.name] = value;
      } else {
        props.extras.props[key] = value;
      }
    }

    return props;
  }

  protected parseProps() {
    const schema = createValidationSchema(this._definition)?.passthrough();
    const props = this._mapValuesToProps();
    if (schema) {
      return {
        props: schema.parse(props.props),
        extras: {
          ...props.extras,
        },
      };
    }
    return {
      ...props,
    };
  }

  protected async parsePropsAsync() {
    const schema = createValidationSchema(this._definition)?.passthrough();
    const props = this._mapValuesToProps();
    if (schema) {
      return {
        props: await schema.parseAsync(props.props),
        extras: {
          ...props.extras,
        },
      };
    }
    return {
      ...props,
    };
  }

  copyInheritedSettings(sourceCommand: BaseCommand): this {
    const command = sourceCommand as Command;
    if ('_usePromise' in command) {
      command._usePromise = this._usePromise;
    }
    return this;
  }

  override action(
    fn: (
      props: unknown,
      extras: ExtraProps['extras'],
      command: BaseCommand
    ) => void | Promise<void>
  ): this {
    super.action(() => {
      if (this._shouldUsePromise) {
        return this.parsePropsAsync().then((props) =>
          fn(props.props, props.extras, this)
        );
      } else {
        const { props, extras } = this.parseProps();
        fn(props, extras, this);
      }
    });
    return this;
  }

  override hook(
    event: HookEvent,
    fn: (...args: any[]) => void | Promise<void>
  ): this {
    super.hook(event, (thisCommand, srcCommand) => {
      if (this._shouldUsePromise) {
        return this.parsePropsAsync().then((props) =>
          fn(props.props, props.extras, thisCommand, srcCommand)
        );
      } else {
        const { props, extras } = this.parseProps();
        fn(props, extras, thisCommand, srcCommand);
      }
    });
    return this;
  }

  override async parseAsync(
    argv?: readonly string[],
    options?: ParseOptions
  ): Promise<this> {
    const children = this.commands as Command[];
    for (const child of children) {
      child._shouldUsePromise = this._shouldUsePromise;
    }
    this._shouldUsePromise = true;
    await super.parseAsync(argv, options);
    return this;
  }

  override parse(argv?: readonly string[], options?: ParseOptions): this {
    super.parse(argv, options);
    return this;
  }

  override parseOptions(argv: string[]): ParseOptionsResult {
    if (this._definition.fromConfig) {
      const results = this._definition.fromConfig();
      this._resolveParametersFromSource(results);
    }
    this._addSourceHandlers();
    const { operands, unknown } = super.parseOptions(argv);
    this._handleFromConfigArguments(operands);

    // injecting parameters into arguments is not supported by commander
    // so must be handled explicitly here with `mergeArgumentsConfig`
    return {
      operands: mergeArgumentsFromConfig(operands, this.context.arguments),
      unknown,
    };
  }

  static create<T extends CommandDefinition>(config: T) {
    return new ActionCommand(config);
  }
}

export class ActionCommand<
  TDefinition extends CommandDefinition
> extends Command {
  base: Command;
  constructor(config: TDefinition) {
    super(config);
    this.base = this;
  }

  hook(
    event: HookEvent,
    listener: (
      props: CommandProps<TDefinition>['props'],
      extras: CommandProps<TDefinition>['extras'],
      thisCommand: BaseCommand,
      actionCommand: BaseCommand
    ) => void | Promise<void>
  ): this {
    return super.hook(event, listener);
  }

  action(
    fn: (
      props: CommandProps<TDefinition>['props'],
      extras: CommandProps<TDefinition>['extras'],
      command: BaseCommand
    ) => void | Promise<void>
  ): this {
    return super.action(
      fn as (
        props: unknown,
        extras: ExtraProps['extras'],
        command: BaseCommand
      ) => void | Promise<void>
    );
  }
}
