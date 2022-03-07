import { testLog } from 'testkit';
import { Command } from '../src/lib/command';
import { Help } from '../src/lib/help';

it('should generate help with required arguments', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    parameters: {
      foo: {
        type: 'argument',
        description: 'foo desc',
      },
      bar: {
        type: 'argument',
        description: 'bar desc',
      },
    },
  });
  const foo = command.context.arguments.foo.parameter;
  const bar = command.context.arguments.bar.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.argumentTerm(foo),
        description: helper.argumentDescription(foo),
      },
      bar: {
        term: helper.argumentTerm(bar),
        description: helper.argumentDescription(bar),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options] <foo> <bar>',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: 'foo',
        description: 'foo desc',
      },
      bar: {
        term: 'bar',
        description: 'bar desc',
      },
    },
  });
});

it('should generate help with required arguments and options', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    parameters: {
      foo: {
        type: 'argument',
        description: 'foo desc',
      },
      bar: {
        type: 'argument',
        description: 'bar desc',
      },
      fizz: {
        type: 'option',
        description: 'fizz desc',
      },
      buzz: {
        type: 'option',
        description: 'buzz desc',
      },
    },
  });
  const foo = command.context.arguments.foo.parameter;
  const bar = command.context.arguments.bar.parameter;
  const fizz = command.context.options.fizz.parameter;
  const buzz = command.context.options.buzz.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.argumentTerm(foo),
        description: helper.argumentDescription(foo),
      },
      bar: {
        term: helper.argumentTerm(bar),
        description: helper.argumentDescription(bar),
      },
    },
    options: {
      fizz: {
        term: helper.optionTerm(fizz),
        description: helper.optionDescription(fizz),
      },
      buzz: {
        term: helper.optionTerm(buzz),
        description: helper.optionDescription(buzz),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options] <foo> <bar>',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: 'foo',
        description: 'foo desc',
      },
      bar: {
        term: 'bar',
        description: 'bar desc',
      },
    },
    options: {
      fizz: {
        term: '--fizz [fizz]',
        description: 'fizz desc',
      },
      buzz: {
        term: '--buzz [buzz]',
        description: 'buzz desc',
      },
    },
  });
});

it('should generate help with required, optional, variadic, negated, default, and environment options', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    parameters: {
      foo: {
        type: 'option',
        description: 'foo desc',
        required: true,
      },
      bar: {
        type: 'option',
        description: 'bar desc',
        defaultValue: 'bar',
      },
      fizz: {
        type: 'option',
        description: 'fizz desc',
        variadic: true,
      },
      buzz: {
        type: 'option',
        description: 'buzz desc',
        negate: true,
        environment: true,
      },
    },
  });
  const foo = command.context.options.foo.parameter;
  const bar = command.context.options.bar.parameter;
  const fizz = command.context.options.fizz.parameter;
  const buzz = command.context.options.buzz.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.optionTerm(foo),
        description: helper.optionDescription(foo),
      },
      bar: {
        term: helper.optionTerm(bar),
        description: helper.optionDescription(bar),
      },
    },
    options: {
      fizz: {
        term: helper.optionTerm(fizz),
        description: helper.optionDescription(fizz),
      },
      buzz: {
        term: helper.optionTerm(buzz),
        description: helper.optionDescription(buzz),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options]',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: '--foo <foo>',
        description: 'foo desc',
      },
      bar: {
        term: '--bar [bar]',
        description: 'bar desc (default: "bar")',
      },
    },
    options: {
      fizz: {
        term: '--fizz [fizz...]',
        description: 'fizz desc',
      },
      buzz: {
        term: '--no-buzz',
        description: 'buzz desc (env: BUZZ)',
      },
    },
  });
});

it('should include all environment names when useEnvironment flag is set', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    useEnvironment: true,
    parameters: {
      foo: {
        type: 'argument',
        description: 'foo desc',
      },
      bar: {
        type: 'argument',
        description: 'bar desc',
      },
      fizz: {
        type: 'option',
        description: 'fizz desc',
        variadic: true,
      },
      buzz: {
        type: 'option',
        description: 'buzz desc',
        negate: true,
      },
    },
  });
  const foo = command.context.arguments.foo.parameter;
  const bar = command.context.arguments.bar.parameter;
  const fizz = command.context.options.fizz.parameter;
  const buzz = command.context.options.buzz.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.argumentTerm(foo),
        description: helper.argumentDescription(foo),
      },
      bar: {
        term: helper.argumentTerm(bar),
        description: helper.argumentDescription(bar),
      },
    },
    options: {
      fizz: {
        term: helper.optionTerm(fizz),
        description: helper.optionDescription(fizz),
      },
      buzz: {
        term: helper.optionTerm(buzz),
        description: helper.optionDescription(buzz),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options] <foo> <bar>',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: 'foo',
        description: 'foo desc (env: FOO)',
      },
      bar: {
        term: 'bar',
        description: 'bar desc (env: BAR)',
      },
    },
    options: {
      fizz: {
        term: '--fizz [fizz...]',
        description: 'fizz desc (env: FIZZ)',
      },
      buzz: {
        term: '--no-buzz',
        description: 'buzz desc (env: BUZZ)',
      },
    },
  });
});

it('should include all config names when includeConfigNameInParameterDescription flag is set', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    includeConfigNameInParameterDescriptions: true,
    parameters: {
      foo: {
        type: 'argument',
        description: 'foo desc',
      },
      bar: {
        type: 'argument',
        description: 'bar desc',
      },
      fizz: {
        type: 'option',
        description: 'fizz desc',
        variadic: true,
      },
      buzz: {
        type: 'option',
        description: 'buzz desc',
        negate: true,
      },
    },
  });
  const foo = command.context.arguments.foo.parameter;
  const bar = command.context.arguments.bar.parameter;
  const fizz = command.context.options.fizz.parameter;
  const buzz = command.context.options.buzz.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.argumentTerm(foo),
        description: helper.argumentDescription(foo),
      },
      bar: {
        term: helper.argumentTerm(bar),
        description: helper.argumentDescription(bar),
      },
    },
    options: {
      fizz: {
        term: helper.optionTerm(fizz),
        description: helper.optionDescription(fizz),
      },
      buzz: {
        term: helper.optionTerm(buzz),
        description: helper.optionDescription(buzz),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options] <foo> <bar>',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: 'foo',
        description: 'foo desc (config: foo)',
      },
      bar: {
        term: 'bar',
        description: 'bar desc (config: bar)',
      },
    },
    options: {
      fizz: {
        term: '--fizz [fizz...]',
        description: 'fizz desc (config: fizz)',
      },
      buzz: {
        term: '--no-buzz',
        description: 'buzz desc (config: buzz)',
      },
    },
  });
});

it('should include environment and config names when useEnvironment and includeConfigNameInParameterDescriptions flags are set', () => {
  const command = new Command({
    name: 'args-parse-test',
    description: 'arg parse test desc',
    useEnvironment: true,
    includeConfigNameInParameterDescriptions: true,
    parameters: {
      foo: {
        type: 'argument',
        description: 'foo desc',
      },
      bar: {
        type: 'argument',
        description: 'bar desc',
      },
      fizz: {
        type: 'option',
        description: 'fizz desc',
        variadic: true,
      },
      buzz: {
        type: 'option',
        description: 'buzz desc',
        negate: true,
      },
    },
  });
  const foo = command.context.arguments.foo.parameter;
  const bar = command.context.arguments.bar.parameter;
  const fizz = command.context.options.fizz.parameter;
  const buzz = command.context.options.buzz.parameter;

  const helper = new Help(command.definition);
  const actual = {
    command: {
      usage: helper.commandUsage(command),
      description: helper.commandDescription(command),
    },
    arguments: {
      foo: {
        term: helper.argumentTerm(foo),
        description: helper.argumentDescription(foo),
      },
      bar: {
        term: helper.argumentTerm(bar),
        description: helper.argumentDescription(bar),
      },
    },
    options: {
      fizz: {
        term: helper.optionTerm(fizz),
        description: helper.optionDescription(fizz),
      },
      buzz: {
        term: helper.optionTerm(buzz),
        description: helper.optionDescription(buzz),
      },
    },
  };
  testLog(actual);
  expect(actual).toEqual({
    command: {
      usage: 'args-parse-test [options] <foo> <bar>',
      description: 'arg parse test desc',
    },
    arguments: {
      foo: {
        term: 'foo',
        description: 'foo desc (env: FOO, config: foo)',
      },
      bar: {
        term: 'bar',
        description: 'bar desc (env: BAR, config: bar)',
      },
    },
    options: {
      fizz: {
        term: '--fizz [fizz...]',
        description: 'fizz desc (env: FIZZ, config: fizz)',
      },
      buzz: {
        term: '--no-buzz',
        description: 'buzz desc (env: BUZZ, config: buzz)',
      },
    },
  });
});
