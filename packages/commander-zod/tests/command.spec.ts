import { Help } from 'commander';
import { z } from 'zod';
import { testLog } from '../../../shared/testkit';
import { CommandProps } from '../src';
import { Command } from '../src/lib/command';

it('should call action handler with no parameters', () => {
  const command = Command.create({
    name: 'args-parse-test',
  }).action((props) => {
    expect(props).toEqual({});
  });

  command.parse(['node', 'test']);

  const actual = command.processedArgs;
  expect(actual).toEqual([]);
});

it('should generate help with required arguments', () => {
  const command = Command.create({
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

  const helper = new Help();
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
  const command = Command.create({
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

  const helper = new Help();
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
  const command = Command.create({
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

  const helper = new Help();
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
        term: '--no-buzz [buzz]',
        description: 'buzz desc (env: BUZZ)',
      },
    },
  });
});

it('should call action handler with parsed arguments', () => {
  const command = Command.create({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
      },
      bar: {
        type: 'argument',
        required: true,
      },
    },
  }).action((props) => {
    expect(props).toEqual({
      foo: '1',
      bar: '2',
    });
  });

  command.parse(['node', 'test', '1', '2']);
});

it('should call action handler with parsed options and arguments', () => {
  const numberSchema = z
    .string()
    .transform((v) => parseInt(v))
    .optional();
  const command = Command.create({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      fizz: {
        type: 'option',
        schema: numberSchema,
        names: {
          alias: 'fz',
        },
      },
      buzz: {
        type: 'option',
        schema: numberSchema,
        defaultValue: '4',
      },
    },
  }).action((props) => {
    expect(props).toEqual({
      foo: 1,
      bar: 2,
      fizz: 3,
      buzz: 4,
    });
  });

  command.parse(['node', 'test', '1', '2', '-fz', '3']);
});

it('should call action handler with extra options', () => {
  const numberSchema = z
    .string()
    .transform((v) => parseInt(v))
    .optional();
  const command = Command.create({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      fizz: {
        type: 'option',
        schema: numberSchema,
        names: {
          alias: 'fz',
        },
      },
      buzz: {
        type: 'option',
        schema: numberSchema,
        defaultValue: '4',
      },
      boom: {
        type: 'option',
        fromConfig: () => ({
          ding: 'dong',
          ping: 'pong',
        }),
      },
    },
  }).action((props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: {
        foo: 1,
        bar: 2,
        fizz: 3,
        buzz: 4,
        boom: 'config',
      },
      extras: {
        args: [],
        props: {
          ding: 'dong',
          ping: 'pong',
        },
      },
    });
  });

  command.parse(['node', 'test', '1', '2', '-fz', '3', '--boom', 'config']);
});

it('should pass options from preAction hook to nested commmands', () => {
  const numberSchema = z.string().transform((v) => parseInt(v));
  const actual = {} as CommandProps;
  const parent = Command.create({
    name: 'parent',
    parameters: {
      foo: {
        type: 'option',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'option',
        schema: numberSchema.optional(),
      },
    },
  })
    .passThroughOptions()
    .enablePositionalOptions()
    .hook('preAction', (props, _, __, target) => {
      actual.props = {
        ...props,
      };
      target.setOptionValue('foo', props.foo);
      target.setOptionValue('bar', props.bar);
    });

  Command.create({
    name: 'nested',
    parentCommand: parent,
    parameters: {
      fizz: {
        type: 'option',
        required: true,
        schema: z.string(),
      },
      buzz: {
        type: 'option',
        variadic: true,
        schema: numberSchema.array().optional(),
      },
    },
  }).action((props, extras) => {
    actual.props = {
      ...props,
    };
    actual.extras = {
      ...extras,
    };
  });

  parent.parse([
    'node',
    'parent',
    '--bar',
    '2',
    '--foo',
    '1',
    'nested',
    '--fizz',
    '3',
    '--buzz',
    '4',
    '5',
    '6',
  ]);
  expect(actual).toEqual({
    props: {
      fizz: '3',
      buzz: [4, 5, 6],
    },
    extras: {
      args: [],
      props: { foo: 1, bar: 2 },
    },
  });
});

it('should call async nested actions', async () => {
  const numberSchema = z
    .string()
    .transform(async (v) => await Promise.resolve(parseInt(v)));
  const parent = Command.create({ name: 'parent' })
    .passThroughOptions()
    .enablePositionalOptions();
  Command.create({
    name: 'nested1',
    parentCommand: parent,
    fromConfig: () => ({
      foo: '1',
      bar: '2',
    }),
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: z.string(),
      },
      bar: {
        type: 'option',
        schema: z.string().optional(),
      },
    },
  }).action(async (props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: { foo: 'override', bar: 'override' },
      extras: {
        args: [],
        props: {},
      },
    });
    return Promise.resolve();
  });

  Command.create({
    name: 'nested2',
    parentCommand: parent,
    parameters: {
      fizz: {
        type: 'option',
        required: true,
        schema: z.string(),
      },
      buzz: {
        type: 'option',
        variadic: true,
        schema: numberSchema.array().optional(),
      },
    },
  }).action(async (props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: { fizz: '3', buzz: [4, 5, 6] },
      extras: {
        args: [],
        props: {},
      },
    });
    return Promise.resolve();
  });

  await parent.parseAsync([
    'node',
    'parent',
    'nested1',
    'override',
    '--bar',
    'override',
  ]);
  await parent.parseAsync([
    'node',
    'parent',
    'nested2',
    '--fizz',
    '3',
    '--buzz',
    '4',
    '5',
    '6',
  ]);
  expect.assertions(2);
});
