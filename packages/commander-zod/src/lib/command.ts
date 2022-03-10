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
import { z } from 'zod';
import { EventBus, ParametersResolved } from './events';
import { Help } from './help';
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
  Event,
  EventName,
  OptionDefinition,
  ParameterDefinition,
} from './types';
import {
  validateParameterName,
  validateSingleVariadicArgument,
} from './validate';

declare module 'commander' {
  interface Command {
    _hasHelpOption: boolean;
    _helpLongFlag: string;
    _helpShortFlag: string;

    _exit(existCode: number, code: string, message: string): void;

    // Hack!
    // Desire: Allow parsing to be extended by derived classes.
    //
    // Problem: The `parse*` methods in the Commander base class call a private method
    // to do some pre-parse argument processing to support environments outside of Node (i.e. Electron),
    // but do not expose this method on their public interface.

    // Solution: To ensure our parsing behaves similarly to Commander's base implementation
    // this calls the private method directly.
    // TODO: Open a ticket to inquire on a better approach or feature request.
    _prepareUserArgs(
      argv?: readonly string[],
      options?: ParseOptions
    ): string[];
  }
}

export type ExtraProps = {
  extras: {
    args: string[];
    props: Record<string, unknown>;
  };
};
export type ParentProps<T extends CommandDefinition> = T extends {
  parentCommand: infer Base;
}
  ? Base extends Command<infer Schema>
    ? {
        parent: CommandProps<Schema>;
      }
    : { parent: Record<string, unknown> }
  : { parent: Record<string, unknown> };
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
      } & ParentProps<T> &
        ExtraProps
    : { props: Record<string, unknown> } & ParentProps<T> & ExtraProps;

export class Command<
  TDefinition extends CommandDefinition = CommandDefinition
> extends BaseCommand {
  definition: CommandDefinition;
  context: CommandContext = {
    arguments: {},
    options: {},
    parameters: {},
  };
  protected usesAsyncContext = false;
  private _eventBus: EventBus;
  private _parseOptionsResult?: ParseOptionsResult;
  private _hasParseExecuted = false;

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
    if (definition.choices) {
      argument.choices(definition.choices);
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
    if (
      (this.definition.useEnvironment && definition.environment != false) ||
      definition.environment
    ) {
      option.env(definition.names?.env ?? '');
    }
    if (definition.defaultValue) {
      option.default(definition.defaultValue);
    }
    if (definition.choices) {
      option.choices(definition.choices);
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
        this._resolveParametersFromSources(results);
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
        this._resolveParametersFromSources(result);
      }

      if (
        !arg.value &&
        (this.definition.useEnvironment || arg.definition.environment)
      ) {
        arg.value = process.env[arg.definition.names?.env ?? ''];
      }
    }
  }

  private _resolveParametersFromSources(
    source: Record<string, unknown>,
    type: 'config' | 'env' = 'config'
  ) {
    for (const [name, value] of Object.entries(source)) {
      // find parameters matching the config name override or name
      const context = Object.values(this.context.parameters).find(
        (param) => name == param.definition.names?.[type] ?? param.name
      );
      if (
        context &&
        ((this.definition.useEnvironment &&
          context.definition.environment != false) ||
          context.definition.environment)
      ) {
        context.value = value;
        if (context.type == 'option') {
          this.setOptionValueWithSource(name, value, 'env');
        }
      }
      if (context && context.definition.useConfig != false) {
        context.value = value;
        if (context.type == 'option') {
          this.setOptionValueWithSource(name, value, 'config');
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

  protected parseProps(): CommandProps {
    const schema = createValidationSchema(this.definition)?.passthrough();
    const props = this._mapValuesToProps();
    return {
      props: schema ? schema.parse(props.props) : { ...props.props },
      extras: {
        ...props.extras,
      },
      parent:
        this.parent && (this.parent as Command).parseProps
          ? (this.parent as Command).parseProps()
          : {},
    };
  }

  protected async parsePropsAsync(): Promise<CommandProps> {
    const schema = createValidationSchema(this.definition)?.passthrough();

    const props = this._mapValuesToProps();
    return {
      props: schema ? await schema.parseAsync(props.props) : { ...props.props },
      extras: {
        ...props.extras,
      },
      parent:
        this.parent && (this.parent as Command).parsePropsAsync
          ? await (this.parent as Command).parsePropsAsync()
          : {},
    };
  }

  protected isSynchronousParseValid() {
    return !this.usesAsyncContext;
  }

  protected outputHelpIfRequested(params: string[]) {
    const hasHelpOption =
      this._hasHelpOption &&
      params.find(
        (param) => param == this._helpLongFlag || param == this._helpShortFlag
      );
    if (hasHelpOption) {
      this.outputHelp();
      this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
    }
  }

  override createHelp(): Help {
    const help = new Help(this.definition);
    const configuration = this.configureHelp();
    return Object.assign(help, configuration);
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
      if (this.usesAsyncContext) {
        return this.parsePropsAsync().then((res) => {
          const { props, extras, parent } = res;
          fn(props, extras, parent, this);
        });
      } else {
        const { props, extras, parent } = this.parseProps();
        fn(props, extras, parent, this);
      }
    });
    return this;
  }

  override hook(
    event: HookEvent,
    fn: (...args: any[]) => void | Promise<void>
  ): this {
    super.hook(event, (thisCommand, srcCommand) => {
      if (this.usesAsyncContext) {
        return this.parsePropsAsync().then((res) => {
          const { props, extras, parent } = res;
          fn(props, extras, parent, thisCommand, srcCommand);
        });
      } else {
        const { props, extras, parent } = this.parseProps();
        fn(props, extras, thisCommand, parent, srcCommand);
      }
    });
    return this;
  }

  private _enableAsyncContext() {
    this.usesAsyncContext = true;
    const children = this.commands as Command[];
    for (const child of children) {
      child.usesAsyncContext = true;
    }
  }

  override async parseAsync(
    argv?: readonly string[],
    options?: ParseOptions
  ): Promise<this> {
    // Desire: Here we want to explicitly use promises for parsing parameters to give
    // derived classes the option of using asynchronous methods during parameter
    // parsing.
    //
    // Problem: The Commander API doesn't allow you to use promises during the
    // option parsing phase.

    // Solution: In order to skirt around this, we call our own `parseOptionsAsync`
    // and then cache the result. Then when Commander calls the synchronous version
    // `parseOptions` we can just return the cached result we already processed.
    this._enableAsyncContext();
    this.validateParse();
    const preparedArgs = this._prepareUserArgs(argv, options) as string[];
    const { operands, unknown } = await this.parseOptionsAsync(preparedArgs);
    this._parseOptionsResult = {
      operands,
      unknown,
    };
    await super.parseAsync(argv, options);
    this._hasParseExecuted = true;
    return this;
  }

  protected validateParse() {
    if (this._hasParseExecuted) {
      this.error(
        'Parsing has already been executed. Please instantiate a new command to execute parsing again.'
      );
    }
    if (!this.usesAsyncContext) {
      const children = this.commands as Command[];
      let isParseValid = this.isSynchronousParseValid();
      for (const child of children) {
        isParseValid &&= child.isSynchronousParseValid();
      }
      if (!isParseValid) {
        this.error(
          `Synchronous parsing is invalid for this command [${this.name()}]. Use the parseAsync method instead.`
        );
      }
    }
  }

  override parse(argv?: readonly string[], options?: ParseOptions): this {
    this.validateParse();
    super.parse(argv, options);
    this._hasParseExecuted = true;
    return this;
  }

  protected async parseNestedCommandOptions(
    operands: string[],
    unknown: string[]
  ) {
    const children = this.commands as (Command | BaseCommand)[];
    const possibleChildOperation = operands[0];
    const childCommand = children.find(
      (cmd) => cmd.name() == possibleChildOperation
    );
    if (childCommand && (childCommand as Command).parseOptionsAsync) {
      await (childCommand as Command).parseOptionsAsync([
        ...operands.slice(1),
        ...unknown,
      ]);
    }
  }

  protected async parseOptionsAsync(
    argv: string[]
  ): Promise<ParseOptionsResult> {
    const { operands, unknown } = this.parseOptions(argv);
    if (!this.commands.some((cmd) => cmd.name() == operands?.[0])) {
      this.outputHelpIfRequested(unknown);
    }
    await this.parseNestedCommandOptions(operands, unknown);

    const finalResolvedOperands = mergeArgumentsFromConfig(
      operands,
      this.context.arguments
    );

    return { operands: finalResolvedOperands, unknown };
  }

  override parseOptions(argv: string[]): ParseOptionsResult {
    if (this._parseOptionsResult) {
      return this._parseOptionsResult;
    }
    if (this.definition.fromConfig) {
      const results = this.definition.fromConfig();
      this._resolveParametersFromSources(results);
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
      parent: CommandProps<TDefinition>['parent'],
      thisCommand: Command,
      actionCommand: Command
    ) => void | Promise<void>
  ): this;

  action(
    fn: (
      props: CommandProps<TDefinition>['props'],
      extras: CommandProps<TDefinition>['extras'],
      parent: CommandProps<TDefinition>['parent'],
      command: Command
    ) => void | Promise<void>
  ): this;
}
