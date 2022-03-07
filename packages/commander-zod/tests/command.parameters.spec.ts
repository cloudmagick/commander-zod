import { testLog } from 'testkit';
import { z } from 'zod';
import { CommandProps } from '../src';
import { Command } from '../src/lib/command';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

it('should parse required arguments', () => {
  const command = new Command({
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
  });

  command.parse(['node', 'test', 'foo', 'bar']);

  const actual = command.processedArgs;
  expect(actual).toEqual(['foo', 'bar']);
});

it('should parse arguments from command definition config', () => {
  const command = new Command({
    name: 'args-parse-test',
    fromConfig: () => ({
      foo: '1',
      bar: '2',
    }),
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
  });

  command.parse(['node', 'test']);

  const actual = command.processedArgs;
  expect(actual).toEqual(['1', '2']);
});

it('should parse parameters from argument definition config', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      config: {
        type: 'argument',
        required: true,
        fromConfig: () => ({
          foo: '1',
          bar: '2',
          fizz: '3',
          buzz: '4',
        }),
      },
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  command.parse(['node', 'test', 'config']);

  const actual = {
    args: command.processedArgs,
    options: command.opts(),
  };
  expect(actual).toEqual({
    args: ['config', '1', '2'],
    options: {
      fizz: '3',
      buzz: '4',
    },
  });
});

it('should parse parameters from environment', () => {
  const command = new Command({
    name: 'args-parse-test',
    useEnvironment: true,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  process.env['FOO'] = '1';
  process.env['BAR'] = '2';
  process.env['FIZZ'] = '3';
  process.env['BUZZ'] = '4';

  command.parse(['node', 'test']);

  const actual = {
    args: command.processedArgs,
    options: command.opts(),
  };
  expect(actual).toEqual({
    args: ['1', '2'],
    options: {
      fizz: '3',
      buzz: '4',
    },
  });
});

it('should parse parameters from environment', () => {
  const command = new Command({
    name: 'args-parse-test',
    useEnvironment: true,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  process.env['FOO'] = '1';
  process.env['BAR'] = '2';
  process.env['FIZZ'] = '3';
  process.env['BUZZ'] = '4';

  command.parse(['node', 'test']);

  const actual = {
    args: command.processedArgs,
    options: command.opts(),
  };
  expect(actual).toEqual({
    args: ['1', '2'],
    options: {
      fizz: '3',
      buzz: '4',
    },
  });
});

it('should parse parameters from config and environment', () => {
  const command = new Command({
    name: 'args-parse-test',
    useEnvironment: true,
    environmentPrefix: 'JEST_',
    fromConfig: () => ({
      foo: '1',
      bar: '2',
    }),
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  process.env['JEST_FIZZ'] = '3';
  process.env['JEST_BUZZ'] = '4';

  command.parse(['node', 'test']);

  const actual = {
    args: command.processedArgs,
    options: command.opts(),
  };
  expect(actual).toEqual({
    args: ['1', '2'],
    options: {
      fizz: '3',
      buzz: '4',
    },
  });
});

it('should set appropriate properties for option creation flags', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'option',
        required: true,
      },
      bar: {
        type: 'option',
        variadic: true,
      },
      fizz: {
        type: 'option',
        negate: true,
      },
    },
  });
  const foo = command.context.options.foo.parameter;
  const bar = command.context.options.bar.parameter;
  const fizz = command.context.options.fizz.parameter;

  const actual = {
    foo: {
      require: foo.required,
      optional: foo.optional,
      default: 'foo',
    },
    bar: {
      require: bar.required,
      optional: bar.optional,
      variadic: bar.variadic,
    },
    fizz: {
      require: fizz.required,
      optional: fizz.optional,
      negate: fizz.negate,
    },
  };

  testLog(actual);
  expect(actual).toEqual({
    foo: {
      require: true,
      optional: false,
      default: 'foo',
    },
    bar: {
      require: false,
      optional: true,
      variadic: true,
    },
    fizz: {
      require: false,
      optional: false,
      negate: true,
    },
  });
});

it('should parse options from option definition config', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      config: {
        type: 'option',
        required: true,
        fromConfig: () => ({
          foo: '1',
          bar: '2',
        }),
      },
      foo: {
        type: 'option',
        required: true,
      },
      bar: {
        type: 'option',
        required: true,
      },
    },
  });

  command.parse(['node', 'test', '--config=config']);

  const actual = command.opts();
  expect(actual).toEqual({
    config: 'config',
    foo: '1',
    bar: '2',
  });
});

it('should parse options from option definition config', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      config: {
        type: 'option',
        required: true,
        fromConfig: () => ({
          foo: '1',
          bar: '2',
        }),
      },
      foo: {
        type: 'option',
        required: true,
      },
      bar: {
        type: 'option',
        required: true,
      },
    },
  });

  command.parse(['node', 'test', '--config=config']);

  const actual = command.opts();
  expect(actual).toEqual({
    config: 'config',
    foo: '1',
    bar: '2',
  });
});

it('should allow custom configuration of parameters via commander', () => {
  const command = new Command({
    name: 'command',
    parameters: {
      foo: {
        type: 'argument',
        configure: (arg) => arg.choices(['one', 'two', 'three']),
      },
      bar: {
        type: 'option',
        configure: (opt) => opt.makeOptionMandatory(true),
      },
    },
  });

  command.parse(['node', 'command', 'three', '--bar']);

  const actual = {
    args: command.processedArgs,
    opts: command.opts(),
  };
  expect(actual).toEqual({
    args: ['three'],
    opts: {
      bar: true,
    },
  });
});

it('should allow additional parameters configured via Commander', async () => {
  const numberSchema = z
    .string()
    .transform(async (v) => await Promise.resolve(parseInt(v)));
  const actual = {} as CommandProps;
  const command = new Command({
    name: 'command',
    fromConfig: () => ({
      foo: '1',
      bar: '2',
    }),
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'option',
        schema: numberSchema.optional(),
      },
    },
  })
    .argument('<arg>', 'arg desc')
    .option('--fizz <fizz>', 'fizz desc', (value) => parseInt(value))
    .option('--buzz [buzz]', 'buzz desc', (value) => parseInt(value))
    .action(async (props, extras) => {
      actual.props = { ...props };
      actual.extras = { ...extras };
    });

  await command.parseAsync([
    'node',
    'test',
    'arg',
    '--fizz',
    '3',
    '--buzz',
    '4',
  ]);

  expect(actual).toEqual({
    props: {
      foo: 1,
      bar: 2,
      fizz: 3,
      buzz: 4,
      arg: 'arg',
    },
    extras: {
      args: [],
      props: {},
    },
  });
});

it('should include in context all resolved argument and option values before running command', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  command.parse([
    'node',
    'test',
    'foo',
    'bar',
    '--fizz',
    'fizz',
    '--buzz',
    'buzz',
  ]);
  const parameters = command.context.parameters;
  const actual = {
    foo: parameters.foo.value,
    bar: parameters.bar.value,
    fizz: parameters.fizz.value,
    buzz: parameters.buzz.value,
  };
  expect(actual).toEqual({
    foo: 'foo',
    bar: 'bar',
    fizz: 'fizz',
    buzz: 'buzz',
  });
});

it('should override source values with cli parameters', () => {
  const command = new Command({
    name: 'args-parse-test',
    useEnvironment: true,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        required: true,
        fromConfig: () => ({ foo: 'config' }),
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        required: true,
      },
      fizz: {
        type: 'option',
      },
      buzz: {
        type: 'option',
      },
    },
  });

  process.env['FIZZ'] = 'env';

  command.parse([
    'node',
    'test',
    'foo',
    'bar',
    '--fizz',
    'fizz',
    '--buzz',
    'buzz',
  ]);
  const parameters = command.context.parameters;
  const actual = {
    foo: parameters.foo.value,
    bar: parameters.bar.value,
    fizz: parameters.fizz.value,
    buzz: parameters.buzz.value,
  };
  expect(actual).toEqual({
    foo: 'foo',
    bar: 'bar',
    fizz: 'fizz',
    buzz: 'buzz',
  });
});
