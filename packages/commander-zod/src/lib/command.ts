/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Argument,
  Command as BaseCommand,
  HookEvent,
  Option,
  ParseOptions,
  ParseOptionsResult,
} from 'commander';
import { EventEmitter } from 'stream';
import { EventBus, ParametersResolved } from './events';
import {
  assignResolvedArgumentValues,
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
  Event,
  EventName,
  ExtraProps,
  OptionDefinition,
  ParameterDefinition,
} from './types';
import {
  validateParameterName,
  validateSingleVariadicArgument,
} from './validate';

export class Command<
  TDefinition extends CommandDefinition = CommandDefinition
> extends BaseCommand {
  protected definition: CommandDefinition;
  context: CommandContext = {
    arguments: {},
    options: {},
    parameters: {},
  };
  private _shouldUsePromise = false;
  private _eventBus: EventBus;

  constructor(config: TDefinition, eventBus?: EventBus) {
    super(config.name);
    if (config.description) {
      this.description(config.description);
    }
    this.definition = config;
    this._eventBus =
      eventBus ?? new EventBus(new EventEmitter({ captureRejections: true }));
    this.validateDefinition();
    this._configureCommand();
  }

  validateDefinition() {
    const parameters = this.definition.parameters ?? {};
    for (const [name] of Object.entries(parameters)) {
      validateParameterName(name);
    }
    validateSingleVariadicArgument(parameters);
  }

  private _configureCommand() {
    if (this.definition.parentCommand) {
      if (this.definition.parentCommand) {
        this.definition.parentCommand.addCommand(this);
      }
    }
    const parameters = this.definition.parameters ?? {};

    for (const [name, parameter] of Object.entries(parameters)) {
      if (parameter.type == 'argument') {
        this.configureArgument(name, parameter);
      } else if (parameter.type == 'option') {
        this.configureOption(name, parameter);
      }
    }
  }

  protected configureArgument(name: string, definition: ParameterDefinition) {
    const argument = new Argument(name, definition.description);
    argument.required = definition.required ?? true;
    argument.variadic = definition.variadic ?? false;
    definition.names = getParameterNames(
      name,
      definition,
      this.definition.environmentPrefix
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

  protected configureOption(name: string, definition: ParameterDefinition) {
    const optionDefinition = definition as OptionDefinition;
    const optionFlags = createOptionFlags(name, definition);
    const option = new Option(optionFlags, definition.description);
    definition.names = getParameterNames(
      name,
      definition,
      this.definition.environmentPrefix
    );
    if (this.definition.useEnvironment || definition.environment) {
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
    const context = this.context.parameters[name];
    this.on(`option:${option.name()}`, (value: string | undefined) => {
      if (context.definition.fromConfig) {
        const results = context.definition.fromConfig(value);
        context.value = results;
        this._resolveParametersFromSource(results);
      } else {
        // if value is undefined then it probably was a boolean flag
        context.value = value ?? (option.negate ? false : true);
      }
    });
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
        (this.definition.useEnvironment || arg.definition.environment)
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
    const schema = createValidationSchema(this.definition)?.passthrough();
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
    const schema = createValidationSchema(this.definition)?.passthrough();
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

  override addOption(option: Option): this {
    super.addOption(option);

    const name = option.attributeName();
    const definition: ParameterDefinition = {
      type: 'option',
      required: option.required ?? false,
      variadic: option.variadic,
      description: option.description,
      negate: option.negate,
      defaultValue: option.defaultValue,
    };
    definition.names = getParameterNames(name, definition);
    this.context.parameters[name] = this.context.options[name] = {
      type: 'option',
      name,
      definition,
      parameter: option,
      value: null,
    };

    return this;
  }

  override addArgument(arg: Argument): this {
    super.addArgument(arg);
    const definition: ParameterDefinition = {
      type: 'argument',
      required: arg.required ?? false,
      variadic: arg.variadic,
      description: arg.description,
    };
    const name = arg.name();
    definition.names = getParameterNames(name, definition);
    this.context.parameters[name] = this.context.arguments[name] = {
      type: 'argument',
      name,
      definition,
      parameter: arg,
      value: null,
    };

    return this;
  }

  override action(fn: (...args: any[]) => void | Promise<void>): this {
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
    if (this.definition.fromConfig) {
      const results = this.definition.fromConfig();
      this._resolveParametersFromSource(results);
    }
    const { operands, unknown } = super.parseOptions(argv);
    this._handleFromConfigArguments(operands);

    // injecting parameters into arguments is not supported by commander
    // so is handled here with `mergeArgumentsFromConfig`
    const resolvedOperands = mergeArgumentsFromConfig(
      operands,
      this.context.arguments
    );
    assignResolvedArgumentValues(resolvedOperands, this.context.arguments);

    const parametersResolved: ParametersResolved = {
      name: 'parameters-resolved',
      message: this.context,
    };
    this._eventBus.publish(parametersResolved);

    // run one more time, just in case subscribers updated parameters
    const finalResolvedOperands = mergeArgumentsFromConfig(
      resolvedOperands,
      this.context.arguments
    );
    return {
      operands: finalResolvedOperands,
      unknown,
    };
  }

  subscribe<T extends Event>(
    name: EventName<T>,
    subscriber: (event: T) => void
  ) {
    this._eventBus.subscribe(name, subscriber);
  }
}

export interface Command<
  TDefinition extends CommandDefinition = CommandDefinition
> {
  hook(
    event: HookEvent,
    listener: (
      props: CommandProps<TDefinition>['props'],
      extras: CommandProps<TDefinition>['extras'],
      thisCommand: Command,
      actionCommand: Command
    ) => void | Promise<void>
  ): this;

  action(
    fn: (
      props: CommandProps<TDefinition>['props'],
      extras: CommandProps<TDefinition>['extras'],
      command: Command
    ) => void | Promise<void>
  ): this;
}
